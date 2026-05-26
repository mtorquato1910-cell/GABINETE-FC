'use server'
import { prisma } from '@/lib/db'
import { requireAuth, requireAdmin } from '@/lib/auth'

// Retorna saldo de pontos do usuário logado
export async function getUserPoints() {
  const session = await requireAuth()
  const userId = (session.user as { id: string }).id

  const points = await prisma.loyaltyPoint.findMany({
    where: { userId },
    select: { points: true, expiresAt: true },
  })

  const now = new Date()
  const active = points
    .filter(p => !p.expiresAt || p.expiresAt > now)
    .reduce((sum, p) => sum + p.points, 0)

  return { total: active, history: points }
}

// Adiciona pontos após compra confirmada (chamado no webhook Infinity Pay)
export async function addPurchasePoints(orderId: string, userId: string, total: number) {
  const setting = await prisma.storeSetting.findUnique({ where: { key: 'loyalty_points_per_real' } })
  const pointsPerReal = parseFloat(setting?.value ?? '1')
  const points = Math.floor(total * pointsPerReal)
  if (points <= 0) return

  const expirySetting = await prisma.storeSetting.findUnique({ where: { key: 'loyalty_points_expiry_days' } })
  const expiryDays = parseInt(expirySetting?.value ?? '365')
  const expiresAt = new Date(Date.now() + expiryDays * 24 * 60 * 60 * 1000)

  await prisma.loyaltyPoint.create({
    data: { userId, points, action: 'purchase', orderId, expiresAt },
  })
}

// Admin: pontos duplos para todos os clientes
export async function createDoublePointsCampaign(durationDays: number) {
  await requireAdmin()
  // Registra em store_settings como flag
  await prisma.storeSetting.upsert({
    where: { key: 'double_points_until' },
    update: { value: new Date(Date.now() + durationDays * 24 * 60 * 60 * 1000).toISOString() },
    create: {
      key: 'double_points_until',
      value: new Date(Date.now() + durationDays * 24 * 60 * 60 * 1000).toISOString(),
      category: 'loyalty',
    },
  })
  return { success: true }
}
