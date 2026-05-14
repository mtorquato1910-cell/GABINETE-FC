import { NextRequest, NextResponse } from 'next/server'
import type Stripe from 'stripe'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { getStripe } from '@/lib/stripe'

// Stripe Brasil não libera installments por padrão pra todas as contas.
// Mantemos DESABILITADO até migrar pra gateway com parcelamento nativo (Mercado Pago).
// Pode ativar via env STRIPE_INSTALLMENTS_ENABLED=true se sua conta tiver.
const INSTALLMENTS_ENABLED = process.env.STRIPE_INSTALLMENTS_ENABLED === 'true'

export async function POST(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
    }

    const { orderId } = await req.json()
    if (!orderId) {
      return NextResponse.json({ error: 'orderId é obrigatório' }, { status: 400 })
    }

    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { items: { select: { quantity: true } } },
    })

    if (!order) {
      return NextResponse.json({ error: 'Pedido não encontrado' }, { status: 404 })
    }

    if (order.userId !== session.user.id) {
      return NextResponse.json({ error: 'Acesso negado' }, { status: 403 })
    }

    const stripe = getStripe()
    const itemCount = order.items.reduce((acc, i) => acc + i.quantity, 0)

    const params: Stripe.PaymentIntentCreateParams = {
      amount: Math.round(order.total * 100), // centavos
      currency: 'brl',
      automatic_payment_methods: { enabled: true },
      metadata: {
        orderId: order.id,
        userId: order.userId ?? '',
        itemCount: String(itemCount),
      },
    }

    if (INSTALLMENTS_ENABLED) {
      // Stripe Brasil — parcelamento no cartão.
      // Quantidade de parcelas SEM juros é configurada na Dashboard Stripe.
      // (Settings → Payment methods → Installments → On + max parcelas sem juros).
      // A política Gabinete FC (3+ camisas libera 5x sem juros) precisa estar
      // refletida na config da Dashboard ou aplicada via desconto antecipado.
      params.payment_method_options = {
        card: { installments: { enabled: true } },
      }
    }

    let paymentIntent: Stripe.PaymentIntent
    try {
      paymentIntent = await stripe.paymentIntents.create(params)
    } catch (err) {
      // Fallback: se installments não estiver habilitado na conta, refaz sem.
      const message = err instanceof Error ? err.message : String(err)
      if (INSTALLMENTS_ENABLED && /installments/i.test(message)) {
        console.warn('[Stripe] installments indisponíveis na conta — caindo pra à vista:', message)
        delete params.payment_method_options
        paymentIntent = await stripe.paymentIntents.create(params)
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
