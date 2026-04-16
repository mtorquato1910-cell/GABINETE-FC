import Stripe from 'stripe'

export const stripe = process.env.STRIPE_SECRET_KEY
  ? new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: '2026-03-25.dahlia',
    })
  : null

export function getStripe() {
  if (!stripe) throw new Error('Stripe não configurado — adicione STRIPE_SECRET_KEY no .env')
  return stripe
}
