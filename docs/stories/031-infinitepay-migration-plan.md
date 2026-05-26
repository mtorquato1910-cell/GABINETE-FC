# Story 035 — Migração Stripe → Infinity Pay

**Criado em**: 2026-05-26
**Status**: 🟡 Aguardando handle confirmado (`u95` ou `v95`)
**Orquestração**: Orion (aios-master)
**Doc oficial**: https://www.infinitepay.io/checkout-documentacao

---

## Premissas técnicas (confirmadas)

- **Autenticação**: SEM API key, SEM webhook secret. Identificação só pelo `handle` no body.
- **Endpoints**:
  - `POST https://api.checkout.infinitepay.io/links` — cria link de pagamento
  - `POST https://api.checkout.infinitepay.io/payment_check` — confirma status (defesa anti-fraude do webhook)
- **Valores em centavos** (R$ 189,90 = 18990)
- **Parcelamento**: já configurado no painel da conta (8x sem juros assumindo taxas). NÃO enviar no payload.
- **PIX**: ativo, taxa zero pro vendedor. **NÃO tem desconto Pix automático pro comprador.**
- **Refund**: só pelo painel manual (sem API documentada)
- **Sandbox**: não existe. Testes em produção com valor mínimo.

---

## Schema novo (Order — manter campos Stripe por 30 dias)

```prisma
model Order {
  // mantidos por 30 dias (rollback safety) — deletar em 2026-06-26
  stripePaymentIntentId String?

  // novos
  infinitepayCheckoutUrl    String?  // URL retornada do POST /links (persiste na CRIAÇÃO)
  infinitepayInvoiceSlug    String?  @unique  // do webhook (persiste no WEBHOOK)
  infinitepayTransactionNsu String?  @unique  // do webhook
  infinitepayReceiptUrl     String?  // do webhook
  installments              Int?
  captureMethod             String?  // "pix" | "credit_card" | "debit_card"
  paidAt                    DateTime?
}
```

---

## ENV vars (Vercel + .env.local)

```
INFINITEPAY_HANDLE=gabriel-calheiros-XX95   # ← confirmar u/v
INFINITEPAY_API_URL=https://api.checkout.infinitepay.io
NEXT_PUBLIC_SITE_URL=https://www.gabinetefc.com.br  # já existe
```

---

## Roadmap (com correções aplicadas)

### Sprint 035.0 — Schema + ENV (~30min · 🟢 baixo risco)
- Adicionar 6 campos novos no Order via `prisma db push`
- Adicionar 2 envs no Vercel (Production)
- Adicionar 2 envs no `.env.local`

### Sprint 035.1 — Cliente Infinity Pay (~1h · 🟢 baixo)
**`src/lib/infinitepay.ts`:**
- `createPaymentLink(orderId, items, customer, address): { url }`
  - Timeout 10s
  - Retry exponencial (3 tentativas) — só pra erro de rede, NÃO pra 4xx
- `checkPayment(orderNsu, transactionNsu, slug): { paid, amount, ... }`
  - Sem retry (queremos resposta autoritativa rápida)
- Helper `toCents(reais: number): number` — `Math.round(reais * 100)`
- Helper `fromCents(cents: number): number` — `cents / 100`

### Sprint 035.2 — Endpoint create-link (~2h · 🟡 médio)
**Substituir `/api/checkout/create-intent` por `/api/infinitepay/create-link`:**

Sequência crítica (ordem importa):
1. `auth()` — exige login + valida não-admin (já existe lógica)
2. Recebe `{ orderId }` do body
3. Lê **Order do banco** com `WHERE id=orderId AND userId=session.user.id` (anti-IDOR)
4. Bloqueia se `paymentStatus === 'paid'` (anti-reuso)
5. **Idempotência sem extrair slug:** se Order já tem `infinitepayCheckoutUrl` E `paymentStatus === 'pending'` E não passou 1h da criação → **reusa a URL salva** (não cria link novo)
6. Senão: recalcula preços DO BANCO (segurança), monta `items[]` com descrição legível
7. Chama `createPaymentLink()` da Infinity
8. **Persiste APENAS `infinitepayCheckoutUrl = response.url`** (não tenta extrair slug)
9. Retorna `{ url }` pro front

