import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

// Vercel Cron: executar a cada hora
// vercel.json: { "crons": [{ "path": "/api/cron/abandoned-cart", "schedule": "0 * * * *" }] }
export async function GET(req: NextRequest) {
  // Valida secret do cron
  const cronSecret = req.headers.get('authorization')
  if (!process.env.CRON_SECRET || cronSecret !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Pedidos pending há mais de 1h (possível carrinho abandonado)
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000)
  const abandonedOrders = await prisma.order.findMany({
    where: {
      status: 'pending',
      paymentStatus: 'pending',
      createdAt: { lte: oneHourAgo },
    },
    include: { user: { select: { email: true, name: true } }, items: { take: 1 } },
    take: 50,
  })

  let sent = 0
  for (const order of abandonedOrders) {
    // TODO Sprint 13 completo: enviar email via Resend
    // await sendAbandonedCart({ to: order.user.email, customerName: order.user.name, ... })
    console.log('[CRON] Carrinho abandonado:', order.id, order.user.email)
    sent++
  }

  return NextResponse.json({ processed: sent, timestamp: new Date().toISOString() })
}
