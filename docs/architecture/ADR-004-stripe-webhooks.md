# ADR-004 — Stripe como Gateway de Pagamentos com Suporte a Pix

**Status:** Aceito
**Data:** 2026-04-16
**Autor:** @architect

---

## Contexto

O Gabinete FC precisa processar pagamentos para pedidos de camisetas de futebol. O perfil do cliente é predominantemente brasileiro, o que torna o suporte a **Pix** um requisito funcional crítico — o Pix representa mais de 40% das transações de e-commerce no Brasil em 2024 e tem expectativa de crescimento contínuo.

Os requisitos do gateway de pagamentos são:

1. **Suporte a Pix:** Geração de QR Code e chave Pix copia-e-cola para pagamentos instantâneos.
2. **Cartão de crédito/débito:** Cobertura das principais bandeiras (Visa, Mastercard, Elo, Amex).
3. **Webhooks confiáveis:** Confirmação assíncrona de pagamento para atualização de status de pedidos.
4. **Idempotência:** Reprocessamento seguro de eventos sem duplicação de pedidos.
5. **PCI Compliance:** Dados de cartão nunca trafegam pelo servidor da aplicação.
6. **Integração com Next.js:** Server Actions e Route Handlers para o fluxo de checkout.

---

## Decisão

**Adotar o Stripe como gateway de pagamentos exclusivo do projeto.**

O fluxo de pagamento será implementado via **Stripe Payment Intents API** com `payment_method_types: ['card', 'pix']`. A confirmação de pagamento será gerenciada por webhooks no endpoint `/api/webhooks/stripe`, verificados com `stripe.webhooks.constructEvent()` para garantir autenticidade e idempotência.

---

## Consequências

### Positivas

**Suporte oficial a Pix:** O Stripe lançou suporte ao Pix no Brasil em 2022. A integração usa os mesmos Payment Intents da API padrão, sem SDKs separados. O QR Code é gerado pelo Stripe e retornado na resposta do Payment Intent.

```typescript
// Server Action — criação do Payment Intent com Pix
const paymentIntent = await stripe.paymentIntents.create({
  amount: totalEmCentavos,
  currency: "brl",
  payment_method_types: ["card", "pix"],
  metadata: {
    pedidoId: pedido.id,
    usuarioId: session?.user?.id ?? "guest",
  },
});

// Retorno para o cliente
const pixQrCode = paymentIntent.next_action?.pix_display_qr_code?.image_url_png;
const pixCopiaCola = paymentIntent.next_action?.pix_display_qr_code?.data;
```

**Webhooks com verificação criptográfica:** O Stripe assina todos os eventos com HMAC-SHA256. A verificação via `constructEvent` garante que apenas o Stripe pode disparar o endpoint, prevenindo ataques de replay e spoofing.

```typescript
// app/api/webhooks/stripe/route.ts
import Stripe from "stripe";
import { headers } from "next/headers";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

export async function POST(request: Request) {
  const body = await request.text();
  const signature = headers().get("stripe-signature")!;

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err) {
    return new Response(`Webhook Error: ${err}`, { status: 400 });
  }

  // Idempotência: verificar se evento já foi processado
  const jaProcessado = await prisma.stripeEvento.findUnique({
    where: { stripeEventId: event.id },
  });
  if (jaProcessado) return new Response("OK", { status: 200 });

  switch (event.type) {
    case "payment_intent.succeeded":
      await processarPagamentoConfirmado(event.data.object);
      break;
    case "payment_intent.payment_failed":
      await processarPagamentoFalhou(event.data.object);
      break;
  }

  // Marcar evento como processado
  await prisma.stripeEvento.create({
    data: { stripeEventId: event.id, tipo: event.type },
  });

  return new Response("OK", { status: 200 });
}
```

**PCI Compliance via Stripe.js:** O número do cartão é tokenizado diretamente no navegador pelo Stripe Elements / Payment Element. O servidor da aplicação recebe apenas um `paymentMethodId` (token), nunca dados brutos do cartão. Isso mantém o projeto fora do escopo de auditoria PCI DSS Nível 1.

**Stripe Elements para UI de checkout:** O componente `<PaymentElement>` do Stripe renderiza o formulário de pagamento com suporte automático a todos os métodos habilitados (cartão e Pix), com localização em português e validação client-side integrada.

**Dashboard e reconciliação:** O dashboard do Stripe oferece reconciliação de pagamentos, disputas, reembolsos e exportações financeiras sem necessidade de implementação customizada.

