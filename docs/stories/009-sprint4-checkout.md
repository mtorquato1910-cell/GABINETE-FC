# Story 009 — Sprint 4: Checkout + Stripe

**Status:** Concluído
**Sprint:** 4
**Data:** 2026-04-16

## Objetivo

Implementar o fluxo completo de checkout multi-step com suporte a Stripe (stub) e cupons de desconto.

## Acceptance Criteria

- [x] Server Actions para salvar endereço, listar endereços e criar pedido
- [x] Validação de cupom de desconto com `validateCoupon`
- [x] Componente `CheckoutClient` com 3 etapas: Endereço → Revisão → Pagamento
- [x] Página `/checkout` com autenticação obrigatória
- [x] Página `/checkout/sucesso` exibindo resumo do pedido
- [x] Stripe Webhook stub em `/api/stripe/webhook`
- [x] Desconto de 5% para pagamento via Pix
- [x] Frete grátis para pedidos acima de R$ 500
- [x] Integração com Zustand cart store (`clearCart` após pedido confirmado)

## Tasks

- [x] Criar `src/lib/actions/checkout.ts` com `saveAddress`, `getUserAddresses`, `createOrder`, `validateCoupon`
- [x] Criar `src/components/checkout/CheckoutClient.tsx` (componente multi-step)
- [x] Criar `src/app/checkout/page.tsx` (Server Component com auth guard)
- [x] Criar `src/app/checkout/sucesso/page.tsx` (página de confirmação)
- [x] Criar `src/app/api/stripe/webhook/route.ts` (stub do webhook Stripe)

## File List

- `src/lib/actions/checkout.ts` — Server Actions do checkout
- `src/components/checkout/CheckoutClient.tsx` — UI do checkout multi-step
- `src/app/checkout/page.tsx` — Página de checkout
- `src/app/checkout/sucesso/page.tsx` — Página de sucesso pós-pedido
- `src/app/api/stripe/webhook/route.ts` — Webhook Stripe (stub)

## Notas

- Stripe está em modo stub. Para ativar: `npm install stripe` e configurar `STRIPE_SECRET_KEY` e `STRIPE_WEBHOOK_SECRET` no `.env`
- O webhook real deve usar `req.text()` (não `req.json()`) para validação de assinatura
- Cupons são validados contra a tabela `Coupon` do Prisma

## TODO (Sprint 4 completo)

- [ ] Instalar `stripe`: `npm install stripe`
- [ ] Criar PaymentIntent no `createOrder`
- [ ] Implementar QR Code Pix
- [ ] Implementar formulário de cartão de crédito com Stripe Elements
