# Story 014 — Sprint 9: Operações Avançadas

**Status:** CONCLUÍDO
**Data:** 2026-04-16
**Sprint:** 9

## Objetivo

Implementar páginas operacionais avançadas: dashboard financeiro com KPIs, receita diária e top produtos; páginas de Lançamentos e Promoções na loja; e infraestrutura de analytics comportamental com tracker client-side e dashboard admin.

## Acceptance Criteria

- [x] Dashboard financeiro em `/admin/financeiro` exibe receita do mês atual vs. anterior
- [x] KPI de crescimento percentual entre meses calculado dinamicamente
- [x] Gráfico de barras horizontal mostrando receita por dia do mês corrente
- [x] Tabela de top 5 produtos por receita total
- [x] Página `/lancamentos` filtra produtos com `badge = 'Lançamento'`
- [x] Página `/promocoes` filtra produtos com badge em `['Promo', 'Promoção', 'Sale']`
- [x] Ambas as páginas usam ISR com `revalidate = 3600`
- [x] API `POST /api/analytics/track` persiste eventos de comportamento
- [x] `AnalyticsTracker` componente client-side rastreia page views automaticamente
- [x] Dashboard `/admin/analytics` exibe total de views, sessões únicas e top páginas

## Tasks

- [x] Criar `src/app/admin/financeiro/page.tsx` — dashboard financeiro
- [x] Criar `src/app/lancamentos/page.tsx` — página de lançamentos
- [x] Criar `src/app/promocoes/page.tsx` — página de promoções
- [x] Criar `src/app/api/analytics/track/route.ts` — API de tracking
- [x] Criar `src/components/shared/AnalyticsTracker.tsx` — tracker client-side
- [x] Criar `src/app/admin/analytics/page.tsx` — dashboard analytics

## File List

| Arquivo | Ação |
|---------|------|
| `src/app/admin/financeiro/page.tsx` | Criado |
| `src/app/lancamentos/page.tsx` | Criado |
| `src/app/promocoes/page.tsx` | Criado |
| `src/app/api/analytics/track/route.ts` | Criado |
| `src/components/shared/AnalyticsTracker.tsx` | Criado |
| `src/app/admin/analytics/page.tsx` | Criado |

## Notes

- `AnalyticsTracker` usa `useRef` para evitar rastrear a mesma rota duas vezes
- Tracking falha silenciosamente (`.catch(() => {})`) para não impactar UX
- Session ID persiste via `sessionStorage` com chave `gfc_session`
- UTM params são capturados automaticamente no primeiro acesso da sessão
- Financeiro usa `Promise.all` para queries paralelas
