# Story 015 — Sprint 10: Programa de Fidelidade & PWA

**Status:** CONCLUÍDO
**Data:** 2026-04-16
**Sprint:** 10

## Objetivo

Implementar o programa de fidelidade completo com acumulação de pontos por compra, histórico na área do cliente, e suporte a campanhas de pontos duplos pelo admin. Pontos expiram conforme configuração em `StoreSetting`.

## Acceptance Criteria

- [x] Clientes acumulam pontos a cada compra confirmada (via webhook Stripe)
- [x] Taxa de pontos por real configurável via `StoreSetting` (`loyalty_points_per_real`)
- [x] Expiração de pontos configurável via `StoreSetting` (`loyalty_points_expiry_days`)
- [x] Saldo de pontos ativos (não expirados) calculado corretamente
- [x] Página `/minha-conta/fidelidade` exibe saldo destacado e histórico
- [x] Histórico mostra tipo de ação com label em português, data e pontos (+/-)
- [x] Admin pode criar campanha de pontos duplos com duração em dias
- [x] Campanha registrada em `StoreSetting` com chave `double_points_until`
- [x] Conversão de pontos: 1 ponto = R$ 0,10

## Tasks

- [x] Criar `src/lib/actions/loyalty.ts` — server actions do programa de fidelidade
- [x] Criar `src/app/minha-conta/fidelidade/page.tsx` — área do cliente: pontos

## File List

| Arquivo | Ação |
|---------|------|
| `src/lib/actions/loyalty.ts` | Criado |
| `src/app/minha-conta/fidelidade/page.tsx` | Criado |

## Notes

- `addPurchasePoints` é chamado pelo webhook Stripe após `payment_intent.succeeded`
- Pontos com `expiresAt = null` são considerados sem expiração (permanentes)
- `createDoublePointsCampaign` usa `upsert` — pode ser chamado múltiplas vezes sem duplicar
- Página de fidelidade usa SSR direto com `auth()` do NextAuth v5
- Labels de ação mapeados: `purchase`, `review`, `referral`, `double_points`, `expired`
