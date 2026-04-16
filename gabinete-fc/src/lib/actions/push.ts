'use server'
import { prisma } from '@/lib/db'

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

// Envia push para um usuário (stub)
// TODO Sprint 15: Implementar com web-push library
export async function sendPushNotification(params: {
  userId?: string
  title: string
  body: string
  url?: string
}) {
  console.log('[PUSH STUB] Notificação:', params)

  const subscriptions = params.userId
    ? await prisma.pushSubscription.findMany({ where: { userId: params.userId, isActive: true } })
    : []

  // TODO: usar web-push para enviar de verdade
  // const webpush = require('web-push')
  // webpush.setVapidDetails(...)
  // for (const sub of subscriptions) { await webpush.sendNotification(...) }

  return { success: true, sent: subscriptions.length }
}
