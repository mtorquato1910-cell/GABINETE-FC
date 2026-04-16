# Story 010 — Sprint 5: Integrações (Correios, Email, Bot Claude)

**Status:** Concluído (stubs)
**Sprint:** 5
**Data:** 2026-04-16

## Objetivo

Implementar stubs das integrações externas: cálculo de frete via Correios, envio de emails transacionais e bot de suporte ao cliente com Claude API.

## Acceptance Criteria

- [x] Stub de cálculo de frete com PAC e SEDEX simulados por região
- [x] Stub de rastreamento de encomenda
- [x] Stubs de emails transacionais (confirmação de pedido, atualização de status, reset de senha, carrinho abandonado)
- [x] Componente `SupportChat` flutuante com stub de resposta automática
- [x] SupportChat integrado ao layout principal

## Tasks

- [x] Criar `src/lib/actions/correios.ts` com `calculateFreight` e `trackPackage`
- [x] Criar `src/lib/actions/email.ts` com `sendOrderConfirmation`, `sendOrderStatusUpdate`, `sendPasswordReset`, `sendAbandonedCart`
- [x] Criar `src/components/shared/SupportChat.tsx` (widget flutuante)
- [x] Editar `src/app/layout.tsx` para incluir `<SupportChat />`

## File List

- `src/lib/actions/correios.ts` — Frete e rastreamento Correios (stub)
- `src/lib/actions/email.ts` — Emails transacionais (stub)
- `src/components/shared/SupportChat.tsx` — Widget de suporte (stub Claude API)
- `src/app/layout.tsx` — Adicionado `<SupportChat />`

## Notas

### Correios
- Simulação baseada em prefixo de CEP (regiões)
- PAC e SEDEX com preços e prazos estimados por região
- Para integração real: usar API dos Correios em `https://cws.correios.com.br`

### Email (Resend)
- Para ativar: `npm install resend react-email`
- Configurar `RESEND_API_KEY` no `.env`
- Stubs apenas fazem `console.log` — sem envio real

### Bot Claude (SupportChat)
- Para ativar: configurar `ANTHROPIC_API_KEY` no `.env`
- Criar rota de API `/api/chat` que chama a Claude API
- Substituir o stub de timeout pelo fetch à rota de API
- Considerar streaming de resposta para melhor UX

## TODO (Sprint 5 completo)

- [ ] Instalar `resend`: `npm install resend react-email`
- [ ] Criar templates de email com `react-email`
- [ ] Implementar integração real com Correios (OAuth + token)
- [ ] Criar `/api/chat/route.ts` com Claude API (streaming)
- [ ] Conectar `SupportChat` à rota `/api/chat`
- [ ] Adicionar calculadora de frete na página de produto e no carrinho
