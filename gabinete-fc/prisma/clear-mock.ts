/**
 * ╔══════════════════════════════════════════════════════════════╗
 * ║       GABINETE FC — LIMPEZA DE DADOS MOCADOS (DEMO)         ║
 * ║                                                              ║
 * ║  Execute antes de ir para produção:                         ║
 * ║  npx tsx prisma/clear-mock.ts                               ║
 * ╚══════════════════════════════════════════════════════════════╝
 */

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🧹 Iniciando limpeza de dados mocados...\n')

  // ── Emails de usuários mocados (padrão @mockgabinete.demo)
  const mockEmails = [
    'carlos@mockgabinete.demo',
    'ana@mockgabinete.demo',
    'roberto@mockgabinete.demo',
    'juliana@mockgabinete.demo',
    'marcos@mockgabinete.demo',
    'fernanda@mockgabinete.demo',
    'diego@mockgabinete.demo',
  ]

  // Busca IDs dos usuários mock
  const mockUsers = await prisma.user.findMany({
    where: { email: { in: mockEmails } },
    select: { id: true, email: true },
  })
  const mockUserIds = mockUsers.map(u => u.id)
  console.log(`👥 Encontrados ${mockUsers.length} usuários mock: ${mockUsers.map(u => u.email).join(', ')}`)

  if (mockUserIds.length > 0) {
    // Busca pedidos dos usuários mock
    const mockOrders = await prisma.order.findMany({
      where: { userId: { in: mockUserIds } },
      select: { id: true },
    })
    const mockOrderIds = mockOrders.map(o => o.id)
    console.log(`🛒 ${mockOrders.length} pedidos mock encontrados`)

    // Remove em cascata
    await prisma.returnRequest.deleteMany({ where: { orderId: { in: mockOrderIds } } })
    await prisma.orderHistory.deleteMany({ where: { orderId: { in: mockOrderIds } } })
    await prisma.orderItem.deleteMany({ where: { orderId: { in: mockOrderIds } } })
    await prisma.order.deleteMany({ where: { id: { in: mockOrderIds } } })
    console.log('   ✓ Pedidos e histórico removidos')

    // Remove avaliações
    const deletedReviews = await prisma.review.deleteMany({ where: { userId: { in: mockUserIds } } })
    console.log(`   ✓ ${deletedReviews.count} avaliações removidas`)

    // Remove pontos de fidelidade
    const deletedPoints = await prisma.loyaltyPoint.deleteMany({ where: { userId: { in: mockUserIds } } })
    console.log(`   ✓ ${deletedPoints.count} pontos de fidelidade removidos`)

    // Remove alertas de estoque dos usuários mock
    const deletedAlerts = await prisma.stockAlert.deleteMany({ where: { userId: { in: mockUserIds } } })
    console.log(`   ✓ ${deletedAlerts.count} alertas de estoque removidos`)

    // Remove wishlists
    const deletedWish = await prisma.wishlist.deleteMany({ where: { userId: { in: mockUserIds } } })
    console.log(`   ✓ ${deletedWish.count} wishlists removidos`)

    // Remove endereços
    const deletedAddr = await prisma.address.deleteMany({ where: { userId: { in: mockUserIds } } })
    console.log(`   ✓ ${deletedAddr.count} endereços removidos`)

    // Remove usuários
    const deletedUsers = await prisma.user.deleteMany({ where: { id: { in: mockUserIds } } })
    console.log(`   ✓ ${deletedUsers.count} usuários removidos\n`)
  }

  // ── Remove alertas de estoque do email de externos mock
  await prisma.stockAlert.deleteMany({
    where: { email: { in: ['interessado1@example.com', 'interessado2@example.com'] } },
  })

  // ── Remove sessões de analytics mock (padrão sess_mock_)
  const deletedEvents = await prisma.$executeRaw`
    DELETE FROM behavior_events WHERE sessionId LIKE 'sess\_mock\_%' ESCAPE '\'
  `
  console.log(`📈 ${deletedEvents} eventos de analytics mock removidos`)

  // ── Remove produtos adicionados pelo mock (slugs específicos)
  const mockSlugs = [
    'camisa-franca-2024-titular',
    'camisa-portugal-2024-titular',
    'camisa-alemanha-2024-titular',
    'camisa-italia-2024-reserva',
    'camisa-brasil-2024-reserva',
    'camisa-manchester-city-2024-titular',
    'camisa-liverpool-2024-titular',
    'camisa-psg-2024-titular',
    'camisa-juventus-2024-titular',
    'camisa-corinthians-2024-titular',
    'camisa-sao-paulo-2024-titular',
    'camisa-palmeiras-2024-titular',
    'camisa-argentina-retro-1986',
    'camisa-italia-retro-1982',
    'camisa-holanda-retro-1988',
  ]

  // Remove dependências dos produtos mock primeiro
  const mockProductIds = await prisma.product.findMany({
    where: { slug: { in: mockSlugs } },
    select: { id: true },
  })
  const mockProdIds = mockProductIds.map(p => p.id)

  if (mockProdIds.length > 0) {
    await prisma.stockMovement.deleteMany({ where: { productId: { in: mockProdIds } } })
    await prisma.stockAlert.deleteMany({ where: { productId: { in: mockProdIds } } })
    await prisma.review.deleteMany({ where: { productId: { in: mockProdIds } } })
    await prisma.wishlist.deleteMany({ where: { productId: { in: mockProdIds } } })
    const deletedProds = await prisma.product.deleteMany({ where: { slug: { in: mockSlugs } } })
    console.log(`📦 ${deletedProds.count} produtos mock removidos`)
  }

  // Remove movimentos de estoque dos produtos do seed principal
  const deletedMoves = await prisma.stockMovement.deleteMany({
    where: { reason: { contains: 'Recebimento JIN Sports — Lote Trimestral' } },
  })
  console.log(`📊 ${deletedMoves.count} movimentos de estoque mock removidos`)

  // ── Remove cupons mock (exceto os que foram criados pelo admin real)
  const mockCouponCodes = ['BEMVINDO10', 'FRETE0', 'COPA2024', 'VIP20', 'REVIEW5', 'NATAL25', 'BLACKFRI30']
  const deletedCoupons = await prisma.coupon.deleteMany({
    where: { code: { in: mockCouponCodes } },
  })
  console.log(`🎟️ ${deletedCoupons.count} cupons mock removidos`)

  // ── Remove promoções mock
  const deletedPromos = await prisma.promotion.deleteMany({
    where: { name: { in: ['Leve 3, Pague 2 — Retrô', '10% OFF Clubes Brasileiros', 'Black Friday 30% — Encerrada'] } },
  })
  console.log(`🎯 ${deletedPromos.count} promoções mock removidas`)

  // ── Remove banners mock
  const deletedBanners = await prisma.banner.deleteMany({
    where: { title: { in: ['Copa 2024 — Coleção Oficial', 'Frete Grátis acima de R$500', 'Coleção Retrô — Clássicos do Futebol'] } },
  })
  console.log(`🖼️ ${deletedBanners.count} banners mock removidos`)

  console.log('\n' + '═'.repeat(60))
  console.log('✅ Limpeza concluída! Banco de dados pronto para produção.')
  console.log('   Mantidos: Admin, produtos base do seed, configurações da loja.')
  console.log('═'.repeat(60))
}

main()
  .catch(e => { console.error(e); process.exit(1) })
  .finally(() => prisma.$disconnect())
