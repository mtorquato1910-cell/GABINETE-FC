import Stripe from 'stripe'

if (!process.env.STRIPE_SECRET_KEY && process.env.NODE_ENV === 'production') {
  throw new Error('STRIPE_SECRET_KEY não configurado')
}

export const stripe = process.env.STRIPE_SECRET_KEY
  ? new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: '2026-03-25.dahlia',
    })
  : null

export function getStripe() {
  if (!stripe) throw new Error('Stripe não configurado — adicione STRIPE_SECRET_KEY no .env')
  return stripe
}
