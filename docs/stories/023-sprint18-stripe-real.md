# Story 023 — Sprint 18: Integração Stripe Real

**Status:** Concluído — 2026-04-16
**Sprint:** 18
**Agente:** @dev
**Prioridade:** Alta (receita)

## Objetivo

Substituir o stub do Stripe por integração real com criação de PaymentIntent, webhook seguro com verificação de assinatura e suporte a Pix (via Stripe Brazil).

## Acceptance Criteria

- [x] `stripe` instalado e configurado
- [x] `src/lib/actions/checkout.ts` — criar PaymentIntent real com `stripe.paymentIntents.create`
- [x] `src/app/api/stripe/webhook/route.ts` — webhook com `stripe.webhooks.constructEvent` (verificação de assinatura)
- [x] Suporte a `payment_intent.succeeded`, `payment_intent.payment_failed`
- [x] Atualizar status do pedido automaticamente via webhook
- [x] Frontend do checkout enviando `clientSecret` para `Stripe.js`

## Dependências

```
npm install stripe @stripe/stripe-js @stripe/react-stripe-js
```

## Variáveis de Ambiente Necessárias

```env
STRIPE_SECRET_KEY=sk_live_...         # ou sk_test_... para testes
STRIPE_PUBLISHABLE_KEY=pk_live_...    # ou pk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...       # gerado no dashboard Stripe
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_...
```

## Tasks

- [x] Instalar `stripe`, `@stripe/stripe-js`, `@stripe/react-stripe-js`
- [x] Criar `src/lib/stripe.ts` — instância singleton do Stripe
- [x] Criar `src/app/api/checkout/create-intent/route.ts` — cria PaymentIntent
- [x] Atualizar `src/app/api/stripe/webhook/route.ts` — verificação real de assinatura
- [x] Atualizar `src/app/checkout/page.tsx` ou `CheckoutClient` — integrar Stripe.js no frontend
- [x] Adicionar `STRIPE_SECRET_KEY` e `STRIPE_WEBHOOK_SECRET` no `.env` e `src/env.ts`

## Código de Referência

```typescript
// src/lib/stripe.ts
import Stripe from 'stripe'
export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-12-18.acacia',
})

// Criar PaymentIntent
const paymentIntent = await stripe.paymentIntents.create({
  amount: Math.round(total * 100), // em centavos
  currency: 'brl',
  automatic_payment_methods: { enabled: true },
  metadata: { orderId },
})

// Verificar webhook
const event = stripe.webhooks.constructEvent(
  body,        // req.text() — NÃO json()
  sig,         // header 'stripe-signature'
  process.env.STRIPE_WEBHOOK_SECRET!
)
```

## File List

- `src/lib/stripe.ts` (novo)
- `src/app/api/checkout/create-intent/route.ts` (novo)
- `src/app/api/stripe/webhook/route.ts` (modificar)
- `src/env.ts` (adicionar variáveis)
- `package.json` (adicionar stripe)