⚠️ **Correção crítica aplicada:** `invoice_slug` é persistido **só no webhook**, nunca extraído da URL retornada.

### Sprint 035.3 — Webhook + payment_check (~2h · 🔴 ALTO)
**`/api/infinitepay/webhook`** — coração da segurança:

```
1. Recebe POST do webhook (always responde 200 OK em < 1s pra evitar retry da Infinity)
2. Lê body { invoice_slug, order_nsu, transaction_nsu, amount, ... }
3. IDEMPOTÊNCIA: se já existe Order com infinitepayTransactionNsu=transaction_nsu AND paymentStatus=paid → 200 (não reprocessa)
4. ⚡ Chama checkPayment(handle, order_nsu, transaction_nsu, slug) → resposta autoritativa
5. Validações HARD (qualquer falha = log + responde 200 silencioso):
   ✓ response.success === true
   ✓ response.paid === true
   ✓ response.amount === Math.round(Order.total * 100)
   ✓ Order existe E pertence a userId não deletado
6. ⚡ TRANSACTION ATÔMICA (Prisma $transaction):
   ├─ a) UPDATE Order SET paymentStatus='paid', status='confirmed', paidAt=now,
   │     installments, captureMethod, infinitepayInvoiceSlug, infinitepayTransactionNsu,
   │     infinitepayReceiptUrl WHERE id=order_nsu AND paymentStatus='pending'
   │     ← se affected_rows=0, abort transaction (race condition detectada — outro request já marcou paid)
   ├─ b) Para cada item: UPDATE Product stock -= quantity (dentro DA MESMA transaction)
   └─ c) Inserir StockMovement records
7. Fora da transaction (fire-and-forget):
   - Email de confirmação
   - GA4 purchase event
   - Limpar carrinho (já é Zustand local, sem ação server)
8. Responde 200 OK
9. Log estruturado de TUDO (audit trail)
```

⚠️ **Correções aplicadas:**
- Decremento de estoque DENTRO da mesma `$transaction` do update de status (atomicidade)
- WHERE inclui `paymentStatus='pending'` no UPDATE pra evitar race (se outro request paralelo já marcou paid, esse update vira no-op)

### Sprint 035.4 — UI checkout (~2h · 🟡 médio)
**Modificar `CheckoutClient.tsx` + DELETAR `PaymentForm.tsx` (Stripe Elements):**

Novo fluxo:
1. Step `address` → `review` (igual hoje)
2. Botão "Pagamento →" agora:
   - Cria order via `createOrder()` (já existe — salva Order pending)
   - Chama `POST /api/infinitepay/create-link` → recebe URL
   - `window.location.href = url` (redirect hosted)
3. Cliente paga no checkout da Infinity
4. Volta pra `/checkout/sucesso?...`

**`/checkout/sucesso/page.tsx`:**
- Lê query params (UI only)
- Server component que busca Order pelo `order_nsu` no banco
- Se `paymentStatus === 'paid'` → "✅ Pagamento confirmado"
- Se ainda `pending` → "⏳ Aguardando confirmação (até 1 min)" + **auto-refresh a cada 5s via meta refresh** (sem JS)
- Botão "Ver comprovante" → abre `infinitepayReceiptUrl`

**5% off Pix — DECISÃO:**
Confirmei: Infinity Pay **NÃO** mostra desconto Pix automático pro comprador.
**Decisão MVP**: REMOVER a feature "5% off Pix" no Sprint 035.4. Razão:
- Implementar corretamente exigiria perguntar método de pagamento ANTES de criar o link
- Reativar depois é trivial: pergunta método no front → cria link com `price` ajustado
- Pra MVP, simplifica e foca em estabilidade

