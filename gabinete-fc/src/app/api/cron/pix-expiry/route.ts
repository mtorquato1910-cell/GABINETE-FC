import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

// Vercel Cron: executar a cada 10 minutos
export async function GET(req: NextRequest) {
  const cronSecret = req.headers.get('authorization')
  if (process.env.CRON_SECRET && cronSecret !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Pedidos Pix expirados ainda pending
  const expiredPixOrders = await prisma.order.findMany({
    where: {
      paymentMethod: 'pix',
      paymentStatus: 'pending',
      status: 'pending',
      pixExpiration: { lte: new Date() },
    },
    take: 100,
  })

  for (const order of expiredPixOrders) {
    await prisma.order.update({
      where: { id: order.id },
      data: { status: 'cancelled', paymentStatus: 'failed' },
    })
    await prisma.orderHistory.create({
      data: {
        orderId: order.id,
        action: 'auto_cancelled',
        fromStatus: 'pending',
        toStatus: 'cancelled',
        note: 'Pix expirado automaticamente',
      },
    })
  }

  return NextResponse.json({
    cancelled: expiredPixOrders.length,
    timestamp: new Date().toISOString(),
  })
}
