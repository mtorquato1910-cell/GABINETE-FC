# Story 021 — Sprint 16: Pagamentos + Hardening

**Status:** Concluído — 2026-04-16
**Sprint:** 16
**Agente:** @dev

## Objetivo

Implementar hardening de segurança via headers HTTP, cancelamento automático de Pix expirado e configuração completa de Vercel Cron Jobs para todas as tarefas automatizadas.

## Acceptance Criteria

- [x] Cron `/api/cron/pix-expiry` executado a cada 10 minutos
- [x] Cancelamento automático de pedidos Pix com `pixExpiration` no passado
- [x] Criação de `OrderHistory` para cada cancelamento automático
- [x] `vercel.json` com 4 cron jobs configurados
- [x] Security headers em todas as rotas: `X-Content-Type-Options`, `X-Frame-Options`, `X-XSS-Protection`, `Referrer-Policy`, `Permissions-Policy`
- [x] Proteção de todos os crons por `CRON_SECRET`

## Tasks

- [x] Criar `src/app/api/cron/pix-expiry/route.ts`
- [x] Atualizar `vercel.json` com todos os 4 crons + security headers completos

## Cron Jobs Configurados

| Endpoint | Schedule | Descrição |
|----------|----------|-----------|
| `/api/cron/abandoned-cart` | `0 * * * *` | Carrinho abandonado (a cada hora) |
| `/api/cron/tracking` | `0 */6 * * *` | Rastreio Correios (a cada 6h) |
| `/api/cron/expire-points` | `0 0 * * *` | Expiração de pontos (diário) |
| `/api/cron/pix-expiry` | `*/10 * * * *` | Cancelar Pix expirado (a cada 10min) |

## File List

- `src/app/api/cron/pix-expiry/route.ts` (novo)
- `vercel.json` (novo)
