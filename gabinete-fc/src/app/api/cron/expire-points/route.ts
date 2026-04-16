import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

// Vercel Cron: executar diariamente à meia-noite
export async function GET(req: NextRequest) {
  const cronSecret = req.headers.get('authorization')
  if (process.env.CRON_SECRET && cronSecret !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Encontra pontos expirados não marcados
  const expiredPoints = await prisma.loyaltyPoint.findMany({
    where: {
      expiresAt: { lte: new Date() },
      points: { gt: 0 },
      action: { not: 'expired' },
    },
    take: 500,
  })

  // Cria entradas negativas para cancelar
  for (const point of expiredPoints) {
    await prisma.loyaltyPoint.create({
      data: {
        userId: point.userId,
        points: -point.points,
        action: 'expired',
        expiresAt: null,
      },
    })
  }

  return NextResponse.json({
    expired: expiredPoints.length,
    timestamp: new Date().toISOString(),
  })
}
