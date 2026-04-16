import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Iniciando seed...')

  // Admin user (senha: Admin@123 — TROCAR em produção!)
  await prisma.user.upsert({
    where: { email: 'admin@gabinetefc.com.br' },
    update: {},
    create: {
      email: 'admin@gabinetefc.com.br',
      name: 'Admin Gabinete FC',
      role: 'admin',
      // TODO Sprint 4: usar bcrypt.hash()
      password: 'Admin@123',
    },
  })

  // Store settings padrão
  const settings = [
    { key: 'store_name', value: 'Gabinete FC', category: 'general' },
    { key: 'store_email', value: 'contato@gabinetefc.com.br', category: 'general' },
    { key: 'whatsapp', value: '5511999999999', category: 'general' },
    { key: 'pix_discount_percent', value: '5', category: 'payments' },
    { key: 'pix_expiry_minutes', value: '60', category: 'payments' },
    { key: 'stripe_3ds_threshold', value: '500', category: 'payments' },
    { key: 'stripe_3ds_mode', value: 'automatic', category: 'payments' },
    { key: 'meta_pixel_id', value: '', category: 'meta' },
    { key: 'meta_bm_id', value: '', category: 'meta' },
    { key: 'meta_access_token', value: '', category: 'meta' },
    { key: 'vapid_public_key', value: '', category: 'push' },
    { key: 'freight_origin_cep', value: '01310100', category: 'operations' },
    { key: 'free_shipping_threshold', value: '500', category: 'operations' },
    { key: 'loyalty_points_per_real', value: '1', category: 'loyalty' },
    { key: 'loyalty_points_expiry_days', value: '365', category: 'loyalty' },
  ]

  for (const setting of settings) {
    await prisma.storeSetting.upsert({
      where: { key: setting.key },
      update: {},
      create: setting,
    })
  }

  // Produtos de exemplo
  const products = [
    {
      name: 'Camisa Brasil I 2024',
      slug: 'camisa-brasil-2024-titular',
      description: 'Camisa oficial da Seleção Brasileira. Tecido premium, idêntica à dos jogadores.',
      price: 249.90,
      costPrice: 75.00,
      supplierCode: 'JIN-BRA-24-T',
      category: 'selecoes',
      team: 'Brasil',
      type: 'titular',
      badge: 'Lançamento',
      sizesAvailable: JSON.stringify(['P', 'M', 'G', 'GG', 'XG', '2XL']),
      images: JSON.stringify(['/images/products/placeholder-jersey.svg']),
      isActive: true,
      isFeatured: true,
      metaTitle: 'Camisa Brasil Titular 2024 | Gabinete FC',
    },
    {
      name: 'Camisa Argentina I 2024',
      slug: 'camisa-argentina-2024-titular',
      description: 'A albiceleste da Campeã do Mundo. Listras azul e branca icônicas.',
      price: 249.90,
      costPrice: 75.00,
      supplierCode: 'JIN-ARG-24-T',
      category: 'selecoes',
      team: 'Argentina',
      type: 'titular',
      badge: 'Esgotando',
      sizesAvailable: JSON.stringify(['P', 'M', 'G', 'GG', 'XG']),
      images: JSON.stringify(['/images/products/placeholder-jersey.svg']),
      isActive: true,
      isFeatured: true,
    },
    {
      name: 'Camisa Real Madrid I 2024/25',
      slug: 'camisa-real-madrid-2024-titular',
      description: 'A camisa dos Galácticos. Branco clássico com detalhes em dourado.',
      price: 229.90,
      costPrice: 68.00,
      supplierCode: 'JIN-RMA-24-T',
      category: 'clubes-europeus',
      team: 'Real Madrid',
      type: 'titular',
      badge: 'Exclusivo',
      sizesAvailable: JSON.stringify(['P', 'M', 'G', 'GG', 'XG', '2XL', '3XL']),
      images: JSON.stringify(['/images/products/placeholder-jersey.svg']),
      isActive: true,
      isFeatured: true,
    },
    {
      name: 'Camisa Barcelona I 2024/25',
      slug: 'camisa-barcelona-2024-titular',
      description: 'As listras azul e grená do Barça. Qualidade premium.',
      price: 229.90,
      costPrice: 68.00,
      supplierCode: 'JIN-BAR-24-T',
      category: 'clubes-europeus',
      team: 'Barcelona',
      type: 'titular',
      sizesAvailable: JSON.stringify(['P', 'M', 'G', 'GG', 'XG']),
      images: JSON.stringify(['/images/products/placeholder-jersey.svg']),
      isActive: true,
      isFeatured: false,
    },
    {
      name: 'Camisa Flamengo I 2024',
      slug: 'camisa-flamengo-2024-titular',
      description: 'O manto sagrado do Mengão. Rubro-negro raça e amor.',
      price: 199.90,
      costPrice: 60.00,
      supplierCode: 'JIN-FLA-24-T',
      category: 'clubes-brasileiros',
      team: 'Flamengo',
      type: 'titular',
      sizesAvailable: JSON.stringify(['P', 'M', 'G', 'GG', 'XG', '2XL']),
      images: JSON.stringify(['/images/products/placeholder-jersey.svg']),
      isActive: true,
      isFeatured: true,
    },
    {
      name: 'Camisa Brasil Retrô 1970',
      slug: 'camisa-brasil-retro-1970',
      description: 'A camisa da Copa de 1970. Pelé eterno. Reprodução fiel.',
      price: 219.90,
      costPrice: 65.00,
      supplierCode: 'JIN-BRA-70-R',
      category: 'retro',
      team: 'Brasil',
      type: 'titular',
      badge: 'Colecionador',
      sizesAvailable: JSON.stringify(['P', 'M', 'G', 'GG']),
      images: JSON.stringify(['/images/products/placeholder-jersey.svg']),
      isActive: true,
      isFeatured: true,
    },
  ]

  for (const product of products) {
    await prisma.product.upsert({
      where: { slug: product.slug },
      update: {},
      create: product,
    })
  }

  console.log('✅ Seed concluído! Admin e produtos criados.')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