Copy nova no sidebar: ~~"5% off Pix"~~ → "Pix instantâneo · Até 8x sem juros no cartão"

### Sprint 035.5 — Remover Stripe (~30min · 🟢 baixo)
- Deletar: `src/lib/stripe.ts`, `src/components/checkout/PaymentForm.tsx`, `src/app/api/checkout/create-intent/route.ts`, `src/app/api/stripe/webhook/route.ts`
- `npm uninstall stripe @stripe/stripe-js @stripe/react-stripe-js`
- Limpar refs em `src/lib/env.ts`, `src/lib/actions/loyalty.ts`, `src/components/admin/StoreSettingsForm.tsx`
- **MANTER** `stripePaymentIntentId` no schema (rollback safety até 2026-06-26)

### Sprint 035.6 — Go-live (~30min · 🔴 ALTO)
**Pré-deploy:**
- Adicionar envs no Vercel
- Confirmar webhook URL = `https://www.gabinetefc.com.br/api/infinitepay/webhook`

**Smoke test produção (obrigatório):**
1. Login como cliente teste (criar conta nova, NÃO usar a admin)
2. Comprar 1 item barato (~R$ 5)
3. Checkout → redireciona pra Infinity
4. **Pagar via Pix**
5. Validar:
   - ✅ Volta pra `/checkout/sucesso` com query params
   - ✅ Order vira `paid` em até 1min (webhook + payment_check)
   - ✅ Email de confirmação
   - ✅ Estoque decrementou exatamente 1
   - ✅ Saldo apareceu na conta Infinity
6. Refundar o teste pelo painel Infinity
7. Repetir com cartão de crédito
8. Se ambos passaram: 🚀 oficial

**Rollback se quebrar:**
- Vercel: voltar deployment anterior em 1 clique
- Stripe ainda existe nos envs/banco (campos Order mantidos)

### Sprint 035.7 — Cron de pedidos expirados (OPCIONAL — não bloqueia go-live)
**Adicionar 1 semana depois do go-live:**
- `/api/cron/check-pending-orders` — Vercel Cron a cada 1h
- Busca Orders com `paymentStatus='pending' AND createdAt < NOW() - 24h`
- Pra cada uma: chama `payment_check()`
- Se `paid: false` → marca como `expired` (novo status) + libera estoque reservado (se houver)
- Configurar em `vercel.json`

---

## ⚠️ Riscos cross-cutting

1. **Webhook duplicado / race** — coberto pela transaction + WHERE com `paymentStatus='pending'` no UPDATE
2. **Lockout do admin** — mitigado: admin nem pode comprar (bloqueio do Sprint 032)
3. **Sandbox inexistente** — ciente. Smoke com R$ 5 em produção
4. **Sem HMAC do webhook** — mitigado pelo `payment_check` callback (defesa em camadas)
5. **Pedido expirado nunca finalizado** — coberto opcionalmente no Sprint 035.7

---

## Total

| Sub-sprint | Duração | Risco |
|---|---|---|
| 035.0 Schema + ENV | 30min | 🟢 |
| 035.1 Cliente Infinity | 1h | 🟢 |
| 035.2 Endpoint create-link | 2h | 🟡 |
| 035.3 Webhook + payment_check | 2h | 🔴 |
| 035.4 UI checkout (sem 5% Pix) | 2h | 🟡 |
| 035.5 Remover Stripe | 30min | 🟢 |
| 035.6 Go-live + smoke | 30min | 🔴 |
| 035.7 Cron (opcional, pós go-live) | 1h | 🟢 |
| **Total MVP (035.0-035.6)** | **~8.5h** | |

---

## Pendências antes de codar

- [ ] Handle confirmado (`u95` ou `v95`)
- [x] Plano aprovado com 5 correções
- [x] Manter `stripePaymentIntentId` por 30 dias (anotar deletar em 2026-06-26)
