/**
 * Inspeciona pedidos recentes (últimas 24h) pra validar se a integração
 * Infinity Pay está funcionando: paymentStatus, captureMethod, slug,
 * receipt, paidAt etc.
 *
 * Uso:
 *   npx dotenv-cli -e .env.local -- npx ts-node --transpile-only --project scripts/tsconfig.json scripts/check-recent-orders.ts
 */
import { PrismaClient } from '@prisma/client'

async function main() {
  const prisma = new PrismaClient()

  const since = new Date(Date.now() - 24 * 60 * 60 * 1000)

  const orders = await prisma.order.findMany({
    where: { createdAt: { gte: since } },
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      total: true,
      paymentStatus: true,
      status: true,
      paymentMethod: true,
      captureMethod: true,
      installments: true,
      paidAt: true,
      infinitepayInvoiceSlug: true,
      infinitepayTransactionNsu: true,
      infinitepayReceiptUrl: true,
      infinitepayCheckoutUrl: true,
      createdAt: true,
      user: { select: { email: true, name: true } },
    },
  })

  const summary = {
    total: orders.length,
    paid: orders.filter((o) => o.paymentStatus === 'paid').length,
    pending: orders.filter((o) => o.paymentStatus === 'pending').length,
    failed: orders.filter((o) => o.paymentStatus === 'failed').length,
  }

  console.log(`\n📊 Pedidos das últimas 24h: ${summary.total}`)
  console.log(`   ✅ paid:    ${summary.paid}`)
  console.log(`   ⏳ pending: ${summary.pending}`)
  console.log(`   ❌ failed:  ${summary.failed}\n`)

  if (orders.length === 0) {
    console.log('Nenhum pedido recente. Tente fazer uma compra de teste pra validar.')
    await prisma.$disconnect()
    return
  }

  console.log('─'.repeat(110))
  for (const o of orders) {
    const idShort = o.id.slice(-8).toUpperCase()
    const when = new Intl.DateTimeFormat('pt-BR', {
      dateStyle: 'short',
      timeStyle: 'short',
    }).format(o.createdAt)
    const totalStr = `R$ ${o.total.toFixed(2)}`
    const statusIcon =
      o.paymentStatus === 'paid' ? '✅' : o.paymentStatus === 'pending' ? '⏳' : '❌'

    console.log(`${statusIcon} #${idShort}  ${totalStr.padStart(10)}  ${when}  ${o.user.email}`)
    console.log(
      `   status=${o.status}  pagamento=${o.paymentStatus}  método=${o.paymentMethod}`,
    )
    if (o.captureMethod) {
      console.log(
        `   capturado: ${o.captureMethod}${o.installments && o.installments > 1 ? ` em ${o.installments}x` : ''}  paidAt=${o.paidAt?.toISOString() ?? '—'}`,
      )
    }
    if (o.infinitepayInvoiceSlug) {
      console.log(`   slug=${o.infinitepayInvoiceSlug}`)
    }
    if (o.infinitepayTransactionNsu) {
      console.log(`   tx_nsu=${o.infinitepayTransactionNsu}`)
    }
    if (o.infinitepayReceiptUrl) {
      console.log(`   recibo=${o.infinitepayReceiptUrl}`)
    }
    if (o.infinitepayCheckoutUrl && !o.infinitepayInvoiceSlug) {
      console.log(`   checkout=${o.infinitepayCheckoutUrl.slice(0, 80)}...`)
    }
    console.log()
  }

  // Diagnóstico
  console.log('─'.repeat(110))
  console.log('🔍 Diagnóstico:\n')
  if (summary.paid > 0) {
    console.log('✅ Webhook FUNCIONANDO — pelo menos 1 pedido foi marcado como paid após pagamento.')
  } else if (summary.pending > 0) {
    console.log('⚠️  Existem pedidos pending mas nenhum paid. Possíveis causas:')
    console.log('   - Cliente ainda não terminou de pagar')
    console.log('   - Webhook chegou mas validation falhou (checar logs Vercel)')
    console.log('   - Cliente pagou mas Infinity não disparou webhook')
    console.log('   Pra debugar um pedido específico, usar checkPayment manualmente.')
  }
  if (summary.failed > 0) {
    console.log(`⚠️  ${summary.failed} pedido(s) falhou — pode ser cron de expiração (>24h) ou recusa real.`)
  }

  await prisma.$disconnect()
}

main().catch((err) => {
  console.error('❌ Erro:', err)
  process.exit(1)
})
