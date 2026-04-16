import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { trackPackage } from '@/lib/actions/correios'

// Vercel Cron: executar a cada 6h
export async function GET(req: NextRequest) {
  const cronSecret = req.headers.get('authorization')
  if (process.env.CRON_SECRET && cronSecret !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const ordersToTrack = await prisma.order.findMany({
    where: {
      status: 'shipped',
      trackingCode: { not: null },
    },
    take: 100,
  })

  let updated = 0
  for (const order of ordersToTrack) {
    if (!order.trackingCode) continue
    try {
      const tracking = await trackPackage(order.trackingCode)
      await prisma.order.update({
        where: { id: order.id },
        data: {
          trackingEventsJson: JSON.stringify(tracking.events),
          trackingUpdatedAt: new Date(),
          // Se entregue, atualizar status
          ...(tracking.status.toLowerCase().includes('entregue') ? { status: 'delivered' } : {}),
        },
      })
      updated++
    } catch { /* continue */ }
  }

  return NextResponse.json({ updated, timestamp: new Date().toISOString() })
}
