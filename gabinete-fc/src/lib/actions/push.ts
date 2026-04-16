'use server'
import { prisma } from '@/lib/db'
import { getWebPush } from '@/lib/webpush'

// Salva subscription VAPID do usuário
export async function savePushSubscription(subscription: {
  endpoint: string
  p256dhKey: string
  authKey: string
  userId?: string
}) {
  const existing = await prisma.pushSubscription.findUnique({
    where: { endpoint: subscription.endpoint },
  })

  if (existing) {
    await prisma.pushSubscription.update({
      where: { endpoint: subscription.endpoint },
      data: { isActive: true, userId: subscription.userId },
    })
  } else {
    await prisma.pushSubscription.create({
      data: { ...subscription, isActive: true },
    })
  }

  return { success: true }
}

// Envia push para um usuário via web-push
export async function sendPushNotification(params: {
  userId?: string
  title: string
  body: string
  url?: string
}) {
  const wp = getWebPush()

  if (!wp) {
    console.log('[PUSH] VAPID não configurado — adicione NEXT_PUBLIC_VAPID_PUBLIC_KEY e VAPID_PRIVATE_KEY no .env')
    return { success: false, reason: 'vapid_not_configured' }
  }

  const subscriptions = params.userId
    ? await prisma.pushSubscription.findMany({ where: { userId: params.userId, isActive: true } })
    : await prisma.pushSubscription.findMany({ where: { isActive: true } })

  const payload = JSON.stringify({
    title: params.title,
    body: params.body,
    url: params.url || '/',
  })

  let sent = 0
  const results = await Promise.allSettled(
    subscriptions.map(async (sub) => {
      try {
        await wp.sendNotification(
          {
            endpoint: sub.endpoint,
            keys: {
              p256dh: sub.p256dhKey,
              auth: sub.authKey,
            },
          },
          payload
        )
        sent++
      } catch (err: unknown) {
        // Remove subscriptions inválidas (410 = expirada)
        const statusCode = (err as { statusCode?: number })?.statusCode
        if (statusCode === 410 || statusCode === 404) {
          await prisma.pushSubscription.update({
            where: { id: sub.id },
            data: { isActive: false },
          })
        }
      }
    })
  )

  return { success: true, sent, total: subscriptions.length, results: results.length }
}

// Envia push para todos os subscribers (broadcast)
export async function broadcastPushNotification(params: {
  title: string
  body: string
  url?: string
}) {
  return sendPushNotification(params)
}
