# Story 020 — Sprint 15: Push Notifications

**Status:** Concluído — 2026-04-16
**Sprint:** 15
**Agente:** @dev

## Objetivo

Implementar infraestrutura de Push Notifications via Service Worker e VAPID, incluindo registro de subscriptions, componente de opt-in e Service Worker para PWA com cache offline.

## Acceptance Criteria

- [x] `public/sw.js` — Service Worker com push handler, cache offline e click handler
- [x] `src/lib/actions/push.ts` — Server actions para salvar subscriptions e enviar notificações (stub)
- [x] `src/app/api/push/subscribe/route.ts` — Endpoint POST para registrar subscription
- [x] `src/components/shared/PushNotificationManager.tsx` — Componente client de opt-in
- [x] `src/app/offline/page.tsx` — Fallback offline PWA
- [x] Armazenamento de subscriptions no modelo `PushSubscription` do Prisma
- [x] Suporte a userId opcional (usuário logado ou anônimo)
- [x] TODO marcado para implementação com `web-push` library

## Tasks

- [x] Criar `public/sw.js` com install, activate, fetch, push e notificationclick handlers
- [x] Criar `src/lib/actions/push.ts` com `savePushSubscription` e `sendPushNotification`
- [x] Criar `src/app/api/push/subscribe/route.ts`
- [x] Criar `src/components/shared/PushNotificationManager.tsx`
- [x] Criar `src/app/offline/page.tsx`

## Variáveis de Ambiente Necessárias

```
NEXT_PUBLIC_VAPID_PUBLIC_KEY=
VAPID_PRIVATE_KEY=
```

## File List

- `public/sw.js` (novo)
- `src/lib/actions/push.ts` (novo)
- `src/app/api/push/subscribe/route.ts` (novo)
- `src/components/shared/PushNotificationManager.tsx` (novo)
- `src/app/offline/page.tsx` (novo)
