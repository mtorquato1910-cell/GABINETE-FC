import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { sendOrderStatusUpdate } from '@/lib/actions/email'

/**
 * Webhook do Supabase Database — disparado quando trackingCode é atualizado na tabela orders.
 * Envia email automático pro cliente com o código de rastreio.
 *
 * Configurar no Supabase: Database → Webhooks → Create webhook
 *   - Table: orders
 *   - Events: UPDATE
 *   - URL: https://gabinetefc.com.br/api/webhooks/tracking-updated
 *   - HTTP Headers: x-webhook-secret = <TRACKING_WEBHOOK_SECRET>
 */
export async function POST(req: NextRequest) {
  // Autenticação via header secreto
  const secret = req.headers.get('x-webhook-secret')
  if (!process.env.TRACKING_WEBHOOK_SECRET || secret !== process.env.TRACKING_WEBHOOK_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const payload = await req.json()
    const { type, table, record, old_record } = payload as {
      type: string
      table: string
      record: { id: string; trackingCode: string | null; userId: string }
      old_record: { trackingCode: string | null } | null
    }

    // Só processa UPDATEs na tabela orders
    if (type !== 'UPDATE' || table !== 'orders') {
      return NextResponse.json({ skipped: true, reason: 'not-orders-update' })
    }

    const newCode = record?.trackingCode
    const oldCode = old_record?.trackingCode ?? null

    // Só dispara se trackingCode FOI ADICIONADO ou MUDOU (não em outros UPDATEs)
    if (!newCode || newCode === oldCode) {
      return NextResponse.json({ skipped: true, reason: 'tracking-unchanged' })
    }

    // Busca o pedido + cliente
    const order = await prisma.order.findUnique({
      where: { id: record.id },
      include: { user: { select: { email: true, name: true } } },
    })

    if (!order || !order.user?.email) {
      return NextResponse.json({ error: 'order or user not found' }, { status: 404 })
    }

    // Atualiza status do pedido pra "shipped" automaticamente
    await prisma.order.update({
      where: { id: order.id },
      data: { status: 'shipped', trackingUpdatedAt: new Date() },
    })

    // Registra no histórico
    await prisma.orderHistory.create({
      data: {
        orderId: order.id,
        action: 'tracking_added',
        toStatus: 'shipped',
        note: `Código de rastreio: ${newCode}`,
      },
    })

    // Envia email pro cliente
    await sendOrderStatusUpdate({
      to: order.user.email,
      customerName: order.user.name ?? 'Cliente',
      orderId: order.id,
      status: 'shipped',
      trackingCode: newCode,
    })

    return NextResponse.json({ success: true, orderId: order.id, trackingCode: newCode })
  } catch (err) {
    console.error('[webhook tracking-updated]', err)
    return NextResponse.json({ error: 'internal error' }, { status: 500 })
  }
}
