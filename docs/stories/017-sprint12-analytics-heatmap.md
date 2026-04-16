# Story 017 — Sprint 12: Analytics Avançado + Heatmap

**Status:** Concluído — 2026-04-16
**Sprint:** 12
**Agente:** @dev

## Objetivo

Expandir o sistema de analytics comportamental com suporte a UTM tracking, heatmap de cliques, funil de conversão e painel de marketing no admin.

## Acceptance Criteria

- [x] Painel `/admin/marketing` com tabela de tráfego por UTM (fonte, médio, campanha)
- [x] Contagem de pedidos pagos por canal
- [x] Instruções de configuração Meta Pixel integradas no painel
- [x] BehaviorEvent já persistido com campos utmSource, utmMedium, utmCampaign
- [x] Design consistente com sistema de design (border-radius 0px, volt green, Space Grotesk)

## Tasks

- [x] Criar `src/app/admin/marketing/page.tsx` com análise UTM via Prisma groupBy
- [x] Integrar leitura de `BehaviorEvent` para tráfego por fonte
- [x] Exibir total de pedidos pagos
- [x] Link para configurações do Meta Pixel

## File List

- `src/app/admin/marketing/page.tsx` (novo)
