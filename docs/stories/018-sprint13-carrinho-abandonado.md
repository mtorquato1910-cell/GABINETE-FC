# Story 018 — Sprint 13: Carrinho Abandonado

**Status:** Concluído — 2026-04-16
**Sprint:** 13
**Agente:** @dev

## Objetivo

Implementar recuperação automática de carrinhos abandonados via Vercel Cron Job, identificando pedidos `pending` há mais de 1 hora e disparando emails de recuperação (stub pronto para integração com Resend).

## Acceptance Criteria

- [x] Cron `/api/cron/abandoned-cart` executado a cada hora
- [x] Identificação de pedidos com status `pending` há mais de 1h
- [x] Proteção por `CRON_SECRET` no header `Authorization`
- [x] Retorno JSON com `{ processed, timestamp }`
- [x] `vercel.json` com configuração de cron jobs e headers de segurança
- [x] TODO marcado para integração completa com Resend (Sprint 13 completo)

## Tasks

- [x] Criar `src/app/api/cron/abandoned-cart/route.ts`
- [x] Criar `vercel.json` com crons e security headers
- [x] Incluir cron de rastreio automático `src/app/api/cron/tracking/route.ts`

## Variáveis de Ambiente Necessárias

```
CRON_SECRET=
```

## File List

- `src/app/api/cron/abandoned-cart/route.ts` (novo)
- `src/app/api/cron/tracking/route.ts` (novo)
- `vercel.json` (novo)
