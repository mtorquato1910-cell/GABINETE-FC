import { NextRequest, NextResponse } from 'next/server'
import type Stripe from 'stripe'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { getStripe } from '@/lib/stripe'

// Stripe Brasil não libera installments por padrão. Mantido OFF até MP.
const INSTALLMENTS_ENABLED = process.env.STRIPE_INSTALLMENTS_ENABLED === 'true'

// Status de PaymentIntent que ainda podem ser pagos (reuso permitido)
const REUSABLE_INTENT_STATUSES: Stripe.PaymentIntent.Status[] = [
  'requires_payment_method',
  'requires_confirmation',
  'requires_action',
  'processing',
]

export async function POST(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
    }

    const { orderId } = await req.json()
    if (!orderId || typeof orderId !== 'string') {
      return NextResponse.json({ error: 'orderId é obrigatório' }, { status: 400 })
    }

    // Fix IDOR: query JÁ filtra por userId — sem possibilidade de ler order de outrem
    const order = await prisma.order.findFirst({
      where: { id: orderId, userId: session.user.id },
      include: { items: { select: { quantity: true } } },
    })

    if (!order) {
      // 404 genérico mesmo se a order existir mas pertencer a outro user (anti-enumeração)
      return NextResponse.json({ error: 'Pedido não encontrado' }, { status: 404 })
    }

    if (order.paymentStatus === 'paid') {
      return NextResponse.json({ error: 'Pedido já foi pago' }, { status: 409 })
    }

    const stripe = getStripe()
    const itemCount = order.items.reduce((acc, i) => acc + i.quantity, 0)
    const amountCents = Math.round(order.total * 100)

    // Idempotência: se já existe um intent pra essa order, reusa quando possível
    if (order.stripePaymentIntentId) {
      try {
        const existing = await stripe.paymentIntents.retrieve(order.stripePaymentIntentId)
        const sameAmount = existing.amount === amountCents
        const reusable = REUSABLE_INTENT_STATUSES.includes(existing.status)
        if (sameAmount && reusable && existing.client_secret) {
          return NextResponse.json({ clientSecret: existing.client_secret })
        }
        // Se o valor mudou (cupom aplicado entretanto) ou intent expirou, cancela e cria novo
        if (reusable) {
          await stripe.paymentIntents.cancel(existing.id).catch(() => undefined)
        }
      } catch (err) {
        console.warn('[create-intent] retrieve existing intent failed:', err)
        // segue criando novo
      }
    }

    const params: Stripe.PaymentIntentCreateParams = {
      amount: amountCents,
      currency: 'brl',
      automatic_payment_methods: { enabled: true },
      metadata: {
        orderId: order.id,
        userId: order.userId,
        itemCount: String(itemCount),
      },
    }

    if (INSTALLMENTS_ENABLED) {
      params.payment_method_options = { card: { installments: { enabled: true } } }
    }

    let paymentIntent: Stripe.PaymentIntent
    try {
      paymentIntent = await stripe.paymentIntents.create(params, {
        // Chave de idempotência server-side: mesma combinação retorna mesmo intent
        idempotencyKey: `order_${order.id}_${amountCents}`,
      })
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err)
      if (INSTALLMENTS_ENABLED && /installments/i.test(message)) {
        console.warn('[Stripe] installments off, retrying without:', message)
        delete params.payment_method_options
        paymentIntent = await stripe.paymentIntents.create(params, {
          idempotencyKey: `order_${order.id}_${amountCents}_noinst`,
        })
      } else {
        throw err
      }
    }

    await prisma.order.update({
      where: { id: orderId },
      data: { stripePaymentIntentId: paymentIntent.id },
    })

    return NextResponse.json({ clientSecret: paymentIntent.client_secret })
  } catch (err) {
    console.error('[Stripe create-intent]', err)
    return NextResponse.json({ error: 'Erro ao criar pagamento' }, { status: 500 })
  }
}
