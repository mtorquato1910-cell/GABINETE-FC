/**
 * ╔══════════════════════════════════════════════════════════════╗
 * ║         GABINETE FC — SEED DE DADOS MOCADOS (DEMO)          ║
 * ║                                                              ║
 * ║  ATENÇÃO: Apague todos esses dados antes de ir ao ar!       ║
 * ║  Execute: npx tsx prisma/clear-mock.ts                      ║
 * ║                                                              ║
 * ║  Identificação: emails terminam em @mockgabinete.demo       ║
 * ║  Tag interna:   [MOCK] nos campos notes/body/metadata       ║
 * ╚══════════════════════════════════════════════════════════════╝
 */

import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

// ─── HELPERS ────────────────────────────────────────────────────

function cuid(prefix = 'mock') {
  return `${prefix}_${Math.random().toString(36).slice(2)}${Date.now().toString(36)}`
}

function daysAgo(n: number): Date {
  const d = new Date()
  d.setDate(d.getDate() - n)
  return d
}

function hoursAgo(n: number): Date {
  const d = new Date()
  d.setHours(d.getHours() - n)
  return d
}

// ─── MAIN ───────────────────────────────────────────────────────

async function main() {
  console.log('🎭 Iniciando seed de dados MOCADOS...\n')

  // ── 1. PRODUTOS EXTRAS (além dos 6 do seed principal) ──────────
  console.log('📦 Criando produtos...')

  const productData = [
    // ── Seleções
    {
      name: 'Camisa França I 2024',
      slug: 'camisa-franca-2024-titular',
      description: 'Les Bleus em sua melhor versão. Azul profundo, detalhes tricolore. Tecido DryFit premium.',
      price: 249.90, costPrice: 75.00, supplierCode: 'JIN-FRA-24-T',
      category: 'selecoes', team: 'França', type: 'titular', badge: 'Novo',
      sizesAvailable: JSON.stringify(['P', 'M', 'G', 'GG', 'XG', '2XL']),
      images: JSON.stringify(['/images/products/placeholder-jersey.svg']),
      isActive: true, isFeatured: true,
    },
    {
      name: 'Camisa Portugal I 2024',
      slug: 'camisa-portugal-2024-titular',
      description: 'A camisa de CR7 e Bernardo Silva. Vermelho e verde com crest bordado.',
      price: 249.90, costPrice: 75.00, supplierCode: 'JIN-POR-24-T',
      category: 'selecoes', team: 'Portugal', type: 'titular', badge: 'Esgotando',
      sizesAvailable: JSON.stringify(['P', 'M', 'G', 'GG']),
      images: JSON.stringify(['/images/products/placeholder-jersey.svg']),
      isActive: true, isFeatured: true,
    },
    {
      name: 'Camisa Alemanha I 2024',
      slug: 'camisa-alemanha-2024-titular',
      description: 'Die Mannschaft. Branca com detalhes em preto. Edição Eurocopa 2024.',
      price: 239.90, costPrice: 72.00, supplierCode: 'JIN-GER-24-T',
      category: 'selecoes', team: 'Alemanha', type: 'titular',
      sizesAvailable: JSON.stringify(['P', 'M', 'G', 'GG', 'XG', '2XL', '3XL']),
      images: JSON.stringify(['/images/products/placeholder-jersey.svg']),
      isActive: true, isFeatured: false,
    },
    {
      name: 'Camisa Itália II 2024',
      slug: 'camisa-italia-2024-reserva',
      description: 'Gli Azzurri no uniforme reserva branco. Elegância italiana pura.',
      price: 239.90, costPrice: 72.00, supplierCode: 'JIN-ITA-24-R',
      category: 'selecoes', team: 'Itália', type: 'reserva', badge: 'Exclusivo',
      sizesAvailable: JSON.stringify(['P', 'M', 'G', 'GG', 'XG']),
      images: JSON.stringify(['/images/products/placeholder-jersey.svg']),
      isActive: true, isFeatured: false,
    },
    {
      name: 'Camisa Brasil II 2024 (Azul)',
      slug: 'camisa-brasil-2024-reserva',
      description: 'A camisa azul da Seleção. Raridade. Poucas unidades disponíveis.',
      price: 249.90, costPrice: 75.00, supplierCode: 'JIN-BRA-24-R',
      category: 'selecoes', team: 'Brasil', type: 'reserva', badge: 'Limitado',
      sizesAvailable: JSON.stringify(['M', 'G', 'GG']),
      images: JSON.stringify(['/images/products/placeholder-jersey.svg']),
      isActive: true, isFeatured: true,
    },
    // ── Clubes Europeus
    {
      name: 'Camisa Manchester City I 2024/25',
      slug: 'camisa-manchester-city-2024-titular',
      description: 'O Azul de Haaland e De Bruyne. Campeão da Premier League.',
      price: 229.90, costPrice: 68.00, supplierCode: 'JIN-MCI-24-T',
      category: 'clubes-europeus', team: 'Manchester City', type: 'titular',
      sizesAvailable: JSON.stringify(['P', 'M', 'G', 'GG', 'XG', '2XL']),
      images: JSON.stringify(['/images/products/placeholder-jersey.svg']),
      isActive: true, isFeatured: false,
    },
    {
      name: 'Camisa Liverpool I 2024/25',
      slug: 'camisa-liverpool-2024-titular',
      description: 'You\'ll Never Walk Alone. Vermelho eterno de Anfield.',
      price: 229.90, costPrice: 68.00, supplierCode: 'JIN-LIV-24-T',
      category: 'clubes-europeus', team: 'Liverpool', type: 'titular', badge: 'Novo',
      sizesAvailable: JSON.stringify(['P', 'M', 'G', 'GG', 'XG', '2XL', '3XL']),
      images: JSON.stringify(['/images/products/placeholder-jersey.svg']),
      isActive: true, isFeatured: true,
    },
    {
      name: 'Camisa PSG I 2024/25',
      slug: 'camisa-psg-2024-titular',
      description: 'Paris Saint-Germain. Azul marinho, detalhes vermelhos. A camisa de Mbappé.',
      price: 229.90, costPrice: 68.00, supplierCode: 'JIN-PSG-24-T',
      category: 'clubes-europeus', team: 'PSG', type: 'titular',
      sizesAvailable: JSON.stringify(['P', 'M', 'G', 'GG', 'XG']),
      images: JSON.stringify(['/images/products/placeholder-jersey.svg']),
      isActive: true, isFeatured: false,
    },
    {
      name: 'Camisa Juventus I 2024/25',
      slug: 'camisa-juventus-2024-titular',
      description: 'La Vecchia Signora. Listras preto e branco clássicas. Qualidade italiana.',
      price: 219.90, costPrice: 65.00, supplierCode: 'JIN-JUV-24-T',
      category: 'clubes-europeus', team: 'Juventus', type: 'titular',
      sizesAvailable: JSON.stringify(['P', 'M', 'G', 'GG', 'XG', '2XL']),
      images: JSON.stringify(['/images/products/placeholder-jersey.svg']),
      isActive: true, isFeatured: false,
    },
    // ── Clubes Brasileiros
    {
      name: 'Camisa Corinthians I 2024',
      slug: 'camisa-corinthians-2024-titular',
      description: 'Camisa alvinegra do povo. Fiel até o fim. Escudo bordado.',
      price: 199.90, costPrice: 60.00, supplierCode: 'JIN-COR-24-T',
      category: 'clubes-brasileiros', team: 'Corinthians', type: 'titular',
      sizesAvailable: JSON.stringify(['P', 'M', 'G', 'GG', 'XG', '2XL', '3XL']),
      images: JSON.stringify(['/images/products/placeholder-jersey.svg']),
      isActive: true, isFeatured: false,
    },
    {
      name: 'Camisa São Paulo I 2024',
      slug: 'camisa-sao-paulo-2024-titular',
      description: 'Tricolor paulistano. Branco, vermelho e preto. Orgulho do Morumbi.',
      price: 199.90, costPrice: 60.00, supplierCode: 'JIN-SAO-24-T',
      category: 'clubes-brasileiros', team: 'São Paulo', type: 'titular',
      sizesAvailable: JSON.stringify(['P', 'M', 'G', 'GG', 'XG', '2XL']),
      images: JSON.stringify(['/images/products/placeholder-jersey.svg']),
      isActive: true, isFeatured: false,
    },
    {
      name: 'Camisa Palmeiras I 2024',
      slug: 'camisa-palmeiras-2024-titular',
      description: 'Verdão campeão. Verde e branco em tecido de alta performance.',
      price: 199.90, costPrice: 60.00, supplierCode: 'JIN-PAL-24-T',
      category: 'clubes-brasileiros', team: 'Palmeiras', type: 'titular', badge: 'Top Venda',
      sizesAvailable: JSON.stringify(['P', 'M', 'G', 'GG', 'XG', '2XL', '3XL']),
      images: JSON.stringify(['/images/products/placeholder-jersey.svg']),
      isActive: true, isFeatured: true,
    },
    // ── Retrô
    {
      name: 'Camisa Argentina Retrô 1986',
      slug: 'camisa-argentina-retro-1986',
      description: 'A camisa de Maradona na Copa do México. Listras azuis e brancas históricas.',
      price: 219.90, costPrice: 65.00, supplierCode: 'JIN-ARG-86-R',
      category: 'retro', team: 'Argentina', type: 'titular', badge: 'Colecionador',
      sizesAvailable: JSON.stringify(['P', 'M', 'G', 'GG']),
      images: JSON.stringify(['/images/products/placeholder-jersey.svg']),
      isActive: true, isFeatured: true,
    },
    {
      name: 'Camisa Itália Retrô 1982',
      slug: 'camisa-italia-retro-1982',
      description: 'Campeões do mundo na Espanha. Azul escuro clássico. Paolo Rossi eterno.',
      price: 219.90, costPrice: 65.00, supplierCode: 'JIN-ITA-82-R',
      category: 'retro', team: 'Itália', type: 'titular', badge: 'Edição Especial',
      sizesAvailable: JSON.stringify(['P', 'M', 'G', 'GG']),
      images: JSON.stringify(['/images/products/placeholder-jersey.svg']),
      isActive: true, isFeatured: false,
    },
    {
      name: 'Camisa Holanda Retrô 1988',
      slug: 'camisa-holanda-retro-1988',
      description: 'A laranja mecânica. Van Basten, Gullit, Rijkaard. Histórica Eurocopa 88.',
      price: 219.90, costPrice: 65.00, supplierCode: 'JIN-HOL-88-R',
      category: 'retro', team: 'Holanda', type: 'titular', badge: 'Raro',
      sizesAvailable: JSON.stringify(['P', 'M', 'G']),
      images: JSON.stringify(['/images/products/placeholder-jersey.svg']),
      isActive: true, isFeatured: false,
    },
  ]

  const createdProducts: { id: string; name: string; price: number }[] = []

  for (const p of productData) {
    const existing = await prisma.product.findUnique({ where: { slug: p.slug } })
    if (!existing) {
      const prod = await prisma.product.create({ data: p })
      createdProducts.push({ id: prod.id, name: prod.name, price: prod.price })
    } else {
      createdProducts.push({ id: existing.id, name: existing.name, price: existing.price })
    }
  }

  // Busca todos os produtos para usar nos pedidos
  const allProducts = await prisma.product.findMany({ where: { isActive: true } })
  console.log(`   ✓ ${allProducts.length} produtos disponíveis\n`)

  // ── 2. USUÁRIOS MOCADOS ─────────────────────────────────────────
  console.log('👥 Criando usuários...')

  const customerPassword = await bcrypt.hash('Cliente@123', 10)

  const usersData = [
    { name: 'Carlos Eduardo Silva',   email: 'carlos@mockgabinete.demo',   phone: '11987654321', cpf: '123.456.789-01', isVip: true  },
    { name: 'Ana Paula Ferreira',     email: 'ana@mockgabinete.demo',      phone: '21976543210', cpf: '234.567.890-12', isVip: false },
    { name: 'Roberto Almeida',        email: 'roberto@mockgabinete.demo',  phone: '31965432109', cpf: '345.678.901-23', isVip: false },
    { name: 'Juliana Costa',          email: 'juliana@mockgabinete.demo',  phone: '41954321098', cpf: '456.789.012-34', isVip: true  },
    { name: 'Marcos Vinicius Santos', email: 'marcos@mockgabinete.demo',   phone: '51943210987', cpf: '567.890.123-45', isVip: false },
    { name: 'Fernanda Lima',          email: 'fernanda@mockgabinete.demo', phone: '61932109876', cpf: '678.901.234-56', isVip: false },
    { name: 'Diego Souza',            email: 'diego@mockgabinete.demo',    phone: '71921098765', cpf: '789.012.345-67', isVip: false },
  ]

  const users: { id: string; email: string; name: string }[] = []
  for (const u of usersData) {
    const user = await prisma.user.upsert({
      where: { email: u.email },
      update: {},
      create: {
        ...u,
        password: customerPassword,
        role: 'customer',
        emailVerified: daysAgo(15),
        createdAt: daysAgo(Math.floor(Math.random() * 90 + 10)),
      },
    })
    users.push({ id: user.id, email: user.email, name: user.name ?? '' })
  }
  console.log(`   ✓ ${users.length} usuários criados\n`)

  // ── 3. ENDEREÇOS ────────────────────────────────────────────────
  console.log('📍 Criando endereços...')

  const addressData = [
    { userId: users[0].id, label: 'Casa', recipientName: 'Carlos Eduardo Silva',   street: 'Rua das Palmeiras',       number: '123', neighborhood: 'Jardim Paulista',   city: 'São Paulo',       state: 'SP', zipCode: '01423-000', isDefault: true  },
    { userId: users[1].id, label: 'Casa', recipientName: 'Ana Paula Ferreira',     street: 'Av. Atlântica',           number: '456', neighborhood: 'Copacabana',         city: 'Rio de Janeiro',  state: 'RJ', zipCode: '22070-000', isDefault: true  },
    { userId: users[2].id, label: 'Casa', recipientName: 'Roberto Almeida',        street: 'Rua dos Diamantes',       number: '789', neighborhood: 'Savassi',            city: 'Belo Horizonte',  state: 'MG', zipCode: '30130-010', isDefault: true  },
    { userId: users[3].id, label: 'Casa', recipientName: 'Juliana Costa',          street: 'Av. Batel',               number: '321', neighborhood: 'Batel',              city: 'Curitiba',        state: 'PR', zipCode: '80420-090', isDefault: true  },
    { userId: users[4].id, label: 'Casa', recipientName: 'Marcos Vinicius Santos', street: 'Rua Independência',       number: '654', neighborhood: 'Moinhos de Vento',   city: 'Porto Alegre',    state: 'RS', zipCode: '90035-070', isDefault: true  },
    { userId: users[5].id, label: 'Casa', recipientName: 'Fernanda Lima',          street: 'Rua dos Ipês',            number: '987', neighborhood: 'Setor Bueno',        city: 'Goiânia',         state: 'GO', zipCode: '74210-050', isDefault: true  },
    { userId: users[6].id, label: 'Casa', recipientName: 'Diego Souza',            street: 'Av. Tancredo Neves',      number: '200', neighborhood: 'Caminho das Árvores', city: 'Salvador',       state: 'BA', zipCode: '41820-021', isDefault: true  },
    // Segundo endereço (trabalho) para Carlos
    { userId: users[0].id, label: 'Trabalho', recipientName: 'Carlos Eduardo Silva', street: 'Av. Paulista', number: '1000', complement: 'Andar 12', neighborhood: 'Bela Vista', city: 'São Paulo', state: 'SP', zipCode: '01310-100', isDefault: false },
  ]

  const addresses: { id: string; userId: string }[] = []
  for (const a of addressData) {
    const addr = await prisma.address.create({ data: a })
    addresses.push({ id: addr.id, userId: addr.userId })
  }
  console.log(`   ✓ ${addresses.length} endereços criados\n`)

  // Helper: address by userId
  const addressByUser = (userId: string) =>
    addresses.find(a => a.userId === userId)!

  // ── 4. CUPONS ───────────────────────────────────────────────────
  console.log('🎟️ Criando cupons...')

  const couponsData = [
    { code: 'BEMVINDO10',  type: 'percent', value: 10, minOrderValue: 0,   maxUses: 100, usedCount: 47, isActive: true,  expiresAt: null },
    { code: 'FRETE0',      type: 'fixed',   value: 30, minOrderValue: 200, maxUses: 50,  usedCount: 23, isActive: true,  expiresAt: null },
    { code: 'COPA2024',    type: 'percent', value: 15, minOrderValue: 300, maxUses: 200, usedCount: 89, isActive: true,  expiresAt: new Date('2026-12-31') },
    { code: 'VIP20',       type: 'percent', value: 20, minOrderValue: 400, maxUses: 30,  usedCount: 12, isActive: true,  expiresAt: null },
    { code: 'REVIEW5',     type: 'fixed',   value: 25, minOrderValue: 0,   maxUses: null, usedCount: 8, isActive: true,  expiresAt: null },
    { code: 'NATAL25',     type: 'percent', value: 25, minOrderValue: 500, maxUses: 100, usedCount: 100, isActive: false, expiresAt: new Date('2025-12-26') },
    { code: 'BLACKFRI30',  type: 'percent', value: 30, minOrderValue: 600, maxUses: 200, usedCount: 200, isActive: false, expiresAt: new Date('2025-11-30') },
  ]

  const coupons: { id: string; code: string }[] = []
  for (const c of couponsData) {
    const existing = await prisma.coupon.findUnique({ where: { code: c.code } })
    if (!existing) {
      const coupon = await prisma.coupon.create({ data: c })
      coupons.push({ id: coupon.id, code: coupon.code })
    } else {
      coupons.push({ id: existing.id, code: existing.code })
    }
  }
  console.log(`   ✓ ${coupons.length} cupons criados\n`)

  // ── 5. PEDIDOS ──────────────────────────────────────────────────
  console.log('🛒 Criando pedidos...')

  type OrderScenario = {
    userId: string
    status: string
    paymentStatus: string
    paymentMethod: string
    freightCost: number
    trackingCode?: string
    carrier?: string
    daysBack: number
    couponId?: string
    couponDiscount?: number
    items: { productIdx: number; size: string; qty: number }[]
    notes?: string
  }

  const orderScenarios: OrderScenario[] = [
    // Carlos — 3 pedidos (VIP)
    {
      userId: users[0].id, status: 'delivered', paymentStatus: 'paid',
      paymentMethod: 'credit_card', freightCost: 0, daysBack: 45,
      trackingCode: 'BR123456789BR', carrier: 'SEDEX',
      items: [{ productIdx: 0, size: 'G', qty: 2 }, { productIdx: 2, size: 'M', qty: 1 }],
    },
    {
      userId: users[0].id, status: 'shipped', paymentStatus: 'paid',
      paymentMethod: 'pix', freightCost: 0, daysBack: 12,
      trackingCode: 'BR987654321BR', carrier: 'PAC',
      couponId: coupons[0].id, couponDiscount: 24.99,
      items: [{ productIdx: 4, size: 'G', qty: 1 }, { productIdx: 12, size: 'G', qty: 1 }],
    },
    {
      userId: users[0].id, status: 'pending', paymentStatus: 'pending',
      paymentMethod: 'pix', freightCost: 22.90, daysBack: 1,
      items: [{ productIdx: 6, size: 'GG', qty: 1 }],
    },
    // Ana — 2 pedidos
    {
      userId: users[1].id, status: 'processing', paymentStatus: 'paid',
      paymentMethod: 'credit_card', freightCost: 19.90, daysBack: 8,
      items: [{ productIdx: 1, size: 'P', qty: 1 }, { productIdx: 13, size: 'P', qty: 1 }],
    },
    {
      userId: users[1].id, status: 'delivered', paymentStatus: 'paid',
      paymentMethod: 'pix', freightCost: 0, daysBack: 60,
      couponId: coupons[2].id, couponDiscount: 37.49,
      items: [{ productIdx: 3, size: 'M', qty: 3 }],
    },
    // Roberto — 1 pedido cancelado
    {
      userId: users[2].id, status: 'cancelled', paymentStatus: 'refunded',
      paymentMethod: 'credit_card', freightCost: 25.90, daysBack: 20,
      items: [{ productIdx: 5, size: 'GG', qty: 1 }],
      notes: '[MOCK] Cancelado a pedido do cliente — troca de tamanho',
    },
    // Juliana — 2 pedidos (VIP)
    {
      userId: users[3].id, status: 'delivered', paymentStatus: 'paid',
      paymentMethod: 'credit_card', freightCost: 0, daysBack: 30,
      couponId: coupons[3].id, couponDiscount: 45.98,
      trackingCode: 'JT456789123BR', carrier: 'SEDEX',
      items: [{ productIdx: 0, size: 'G', qty: 1 }, { productIdx: 1, size: 'G', qty: 1 }],
    },
    {
      userId: users[3].id, status: 'shipped', paymentStatus: 'paid',
      paymentMethod: 'pix', freightCost: 0, daysBack: 5,
      trackingCode: 'JT789456123BR', carrier: 'SEDEX',
      items: [{ productIdx: 6, size: 'M', qty: 2 }],
    },
    // Marcos — 1 pedido
    {
      userId: users[4].id, status: 'processing', paymentStatus: 'paid',
      paymentMethod: 'credit_card', freightCost: 28.90, daysBack: 3,
      items: [{ productIdx: 9, size: 'GG', qty: 1 }, { productIdx: 10, size: 'G', qty: 1 }],
    },
    // Fernanda — 2 pedidos
    {
      userId: users[5].id, status: 'delivered', paymentStatus: 'paid',
      paymentMethod: 'pix', freightCost: 0, daysBack: 50,
      items: [{ productIdx: 11, size: 'M', qty: 1 }],
    },
    {
      userId: users[5].id, status: 'pending', paymentStatus: 'pending',
      paymentMethod: 'pix', freightCost: 24.90, daysBack: 0,
      items: [{ productIdx: 1, size: 'P', qty: 1 }],
    },
    // Diego — 1 pedido em disputa
    {
      userId: users[6].id, status: 'processing', paymentStatus: 'paid',
      paymentMethod: 'credit_card', freightCost: 35.90, daysBack: 7,
      couponId: coupons[1].id, couponDiscount: 30.00,
      items: [{ productIdx: 7, size: 'G', qty: 1 }, { productIdx: 14, size: 'G', qty: 1 }],
    },
  ]

  const createdOrders: { id: string; userId: string; status: string }[] = []

  for (const scenario of orderScenarios) {
    const orderItems = scenario.items.map(item => {
      const product = allProducts[item.productIdx % allProducts.length]
      return {
        productId: product.id,
        productName: product.name,
        productImage: '/images/products/placeholder-jersey.svg',
        size: item.size,
        quantity: item.qty,
        unitPrice: product.price,
        totalPrice: product.price * item.qty,
      }
    })

    const subtotal = orderItems.reduce((s, i) => s + i.totalPrice, 0)
    const discountAmount = scenario.couponDiscount ?? 0
    const total = subtotal + scenario.freightCost - discountAmount

    const createdAt = daysAgo(scenario.daysBack)
    const updatedAt = new Date(createdAt.getTime() + 2 * 60 * 60 * 1000)

    const order = await prisma.order.create({
      data: {
        userId: scenario.userId,
        addressId: addressByUser(scenario.userId).id,
        status: scenario.status,
        paymentStatus: scenario.paymentStatus,
        paymentMethod: scenario.paymentMethod,
        subtotal,
        freightCost: scenario.freightCost,
        discountAmount,
        total,
        couponId: scenario.couponId ?? null,
        trackingCode: scenario.trackingCode ?? null,
        carrier: scenario.carrier ?? null,
        notes: scenario.notes ?? null,
        createdAt,
        updatedAt,
        items: {
          create: orderItems,
        },
      },
    })
    createdOrders.push({ id: order.id, userId: scenario.userId, status: scenario.status })

    // Histórico de status
    const statusFlow: { from: string | null; to: string; daysAfter: number }[] = [
      { from: null, to: 'pending', daysAfter: 0 },
    ]
    if (['processing', 'shipped', 'delivered', 'cancelled'].includes(scenario.status)) {
      statusFlow.push({ from: 'pending', to: 'processing', daysAfter: 0 })
    }
    if (['shipped', 'delivered'].includes(scenario.status)) {
      statusFlow.push({ from: 'processing', to: 'shipped', daysAfter: 2 })
    }
    if (scenario.status === 'delivered') {
      statusFlow.push({ from: 'shipped', to: 'delivered', daysAfter: 8 })
    }
    if (scenario.status === 'cancelled') {
      statusFlow.push({ from: 'processing', to: 'cancelled', daysAfter: 1 })
    }

    const adminUser = await prisma.user.findFirst({ where: { role: 'admin' } })
    for (const sf of statusFlow) {
      await prisma.orderHistory.create({
        data: {
          orderId: order.id,
          adminUserId: sf.from ? adminUser?.id : null,
          action: sf.from ? 'status_changed' : 'order_created',
          fromStatus: sf.from ?? undefined,
          toStatus: sf.to,
          note: sf.to === 'shipped' && scenario.trackingCode
            ? `Rastreio: ${scenario.trackingCode} via ${scenario.carrier}`
            : undefined,
          createdAt: new Date(createdAt.getTime() + sf.daysAfter * 24 * 60 * 60 * 1000),
        },
      })
    }
  }
  console.log(`   ✓ ${createdOrders.length} pedidos criados\n`)

  // ── 6. AVALIAÇÕES ───────────────────────────────────────────────
  console.log('⭐ Criando avaliações...')

  const reviewsData = [
    {
      userId: users[0].id,
      productId: allProducts[0].id,
      rating: 5,
      title: 'Perfeita! Melhor compra do ano',
      body: '[MOCK] Qualidade incrível, tecido leve e resistente. Chegou em 4 dias e a embalagem era top. Já comprei para o meu filho e estamos muito satisfeitos. Com certeza vou comprar mais!',
      status: 'approved',
    },
    {
      userId: users[0].id,
      productId: allProducts[2].id,
      rating: 5,
      title: 'Real Madrid impecável',
      body: '[MOCK] A camisa é exatamente como na foto. Bordado do escudo muito bonito, tecido de qualidade. Frete rápido. Recomendo!',
      status: 'approved',
    },
    {
      userId: users[1].id,
      productId: allProducts[1].id,
      rating: 4,
      title: 'Muito boa, só achei o tamanho P pequeno',
      body: '[MOCK] A camisa é linda e o tecido é ótimo. Só acho que o tamanho P cai um pouco justo comparado com outras marcas. Tirando isso, qualidade excelente e entrega no prazo.',
      status: 'approved',
      adminResponse: 'Olá Ana! Obrigada pela avaliação. Trabalhamos com a tabela padrão da JIN Sports, mas caso queira trocar o tamanho basta entrar em contato conosco. 😊',
    },
    {
      userId: users[3].id,
      productId: allProducts[0].id,
      rating: 5,
      title: 'Comprei 2, uma de presente',
      body: '[MOCK] Comprei para mim e de presente para minha irmã. As duas adoraram! Serviço de primeira, site fácil de usar e a camisa chegou antes do prazo estimado. 10/10!',
      status: 'approved',
    },
    {
      userId: users[3].id,
      productId: allProducts[1].id,
      rating: 5,
      title: 'Albiceleste!',
      body: '[MOCK] Fã da Argentina desde criança. Essa camisa é idêntica à original. Vou usar na Copa com orgulho. Qualidade premium, tecido respirável e detalhes perfeitos.',
      status: 'approved',
    },
    {
      userId: users[4].id,
      productId: allProducts[9].id,
      rating: 3,
      title: 'Boa mas demorou',
      body: '[MOCK] A camisa é boa, qualidade acima da média do mercado. Único ponto negativo foi o prazo de entrega que demorou 12 dias quando estava previsto para 7. Produto aprovado!',
      status: 'approved',
    },
    {
      userId: users[5].id,
      productId: allProducts[11].id,
      rating: 5,
      title: 'Palmeiras melhor do Brasil 🐷',
      body: '[MOCK] Verde que eu amo! Camisa pesada e bem feita, bordado top. Frete grátis porque meu pedido passou de R$500 (comprei 3 no total). Super recomendo a loja!',
      status: 'approved',
    },
    // Pendente de aprovação
    {
      userId: users[2].id,
      productId: allProducts[5].id,
      rating: 2,
      title: 'Não gostei da costura',
      body: '[MOCK] A camisa veio com um pequeno defeito na costura lateral. Entrei em contato com o suporte e estão resolvendo. Aguardando a troca para atualizar a nota.',
      status: 'pending',
    },
    {
      userId: users[6].id,
      productId: allProducts[7].id,
      rating: 4,
      title: 'PSG top, era pra ser 5 estrelas',
      body: '[MOCK] Camisa linda. Perdi uma estrela só porque achei o frete um pouquinho caro para Salvador, mas o produto em si é excelente. Recomendo!',
      status: 'pending',
    },
  ]

  for (const r of reviewsData) {
    await prisma.review.create({
      data: {
        ...r,
        createdAt: daysAgo(Math.floor(Math.random() * 40 + 5)),
        updatedAt: new Date(),
      },
    })
  }
  console.log(`   ✓ ${reviewsData.length} avaliações criadas\n`)

  // ── 7. PONTOS DE FIDELIDADE ─────────────────────────────────────
  console.log('💎 Criando pontos de fidelidade...')

  const loyaltyData = [
    // Carlos (VIP)
    { userId: users[0].id, points: 499, action: 'purchase', createdAt: daysAgo(45) },
    { userId: users[0].id, points: 229, action: 'purchase', createdAt: daysAgo(12) },
    { userId: users[0].id, points: 50,  action: 'review',   createdAt: daysAgo(40) },
    { userId: users[0].id, points: 50,  action: 'review',   createdAt: daysAgo(35) },
    // Ana
    { userId: users[1].id, points: 459, action: 'purchase', createdAt: daysAgo(60) },
    { userId: users[1].id, points: 50,  action: 'review',   createdAt: daysAgo(55) },
    // Juliana (VIP)
    { userId: users[3].id, points: 414, action: 'purchase', createdAt: daysAgo(30) },
    { userId: users[3].id, points: 460, action: 'purchase', createdAt: daysAgo(5) },
    { userId: users[3].id, points: 100, action: 'double_points', createdAt: daysAgo(28) },
    // Marcos
    { userId: users[4].id, points: 389, action: 'purchase', createdAt: daysAgo(3) },
    // Fernanda
    { userId: users[5].id, points: 199, action: 'purchase', createdAt: daysAgo(50) },
    { userId: users[5].id, points: 50,  action: 'review',   createdAt: daysAgo(45) },
  ]

  for (const lp of loyaltyData) {
    await prisma.loyaltyPoint.create({ data: lp })
  }
  console.log(`   ✓ ${loyaltyData.length} registros de fidelidade\n`)

  // ── 8. MOVIMENTOS DE ESTOQUE ────────────────────────────────────
  console.log('📊 Criando movimentos de estoque...')

  const adminUser = await prisma.user.findFirst({ where: { role: 'admin' } })

  const stockEntries = [
    { productIdx: 0,  size: 'P',  qty: 30 },
    { productIdx: 0,  size: 'M',  qty: 45 },
    { productIdx: 0,  size: 'G',  qty: 50 },
    { productIdx: 0,  size: 'GG', qty: 30 },
    { productIdx: 1,  size: 'P',  qty: 20 },
    { productIdx: 1,  size: 'M',  qty: 35 },
    { productIdx: 1,  size: 'G',  qty: 40 },
    { productIdx: 2,  size: 'M',  qty: 25 },
    { productIdx: 2,  size: 'G',  qty: 35 },
    { productIdx: 2,  size: 'GG', qty: 20 },
    { productIdx: 4,  size: 'G',  qty: 60 },
    { productIdx: 4,  size: 'GG', qty: 40 },
    { productIdx: 5,  size: 'M',  qty: 5  },
    { productIdx: 5,  size: 'G',  qty: 8  },
    { productIdx: 11, size: 'M',  qty: 80 },
    { productIdx: 11, size: 'G',  qty: 70 },
    { productIdx: 11, size: 'GG', qty: 50 },
  ]

  for (const entry of stockEntries) {
    const product = allProducts[entry.productIdx % allProducts.length]
    await prisma.stockMovement.create({
      data: {
        productId: product.id,
        size: entry.size,
        type: 'in',
        quantity: entry.qty,
        reason: 'Recebimento JIN Sports — Lote Trimestral',
        adminUserId: adminUser?.id,
        createdAt: daysAgo(Math.floor(Math.random() * 30 + 10)),
      },
    })
    // Algumas saídas por vendas
    if (entry.qty > 20) {
      await prisma.stockMovement.create({
        data: {
          productId: product.id,
          size: entry.size,
          type: 'out',
          quantity: Math.floor(entry.qty * 0.3),
          reason: 'Saída por vendas',
          adminUserId: adminUser?.id,
          createdAt: daysAgo(Math.floor(Math.random() * 10 + 1)),
        },
      })
    }
  }
  console.log(`   ✓ ${stockEntries.length * 1.5} movimentos de estoque\n`)

  // ── 9. ALERTAS DE ESTOQUE ───────────────────────────────────────
  console.log('🔔 Criando alertas de estoque...')

  const stockAlertsData = [
    { productIdx: 5,  size: 'XG', email: 'interessado1@example.com', userId: null },
    { productIdx: 5,  size: 'XG', email: users[2].email, userId: users[2].id },
    { productIdx: 13, size: 'P',  email: 'interessado2@example.com', userId: null },
    { productIdx: 14, size: 'G',  email: users[6].email, userId: users[6].id },
  ]

  for (const sa of stockAlertsData) {
    const product = allProducts[sa.productIdx % allProducts.length]
    await prisma.stockAlert.create({
      data: {
        productId: product.id,
        size: sa.size,
        email: sa.email,
        userId: sa.userId,
        createdAt: daysAgo(Math.floor(Math.random() * 15 + 1)),
      },
    })
  }
  console.log(`   ✓ ${stockAlertsData.length} alertas de estoque\n`)

  // ── 10. ANALYTICS / BEHAVIOR EVENTS ────────────────────────────
  console.log('📈 Criando eventos de analytics...')

  const utmSources = [
    { source: 'instagram', medium: 'social', campaign: 'copa2024_camisas' },
    { source: 'facebook',  medium: 'cpc',    campaign: 'retargeting_carrinho' },
    { source: 'google',    medium: 'cpc',    campaign: 'branded_gabinetefc' },
    { source: 'google',    medium: 'cpc',    campaign: 'selecoes_copa' },
    { source: null,        medium: null,     campaign: null }, // orgânico
  ]

  const pages = ['/', '/loja', '/produto/camisa-brasil-2024-titular', '/produto/camisa-argentina-2024-titular', '/carrinho', '/checkout', '/loja?categoria=selecoes', '/loja?categoria=retro']

  // Gera 50 sessões simuladas
  const sessions: string[] = []
  for (let i = 0; i < 50; i++) {
    sessions.push(`sess_mock_${i.toString().padStart(3, '0')}`)
  }

  let eventCount = 0
  for (const sessionId of sessions) {
    const utm = utmSources[Math.floor(Math.random() * utmSources.length)]
    const userId = Math.random() > 0.7 ? users[Math.floor(Math.random() * users.length)].id : null
    const sessionStart = daysAgo(Math.floor(Math.random() * 30))
    const sessionPages = pages.slice(0, Math.floor(Math.random() * 4 + 2))

    for (let pi = 0; pi < sessionPages.length; pi++) {
      const evTime = new Date(sessionStart.getTime() + pi * 3 * 60 * 1000)

      // Page view
      await prisma.$executeRaw`
        INSERT INTO behavior_events (id, sessionId, userId, eventType, pageUrl, utmSource, utmMedium, utmCampaign, posX, posY, createdAt)
        VALUES (${cuid()}, ${sessionId}, ${userId}, 'page_view', ${sessionPages[pi]}, ${utm.source}, ${utm.medium}, ${utm.campaign}, NULL, NULL, ${evTime.toISOString()})
      `
      eventCount++

      // Mouse moves e cliques para heatmap
      const nClicks = Math.floor(Math.random() * 5 + 1)
      for (let ci = 0; ci < nClicks; ci++) {
        const posX = Math.round(Math.random() * 100) / 100
        const posY = Math.round(Math.random() * 100) / 100
        const clickTime = new Date(evTime.getTime() + ci * 30 * 1000)

        await prisma.$executeRaw`
          INSERT INTO behavior_events (id, sessionId, userId, eventType, pageUrl, utmSource, utmMedium, utmCampaign, posX, posY, createdAt)
          VALUES (${cuid()}, ${sessionId}, ${userId}, 'click', ${sessionPages[pi]}, ${utm.source}, ${utm.medium}, ${utm.campaign}, ${posX}, ${posY}, ${clickTime.toISOString()})
        `
        eventCount++
      }

      // Mouse moves
      for (let mi = 0; mi < 3; mi++) {
        const posX = Math.round(Math.random() * 100) / 100
        const posY = Math.round(Math.random() * 100) / 100
        const moveTime = new Date(evTime.getTime() + mi * 15 * 1000)

        await prisma.$executeRaw`
          INSERT INTO behavior_events (id, sessionId, userId, eventType, pageUrl, utmSource, utmMedium, utmCampaign, posX, posY, createdAt)
          VALUES (${cuid()}, ${sessionId}, ${userId}, 'mouse_move', ${sessionPages[pi]}, ${utm.source}, ${utm.medium}, ${utm.campaign}, ${posX}, ${posY}, ${moveTime.toISOString()})
        `
        eventCount++
      }
    }

    // Eventos de funil para ~60% das sessões
    if (Math.random() > 0.4) {
      const addTime = new Date(sessionStart.getTime() + 8 * 60 * 1000)
      await prisma.$executeRaw`
        INSERT INTO behavior_events (id, sessionId, userId, eventType, pageUrl, utmSource, utmMedium, utmCampaign, posX, posY, createdAt)
        VALUES (${cuid()}, ${sessionId}, ${userId}, 'add_to_cart', '/produto/camisa-brasil-2024-titular', ${utm.source}, ${utm.medium}, ${utm.campaign}, NULL, NULL, ${addTime.toISOString()})
      `
      eventCount++
    }

    // Checkout para ~30%
    if (Math.random() > 0.7) {
      const checkoutTime = new Date(sessionStart.getTime() + 12 * 60 * 1000)
      await prisma.$executeRaw`
        INSERT INTO behavior_events (id, sessionId, userId, eventType, pageUrl, utmSource, utmMedium, utmCampaign, posX, posY, createdAt)
        VALUES (${cuid()}, ${sessionId}, ${userId}, 'checkout_start', '/checkout', ${utm.source}, ${utm.medium}, ${utm.campaign}, NULL, NULL, ${checkoutTime.toISOString()})
      `
      eventCount++
    }
  }
  console.log(`   ✓ ${eventCount} eventos de analytics\n`)

  // ── 11. PROMOÇÕES ───────────────────────────────────────────────
  console.log('🎯 Criando promoções...')

  await prisma.promotion.createMany({
    data: [
      {
        name: 'Leve 3, Pague 2 — Retrô',
        type: 'buy_x_get_y',
        rulesJson: JSON.stringify({ buyQty: 3, payQty: 2, category: 'retro' }),
        startAt: daysAgo(5),
        endAt: new Date(Date.now() + 25 * 24 * 60 * 60 * 1000),
        isActive: true,
      },
      {
        name: '10% OFF Clubes Brasileiros',
        type: 'category_discount',
        rulesJson: JSON.stringify({ discount: 10, category: 'clubes-brasileiros' }),
        startAt: daysAgo(1),
        endAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
        isActive: true,
      },
      {
        name: 'Black Friday 30% — Encerrada',
        type: 'category_discount',
        rulesJson: JSON.stringify({ discount: 30, category: 'all' }),
        startAt: daysAgo(150),
        endAt: daysAgo(130),
        isActive: false,
      },
    ],
  })
  console.log('   ✓ 3 promoções\n')

  // ── 12. BANNERS ─────────────────────────────────────────────────
  console.log('🖼️ Criando banners...')

  await prisma.banner.createMany({
    data: [
      {
        title: 'Copa 2024 — Coleção Oficial',
        imageUrl: '/images/banners/copa-2024.jpg',
        linkUrl: '/loja?categoria=selecoes',
        startsAt: daysAgo(30),
        endsAt: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000),
        isActive: true,
        position: 1,
      },
      {
        title: 'Frete Grátis acima de R$500',
        imageUrl: '/images/banners/frete-gratis.jpg',
        linkUrl: '/loja',
        startsAt: daysAgo(10),
        endsAt: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
        isActive: true,
        position: 2,
      },
      {
        title: 'Coleção Retrô — Clássicos do Futebol',
        imageUrl: '/images/banners/retro.jpg',
        linkUrl: '/loja?categoria=retro',
        startsAt: daysAgo(5),
        endsAt: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000),
        isActive: false,
        position: 3,
      },
    ],
  })
  console.log('   ✓ 3 banners\n')

  // ── RESUMO FINAL ────────────────────────────────────────────────
  console.log('═'.repeat(60))
  console.log('🎭 SEED MOCADO CONCLUÍDO!')
  console.log('═'.repeat(60))
  console.log(`
📦 Produtos extras:  ${productData.length} (+ 6 do seed principal)
👥 Usuários:         ${users.length} clientes
   └─ Login:         carlos@mockgabinete.demo / Cliente@123
📍 Endereços:        ${addresses.length}
🛒 Pedidos:          ${createdOrders.length} (vários status)
⭐ Avaliações:       ${reviewsData.length} (7 aprovadas, 2 pendentes)
🎟️ Cupons:           ${coupons.length}
💎 Pontos:           ${loyaltyData.length} registros
📊 Estoque:          movimentos de entrada e saída
🔔 Alertas:          ${stockAlertsData.length}
📈 Analytics:        ${eventCount} eventos (${sessions.length} sessões)
🎯 Promoções:        3
🖼️ Banners:          3
  `)
  console.log('⚠️  LEMBRETE: Execute "npx tsx prisma/clear-mock.ts" antes de produção!')
  console.log('═'.repeat(60))
}

main()
  .catch(e => { console.error(e); process.exit(1) })
  .finally(() => prisma.$disconnect())