**Testabilidade com Stripe CLI:** O `stripe listen --forward-to localhost:3000/api/webhooks/stripe` permite simular eventos de webhook em desenvolvimento local sem exposição pública do servidor.

### Negativas / Trade-offs

**Taxas de processamento:** Stripe cobra 3,99% + R$0,39 por transação bem-sucedida no Brasil (cartão). Para Pix, a taxa é 0,99% por transação. Em volume alto, pode valer a pena avaliar adquirentes locais.

**Pix com expiração:** QR Codes Pix gerados pelo Stripe expiram em 1 hora. A UX de checkout deve comunicar claramente o prazo de pagamento e oferecer regeneração do QR Code.

**Sem parcelamento nativo simples:** Parcelamento de cartão de crédito (comum no Brasil) requer configuração via Installments API do Stripe Brasil, que tem disponibilidade limitada. Para o MVP, os pagamentos serão à vista.

**Dependência de terceiro crítico:** O fluxo de receita depende da disponibilidade do Stripe. Embora o SLA seja 99.99%, um plano de fallback (ex: link do Mercado Pago como backup) deve ser considerado para produção.

---

## Fluxo de Pagamento

```
Cliente                 Next.js Server              Stripe
  |                          |                          |
  |-- POST /checkout ------> |                          |
  |                          |-- createPaymentIntent -> |
  |                          | <-- clientSecret --------|
  | <-- clientSecret --------|                          |
  |                          |                          |
  |-- [confirma no browser via Stripe.js] -----------> |
  |                          |                          |
  |                          |  <-- webhook POST -------|
  |                          |     payment_intent.      |
  |                          |     succeeded            |
  |                          |-- atualiza Pedido -----  |
  |                          |-- envia e-mail --------  |
  | <-- redirect /pedido/:id-|                          |
```

---

## Tabela de Idempotência no Prisma

```prisma
model StripeEvento {
  id             String   @id @default(cuid())
  stripeEventId  String   @unique
  tipo           String
  processadoEm   DateTime @default(now())
}
```

---

## Variáveis de Ambiente Necessárias

```env
# Stripe
STRIPE_PUBLISHABLE_KEY=pk_live_...   # ou pk_test_... em desenvolvimento
STRIPE_SECRET_KEY=sk_live_...        # ou sk_test_... em desenvolvimento
STRIPE_WEBHOOK_SECRET=whsec_...      # obtido via stripe listen (dev) ou dashboard (prod)
```

---

## Alternativas Consideradas

### Mercado Pago

- **Prós:** Maior adoção no Brasil, suporte nativo a Pix, boleto e parcelamento, API em português, sandbox bem documentado.
- **Contras:** DX inferior ao Stripe (documentação menos consistente, SDK menos tipado), webhook reliability historicamente inferior, ausência de componentes de UI comparáveis ao Stripe Elements.
- **Decisão:** Pode ser adicionado como método alternativo no futuro, mas não como gateway principal.

### PagSeguro / PagBank

- **Prós:** Muito popular no mercado brasileiro, suporte a múltiplos métodos de pagamento.
- **Contras:** API mais antiga e verbosa, documentação inconsistente, DX significativamente inferior ao Stripe, menor suporte a TypeScript.
- **Decisão:** Descartado por DX inadequado para o ritmo de desenvolvimento do projeto.

### Adyen

- **Prós:** Gateway enterprise com excelente cobertura global, suporte a Pix.
- **Contras:** Foco em enterprise, volume mínimo de transações para onboarding, complexidade de setup desproporcional para um projeto bootstrap.
- **Decisão:** Descartado por inadequação ao estágio do projeto.

### Abacatepay (Pix-only)

- **Prós:** API simplificada para Pix, sem taxas em alguns planos.
- **Contras:** Suporte apenas a Pix, sem cartão de crédito. Clientes sem conta bancária com Pix ficariam sem opção de pagamento.
- **Decisão:** Descartado. Cobertura insuficiente de métodos de pagamento.

---

## Referências

- [Stripe Pix Documentation (Brazil)](https://stripe.com/docs/payments/pix)
- [Stripe Payment Intents API](https://stripe.com/docs/payments/payment-intents)
- [Stripe Webhooks Guide](https://stripe.com/docs/webhooks)
- [Stripe Elements / Payment Element](https://stripe.com/docs/payments/payment-element)
- [Stripe CLI for local webhook testing](https://stripe.com/docs/stripe-cli/webhooks)
