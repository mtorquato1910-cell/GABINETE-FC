import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { stripe } from '@/lib/stripe'

export async function POST(req: NextRequest) {
  // Com Stripe configurado: verificação real de assinatura
  if (stripe && process.env.STRIPE_WEBHOOK_SECRET) {
    const body = await req.text() // IMPORTANTE: usar text(), não json()
    const sig = req.headers.get('stripe-signature')

    if (!sig) {
      return NextResponse.json({ error: 'Stripe-Signature ausente' }, { status: 400 })
    }

    let event
    try {
      event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET)
    } catch {
      return NextResponse.json({ error: 'Assinatura inválida' }, { status: 400 })
    }

    return handleStripeEvent(event.type, event.data.object as { id?: string })
  }

  // Sem Stripe configurado: modo dev (sem verificação)
  try {
    const body = await req.json()
    return handleStripeEvent(body.type, body.data?.object)
  } catch {
    return NextResponse.json({ error: 'Webhook error' }, { status: 400 })
  }
}

async function handleStripeEvent(type: string, object: { id?: string } | undefined) {
  try {
    if (type === 'payment_intent.succeeded') {
      const paymentIntentId = object?.id as string
      if (paymentIntentId) {
        await prisma.order.updateMany({
          where: { stripePaymentIntentId: paymentIntentId },
          data: { paymentStatus: 'paid', status: 'confirmed' },
        })
      }
    }

    if (type === 'payment_intent.payment_failed') {
      const paymentIntentId = object?.id as string
      if (paymentIntentId) {
        await prisma.order.updateMany({
          where: { stripePaymentIntentId: paymentIntentId },
          data: { paymentStatus: 'failed', status: 'cancelled' },
        })
      }
    }

    return NextResponse.json({ received: true })
  } catch (err) {
    console.error('[Stripe webhook handler]', err)
    return NextResponse.json({ error: 'Erro ao processar evento' }, { status: 500 })
  }
}
