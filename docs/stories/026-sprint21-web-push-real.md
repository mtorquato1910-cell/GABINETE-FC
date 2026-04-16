# Story 026 — Sprint 21: Push Notifications com web-push

**Status:** Concluído — 2026-04-16
**Sprint:** 21
**Agente:** @dev
**Prioridade:** Baixa (engajamento)

## Objetivo

Substituir o stub de push notifications por envio real usando a biblioteca `web-push`. Incluir geração de chaves VAPID, envio de notificações para usuários inscritos e limpeza de subscriptions inválidas.

## Acceptance Criteria

- [x] `web-push` instalado com chaves VAPID configuradas
- [x] `sendPushNotification` enviando notificações reais para subscribers
- [x] Envio em batch para múltiplos usuários
- [x] Remoção automática de subscriptions inválidas (410 Gone)
- [x] Notificação de pedido confirmado via push
- [x] Notificação de promoção para todos os subscribers

## Dependências

```
npm install web-push
npm install --save-dev @types/web-push
```

## Variáveis de Ambiente Necessárias

```env
NEXT_PUBLIC_VAPID_PUBLIC_KEY=...    # Gerada com web-push
VAPID_PRIVATE_KEY=...               # Gerada com web-push
VAPID_SUBJECT=mailto:contato@gabinetefc.com.br
```

## Tasks

- [x] Instalar `web-push` e `@types/web-push`
- [x] Gerar chaves VAPID: `node -e "const webpush=require('web-push'); console.log(webpush.generateVAPIDKeys())"`
- [x] Criar `src/lib/webpush.ts` — instância singleton configurada
- [x] Atualizar `src/lib/actions/push.ts` com envio real
- [x] Implementar remoção de subscription inválida (status 410)
- [x] Integrar envio de push na confirmação de pedido
- [x] Adicionar variáveis em `src/env.ts`

## Código de Referência

```typescript
// src/lib/webpush.ts
import webpush from 'web-push'

webpush.setVapidDetails(
  process.env.VAPID_SUBJECT!,
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
  process.env.VAPID_PRIVATE_KEY!
)

export { webpush }

// src/lib/actions/push.ts
import { webpush } from '@/lib/webpush'

export async function sendPushNotification(userId: string, payload: PushPayload) {
  const subscriptions = await prisma.pushSubscription.findMany({ where: { userId } })

  await Promise.allSettled(
    subscriptions.map(async (sub) => {
      try {
        await webpush.sendNotification(
          JSON.parse(sub.subscription),
          JSON.stringify(payload)
        )
      } catch (err: unknown) {
        // Remove subscription inválida (410 = não mais válida)
        if (err && typeof err === 'object' && 'statusCode' in err && err.statusCode === 410) {
          await prisma.pushSubscription.delete({ where: { id: sub.id } })
        }
      }
    })
  )
}
```

## File List

- `src/lib/webpush.ts` (novo)
- `src/lib/actions/push.ts` (modificar)
- `src/env.ts` (adicionar variáveis)
- `package.json` (adicionar web-push)
