import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

/**
 * Cron: marca como cancelados/expirados pedidos Infinity Pay que ficaram
 * pending por >24h. Webhook da Infinity só dispara em pagamento aprovado —
 * pedidos abandonados pelo cliente nunca recebem callback, então ficariam
 * presos como `pending` pra sempre se não fizéssemos esse cleanup.
 *
 * Limitação: `checkPayment` da Infinity exige transaction_nsu + invoice_slug,
 * que SÓ vêm no webhook. Logo, pra pedidos sem webhook recebido, não conseguimos
 * confirmar com a Infinity se houve pagamento — usamos só o critério de tempo.
 *
 * Schedule sugerido (vercel.json): "0 * * * *" — toda hora cheia.
 */

// Pedidos pending por mais de 24h são considerados abandonados
const EXPIRY_HOURS = 24

// Limita batch por execução pra não estourar timeout do Vercel
const BATCH_SIZE = 100

export async function GET(req: NextRequest) {
  const cronSecret = req.headers.get('authorization')
  if (!process.env.CRON_SECRET || cronSecret !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const cutoff = new Date(Date.now() - EXPIRY_HOURS * 60 * 60 * 1000)

  const stale = await prisma.order.findMany({
    where: {
      paymentMethod: 'infinitepay',
      paymentStatus: 'pending',
      createdAt: { lte: cutoff },
    },
    select: { id: true, total: true, createdAt: true },
    orderBy: { createdAt: 'asc' },
    take: BATCH_SIZE,
  })

  let expired = 0
  let errors = 0

  for (const order of stale) {
    try {
      // Transação: muda status + grava histórico, atômico.
      // WHERE inclui paymentStatus='pending' pra evitar race com webhook
      // que pode chegar tarde (count=0 = no-op se já mudou).
      const result = await prisma.$transaction(async (tx) => {
        const updated = await tx.order.updateMany({
          where: { id: order.id, paymentStatus: 'pending' },
          data: { paymentStatus: 'failed', status: 'cancelled' },
        })

        if (updated.count === 0) return false

        await tx.orderHistory.create({
          data: {
            orderId: order.id,
            action: 'auto_expired',
            fromStatus: 'pending',
            toStatus: 'cancelled',
            note: `Expirado automaticamente após ${EXPIRY_HOURS}h sem confirmação de pagamento`,
          },
        })
        return true
      })

      if (result) expired++
    } catch (err) {
      errors++
      console.error('[cron/check-pending-orders] erro ao expirar', {
        orderId: order.id,
        err: err instanceof Error ? err.message : String(err),
      })
    }
  }

  console.log('[cron/check-pending-orders]', {
    scanned: stale.length,
    expired,
    errors,
    cutoff: cutoff.toISOString(),
  })

  return NextResponse.json({
    scanned: stale.length,
    expired,
    errors,
    cutoff: cutoff.toISOString(),
    timestamp: new Date().toISOString(),
  })
}
