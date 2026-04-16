# Story 024 — Sprint 19: Email Transacional com Resend

**Status:** Aguardando API Key
**Sprint:** 19
**Agente:** @dev
**Prioridade:** Alta (comunicação com cliente)

## Objetivo

Substituir todos os stubs de email por envio real usando Resend + React Email. Templates de email para: confirmação de pedido, recuperação de senha, carrinho abandonado, notificação de envio.

## Acceptance Criteria

- [ ] `resend` e `react-email` instalados
- [ ] Template de email para confirmação de pedido
- [ ] Template de email para carrinho abandonado
- [ ] Template de email para recuperação de senha (forgot password)
- [ ] Template de email para notificação de envio com código de rastreio
- [ ] `src/lib/actions/email.ts` com implementação real de todos os métodos
- [ ] Cron de carrinho abandonado enviando emails reais

## Dependências

```
npm install resend @react-email/components @react-email/render
```

## Variáveis de Ambiente Necessárias

```env
RESEND_API_KEY=re_...
EMAIL_FROM=Gabinete FC <noreply@gabinetefc.com.br>
```

## Tasks

- [ ] Instalar `resend`, `@react-email/components`, `@react-email/render`
- [ ] Criar `src/emails/OrderConfirmation.tsx` — template React Email
- [ ] Criar `src/emails/AbandonedCart.tsx` — template React Email
- [ ] Criar `src/emails/ShippingNotification.tsx` — template React Email
- [ ] Atualizar `src/lib/actions/email.ts` com `resend.emails.send()`
- [ ] Atualizar `src/app/api/cron/abandoned-cart/route.ts` para usar email real
- [ ] Adicionar `RESEND_API_KEY` em `src/env.ts`

## Código de Referência

```typescript
// src/lib/actions/email.ts
import { Resend } from 'resend'
import { render } from '@react-email/render'
import { OrderConfirmation } from '@/emails/OrderConfirmation'

const resend = new Resend(process.env.RESEND_API_KEY)

export async function sendOrderConfirmationEmail(order: Order) {
  const html = await render(<OrderConfirmation order={order} />)
  await resend.emails.send({
    from: process.env.EMAIL_FROM!,
    to: order.user.email,
    subject: `Pedido #${order.id} confirmado — Gabinete FC`,
    html,
  })
}
```

## File List

- `src/emails/OrderConfirmation.tsx` (novo)
- `src/emails/AbandonedCart.tsx` (novo)
- `src/emails/ShippingNotification.tsx` (novo)
- `src/lib/actions/email.ts` (modificar)
- `src/app/api/cron/abandoned-cart/route.ts` (modificar)
- `src/env.ts` (adicionar variáveis)
- `package.json` (adicionar resend)
