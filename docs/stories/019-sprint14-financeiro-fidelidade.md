# Story 019 — Sprint 14: Dashboard Financeiro Avançado + Fidelidade

**Status:** Concluído — 2026-04-16
**Sprint:** 14
**Agente:** @dev

## Objetivo

Implementar gestão de programa de fidelidade no painel admin com visualização de pontos em circulação, top clientes por pontos e cron job de expiração automática de pontos.

## Acceptance Criteria

- [x] Painel `/admin/fidelidade` com total de pontos em circulação
- [x] Top 10 clientes por pontos com nome, email e saldo
- [x] Cron `/api/cron/expire-points` executado diariamente à meia-noite
- [x] Expiração de pontos via entradas negativas (padrão ledger)
- [x] Proteção por `CRON_SECRET`
- [x] Design consistente com sistema de design

## Tasks

- [x] Criar `src/app/admin/fidelidade/page.tsx` com Prisma groupBy + aggregate
- [x] Criar `src/app/api/cron/expire-points/route.ts`
- [x] Adicionar cron ao `vercel.json`

## File List

- `src/app/admin/fidelidade/page.tsx` (novo)
- `src/app/api/cron/expire-points/route.ts` (novo)
