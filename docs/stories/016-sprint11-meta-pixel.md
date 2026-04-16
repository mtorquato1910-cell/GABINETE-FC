# Story 016 — Sprint 11: Meta Pixel + CAPI

**Status:** Concluído — 2026-04-16
**Sprint:** 11
**Agente:** @dev

## Objetivo

Implementar rastreamento Meta Pixel client-side com deduplicação via Conversions API (CAPI) server-side, garantindo conformidade com iOS 14+ e cobertura de eventos de atribuição.

## Acceptance Criteria

- [x] `src/lib/meta-pixel.ts` — inicialização client-side e helpers de eventos
- [x] `src/lib/actions/capi.ts` — envio server-side de eventos via Graph API v18
- [x] `src/lib/actions/newsletter.ts` — disparo CAPI Lead ao inscrever newsletter
- [x] Hashing SHA-256 de dados PII (email, telefone, nome)
- [x] Event ID para deduplicação pixel/CAPI
- [x] Fallback stub quando variáveis de ambiente não configuradas
- [x] Eventos implementados: PageView, ViewContent, AddToCart, InitiateCheckout, Purchase, Lead

## Tasks

- [x] Criar `src/lib/meta-pixel.ts` com `initMetaPixel`, `trackPixelEvent`, `pixelEvents`
- [x] Criar `src/lib/actions/capi.ts` com `sendCAPIEvent`, `capiPurchase`, `capiAddToCart`, `capiLead`
- [x] Criar `src/lib/actions/newsletter.ts` com `subscribeNewsletter` + CAPI Lead

## Variáveis de Ambiente Necessárias

```
NEXT_PUBLIC_META_PIXEL_ID=
META_ACCESS_TOKEN=
```

## File List

- `src/lib/meta-pixel.ts` (novo)
- `src/lib/actions/capi.ts` (novo)
- `src/lib/actions/newsletter.ts` (novo)
