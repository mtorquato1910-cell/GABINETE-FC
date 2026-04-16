# Story 013 — Sprint 8: Sistema de Avaliações & Marketing

**Status:** CONCLUÍDO
**Data:** 2026-04-16
**Sprint:** 8

## Objetivo

Implementar o sistema completo de avaliações de produtos (reviews), incluindo submissão pelo cliente, moderação admin, geração automática de cupom de recompensa e exibição no PDP. Inclui também alertas de estoque (me avise).

## Acceptance Criteria

- [x] Clientes logados podem enviar avaliações com nota (1–5), título e comentário
- [x] Reviews ficam em status `pending` até aprovação manual pelo admin
- [x] Admin pode aprovar ou rejeitar reviews em `/admin/avaliacoes`
- [x] Ao aprovar, o sistema gera automaticamente cupom `REVIEW-XXXXXX` de 5% por 30 dias
- [x] Reviews aprovadas aparecem na página do produto com média calculada
- [x] Usuários não logados veem as reviews mas não podem criar
- [x] Botão "Me Avise Quando Chegar" disponível para produtos sem estoque no tamanho selecionado
- [x] Alerta de estoque salvo com email + produto + tamanho, sem duplicatas

## Tasks

- [x] Criar `src/lib/actions/reviews.ts` — server actions de reviews
- [x] Criar `src/components/product/ReviewSection.tsx` — componente de reviews no PDP
- [x] Criar `src/lib/actions/stockAlerts.ts` — server action de alertas de estoque
- [x] Criar `src/components/product/StockAlertButton.tsx` — botão "me avise"

## File List

| Arquivo | Ação |
|---------|------|
| `src/lib/actions/reviews.ts` | Criado |
| `src/components/product/ReviewSection.tsx` | Criado |
| `src/lib/actions/stockAlerts.ts` | Criado |
| `src/components/product/StockAlertButton.tsx` | Criado |

## Notes

- `approveReview` verifica se cupom já existe antes de criar (idempotente)
- `createReview` impede duplicatas por `(userId, productId)`
- `createStockAlert` impede duplicatas por `(productId, size, email)`
- ReviewSection usa `useTransition` para UX não-bloqueante
