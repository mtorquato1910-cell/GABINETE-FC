import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

// Stripe webhook handler
// TODO: Instalar stripe: npm install stripe
// import Stripe from 'stripe'
// const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)

export async function POST(req: NextRequest) {
  // TODO Sprint 4 completo: Implementar com Stripe real
  // const body = await req.text()  // IMPORTANTE: usar text(), não json()
  // const sig = req.headers.get('stripe-signature')!
  // const event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET!)

  try {
    const body = await req.json()
    const { type, data } = body

    if (type === 'payment_intent.succeeded') {
      const paymentIntentId = data?.object?.id
      if (paymentIntentId) {
        await prisma.order.updateMany({
          where: { stripePaymentIntentId: paymentIntentId },
          data: { paymentStatus: 'paid', status: 'confirmed' },
        })
      }
    }

    return NextResponse.json({ received: true })
  } catch (err) {
    return NextResponse.json({ error: 'Webhook error' }, { status: 400 })
  }
}
