import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import {
  createPaymentLink,
  toCents,
  InfinitePayError,
  type InfinitePayItem,
  type InfinitePayCustomer,
  type InfinitePayAddress,
} from '@/lib/infinitepay'

// Idempotência: reusa o link existente se for da mesma Order pending e ainda
// está dentro da janela. A Infinity não documenta TTL exato — usamos 1h como
// safety net (depois disso, geramos novo link).
const REUSE_WINDOW_MS = 60 * 60 * 1000 // 1h

/**
 * Normaliza telefone pro padrão E.164 que a Infinity Pay aceita.
 * Aceita "(11) 99999-9999" → "+5511999999999".
 * Retorna undefined se vazio ou inválido (a Infinity aceita pedido sem phone).
 */
function normalizePhone(raw: string | null | undefined): string | undefined {
  if (!raw) return undefined
  const digits = raw.replace(/\D/g, '')
  if (digits.length < 10) return undefined
  // Se já tem DDI (12+ dígitos começando com 55), só prefixa com +
  if (digits.length >= 12 && digits.startsWith('55')) return `+${digits}`
  // Caso comum BR: 10-11 dígitos sem DDI → adiciona +55
  return `+55${digits}`
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
    }
    // Defesa em camadas: admin nunca chega aqui (checkout já bloqueia), mas
    // se chegar, recusa.
    if (session.user.role === 'admin') {
      return NextResponse.json({ error: 'Contas admin não realizam compras' }, { status: 403 })
    }

    const body = (await req.json().catch(() => null)) as { orderId?: unknown } | null
    const orderId = typeof body?.orderId === 'string' ? body.orderId : null
    if (!orderId) {
      return NextResponse.json({ error: 'orderId é obrigatório' }, { status: 400 })
    }

    // Anti-IDOR: query JÁ filtra por userId — ninguém consegue ler order de outrem
    const order = await prisma.order.findFirst({
      where: { id: orderId, userId: session.user.id },
      include: {
        items: {
          include: {
            product: { select: { name: true } },
          },
        },
        address: true,
      },
    })

    if (!order) {
      // 404 genérico mesmo se a order existir mas pertencer a outro user (anti-enumeração)
      return NextResponse.json({ error: 'Pedido não encontrado' }, { status: 404 })
    }

    if (order.paymentStatus === 'paid') {
      return NextResponse.json({ error: 'Pedido já foi pago' }, { status: 409 })
    }

    // Idempotência: se já temos URL salva pra essa Order pending e foi criada
    // recentemente, reusa em vez de gerar link novo na Infinity.
    if (
      order.infinitepayCheckoutUrl &&
      order.paymentStatus === 'pending' &&
      Date.now() - order.createdAt.getTime() < REUSE_WINDOW_MS
    ) {
      return NextResponse.json({ url: order.infinitepayCheckoutUrl, reused: true })
    }

    // Monta items[] com preço recalculado DO BANCO (segurança — nunca confiar
    // no que veio do cliente). OrderItem.unitPrice já foi gravado no momento
    // de criar a Order via lógica server-side existente; mas pra blindar,
    // recalculamos o subtotal e checamos que bate.
    const items: InfinitePayItem[] = order.items.map((item) => {
      const productName = item.product?.name ?? item.productName ?? 'Item'
      const sizeLabel = item.size ? ` — Tam ${item.size.toUpperCase()}` : ''
      const customLabel =
        item.hasCustomization && (item.customName || item.customNumber)
          ? ` (${item.customName ?? ''}${item.customNumber ? ` #${item.customNumber}` : ''})`
          : ''
      return {
        quantity: item.quantity,
        price: toCents(item.unitPrice),
        description: `${productName}${sizeLabel}${customLabel}`.trim(),
      }
    })

    // Sanity-check: soma dos itens + frete - desconto deve bater com order.total
    const computedSubtotalCents = items.reduce((sum, i) => sum + i.price * i.quantity, 0)
    const expectedTotalCents =
      computedSubtotalCents + toCents(order.freightCost) - toCents(order.discountAmount)
    if (Math.abs(expectedTotalCents - toCents(order.total)) > 2) {
      // Tolerância de 2 centavos pra arredondamento. Divergência maior = bug,
      // recusa pra evitar cobrar valor errado do cliente.
      console.error('[create-link] Divergência no total:', {
        orderId,
        computedSubtotalCents,
        freightCents: toCents(order.freightCost),
        discountCents: toCents(order.discountAmount),
        expectedTotalCents,
        orderTotalCents: toCents(order.total),
      })
      return NextResponse.json(
        { error: 'Inconsistência no valor do pedido — contate o suporte' },
        { status: 500 },
      )
    }

    // Customer — pega do user logado (perfil mais completo)
    const customer: InfinitePayCustomer = {
      name: session.user.name ?? order.address?.recipientName ?? 'Cliente Gabinete FC',
      email: session.user.email,
      phone_number:
        normalizePhone(order.address?.recipientPhone) ??
        // Pega phone do user também — schema User tem campo `phone`
        undefined,
    }

    // Address — opcional pra Infinity mas mandamos sempre pra antifraude deles
    let address: InfinitePayAddress | undefined
    if (order.address) {
      address = {
        cep: order.address.zipCode.replace(/\D/g, ''),
        street: order.address.street,
        number: order.address.number,
        neighborhood: order.address.neighborhood,
        ...(order.address.complement ? { complement: order.address.complement } : {}),
      }
    }

    const baseUrl =
      process.env.NEXT_PUBLIC_SITE_URL ??
      process.env.NEXT_PUBLIC_APP_URL ??
      'http://localhost:3000'

    const { url } = await createPaymentLink({
      orderId: order.id,
      items,
      customer,
      address,
      redirectUrl: `${baseUrl}/checkout/sucesso`,
      webhookUrl: `${baseUrl}/api/infinitepay/webhook`,
    })

    // Persiste APENAS a URL retornada. NÃO tenta extrair invoice_slug
    // — esse é autoritativo só pelo webhook.
    await prisma.order.update({
      where: { id: order.id },
      data: { infinitepayCheckoutUrl: url, paymentMethod: 'infinitepay' },
    })

    return NextResponse.json({ url, reused: false })
  } catch (err) {
    if (err instanceof InfinitePayError) {
      console.error('[/api/infinitepay/create-link] InfinitePayError:', {
        status: err.status,
        message: err.message,
        body: err.responseBody,
      })
      return NextResponse.json(
        { error: 'Falha ao gerar link de pagamento. Tente novamente.' },
        { status: 502 },
      )
    }
    console.error('[/api/infinitepay/create-link] Erro inesperado:', err)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
