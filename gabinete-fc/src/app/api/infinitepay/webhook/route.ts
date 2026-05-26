import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { checkPayment, toCents, InfinitePayError } from '@/lib/infinitepay'
import { sendOrderConfirmation } from '@/lib/actions/email'
import { addPurchasePoints } from '@/lib/actions/loyalty'

/**
 * Webhook da Infinity Pay.
 *
 * SEGURANÇA: Infinity Pay NÃO assina o webhook (sem HMAC). A defesa é
 * chamar POST /payment_check pra confirmar o pagamento via callback —
 * SEMPRE antes de marcar Order como paga.
 *
 * REGRA OPERACIONAL: Responder 200 OK em <1s, sempre, mesmo em falha de
 * validação. Se respondermos 400, a Infinity Pay reenvia em loop.
 * Errors viram log estruturado pra audit, não resposta 4xx/5xx.
 */
export async function POST(req: NextRequest) {
  let body: WebhookBody | null = null
  try {
    body = (await req.json()) as WebhookBody
  } catch {
    console.error('[infinitepay/webhook] body não-JSON, ignorando')
    return NextResponse.json({ ok: true })
  }

  const { invoice_slug, order_nsu, transaction_nsu, amount } = body ?? {}

  if (!invoice_slug || !order_nsu || !transaction_nsu) {
    console.warn('[infinitepay/webhook] body incompleto, ignorando', { body })
    return NextResponse.json({ ok: true })
  }

  // ─── Idempotência: já processado? ────────────────────────────
  // Match por transaction_nsu unique → se essa transação já marcou paid, encerra.
  const existingProcessed = await prisma.order.findFirst({
    where: { infinitepayTransactionNsu: transaction_nsu, paymentStatus: 'paid' },
    select: { id: true },
  })
  if (existingProcessed) {
    console.log('[infinitepay/webhook] idempotente — já processado', {
      orderId: existingProcessed.id,
      transaction_nsu,
    })
    return NextResponse.json({ ok: true, idempotent: true })
  }

  // ─── Defesa anti-fraude: callback payment_check ──────────────
  let verification
  try {
    verification = await checkPayment({
      orderId: order_nsu,
      transactionNsu: transaction_nsu,
      invoiceSlug: invoice_slug,
    })
  } catch (err) {
    const status = err instanceof InfinitePayError ? err.status : undefined
    console.error('[infinitepay/webhook] payment_check falhou', {
      order_nsu,
      transaction_nsu,
      status,
      err: err instanceof Error ? err.message : String(err),
    })
    // Devolve 200 pra Infinity NÃO reenviar — mas não marca paid.
    // Se for falha transitória, o cliente pode reabrir a tela "aguardando" e
    // a gente repete o check via /checkout/sucesso ou o cron expirados.
    return NextResponse.json({ ok: true, verified: false })
  }

  // ─── Validações HARD ─────────────────────────────────────────
  if (!verification.success || !verification.paid) {
    console.warn('[infinitepay/webhook] payment_check retornou não-pago', {
      order_nsu,
      transaction_nsu,
      verification,
    })
    return NextResponse.json({ ok: true, verified: true, paid: false })
  }

  // Carrega Order do banco
  const order = await prisma.order.findUnique({
    where: { id: order_nsu },
    include: { items: true, user: { select: { id: true, email: true, name: true } } },
  })

  if (!order) {
    console.error('[infinitepay/webhook] Order não encontrada', { order_nsu })
    return NextResponse.json({ ok: true, verified: true, error: 'order_not_found' })
  }

  // Valida valor: payment_check.amount === order.total em centavos
  const expectedCents = toCents(order.total)
  if (verification.amount !== expectedCents) {
    console.error('[infinitepay/webhook] divergência de valor — possível tentativa de fraude', {
      order_nsu,
      transaction_nsu,
      expectedCents,
      verifiedAmount: verification.amount,
      webhookAmount: amount,
    })
    return NextResponse.json({ ok: true, verified: true, error: 'amount_mismatch' })
  }

  // ─── Transaction atômica: status + movimentações de estoque ──
  // O WHERE inclui paymentStatus='pending' — se outro request paralelo já
  // marcou como paid, esse update vira no-op (affected=0) e abortamos
  // pra não duplicar email/estoque.
  let didTransition = false
  try {
    didTransition = await prisma.$transaction(async (tx) => {
      const updateResult = await tx.order.updateMany({
        where: { id: order.id, paymentStatus: 'pending' },
        data: {
          paymentStatus: 'paid',
          status: 'confirmed',
          paidAt: new Date(),
          installments: verification.installments,
          captureMethod: verification.capture_method,
          infinitepayInvoiceSlug: invoice_slug,
          infinitepayTransactionNsu: transaction_nsu,
          infinitepayReceiptUrl: body.receipt_url ?? null,
        },
      })

      // Race detectada — alguém já marcou paid, abortamos.
      if (updateResult.count === 0) return false

      // Cria StockMovement out pra cada item (rastreabilidade)
      for (const item of order.items) {
        await tx.stockMovement.create({
          data: {
            productId: item.productId,
            size: item.size,
            type: 'out',
            quantity: item.quantity,
            reason: `Venda — Pedido #${order.id.slice(-8).toUpperCase()}`,
          },
        })
      }

      // Histórico de ação no Order
      await tx.orderHistory.create({
        data: {
          orderId: order.id,
          action: 'payment_confirmed',
          fromStatus: 'pending',
          toStatus: 'confirmed',
          note: `Infinity Pay · ${verification.capture_method} · ${verification.installments}x`,
        },
      })

      return true
    })
  } catch (err) {
    console.error('[infinitepay/webhook] transaction falhou', {
      orderId: order.id,
      err: err instanceof Error ? err.message : String(err),
    })
    return NextResponse.json({ ok: true, verified: true, error: 'transaction_failed' })
  }

  if (!didTransition) {
    console.log('[infinitepay/webhook] race detectada — outro request já marcou paid', {
      orderId: order.id,
      transaction_nsu,
    })
    return NextResponse.json({ ok: true, idempotent: true })
  }

  console.log('[infinitepay/webhook] pagamento confirmado', {
    orderId: order.id,
    capture_method: verification.capture_method,
    installments: verification.installments,
    amountCents: verification.amount,
  })

  // ─── Pontos de fidelidade ───────────────────────────────────
  // Roda DEPOIS da transaction (não-atômico de propósito): se o cálculo de
  // pontos falhar, não queremos reverter a confirmação do pedido — o cliente
  // já pagou. Admin pode creditar manualmente via log.
  if (order.user?.id) {
    try {
      await addPurchasePoints(order.id, order.user.id, order.total)
    } catch (err) {
      console.error('[infinitepay/webhook] addPurchasePoints falhou', {
        orderId: order.id,
        userId: order.user.id,
        err: err instanceof Error ? err.message : String(err),
      })
    }
  }

  // ─── Fire-and-forget: email de confirmação ──────────────────
  // Não bloqueamos a response da Infinity. Se o email falhar, log fica registrado.
  if (order.user?.email) {
    sendOrderConfirmation({
      to: order.user.email,
      customerName: order.user.name ?? 'Cliente',
      orderId: order.id,
      total: order.total,
      items: order.items.map((i) => ({
        name: i.productName,
        size: i.size,
        quantity: i.quantity,
        price: i.unitPrice,
        hasCustomization: i.hasCustomization,
        customName: i.customName,
        customNumber: i.customNumber,
      })),
    }).catch((err) =>
      console.error('[infinitepay/webhook] email fire-and-forget falhou', err),
    )
  }

  return NextResponse.json({ ok: true, processed: true })
}

interface WebhookBody {
  invoice_slug?: string
  order_nsu?: string
  transaction_nsu?: string
  amount?: number
  paid_amount?: number
  installments?: number
  capture_method?: string
  receipt_url?: string
  items?: unknown
}
