import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

const PLACEHOLDER = '/images/products/placeholder-jersey.svg'
const SIZES = JSON.stringify(['P', 'M', 'G', 'GG', 'XG', '2XL', '3XL'])
const PRICE = 269.90
const COST = 80.00

// ─── 48 SELEÇÕES — COPA DO MUNDO 2026 (USA · MEX · CAN) ───
// 4 destaques: Brasil, Argentina, França, Portugal (isFeatured=true)
type Seleção = {
  team: string
  slug: string
  description: string
  badge?: string
  featured?: boolean
  supplierCode: string
  confederation: 'CONCACAF' | 'CONMEBOL' | 'CAF' | 'AFC' | 'OFC' | 'UEFA' | 'INTERCONTINENTAL'
}

const SELECOES: Seleção[] = [
  // ─── PAÍSES-SEDE (CONCACAF) ───
  { team: 'Estados Unidos', slug: 'camisa-estados-unidos-2026', description: 'Camisa I dos EUA, país-sede da Copa 2026. Listras icônicas em branco e azul.', supplierCode: 'JIN-USA-26-T', confederation: 'CONCACAF', badge: 'País-sede' },
  { team: 'México', slug: 'camisa-mexico-2026', description: 'Camisa I do México, país-sede da Copa 2026. Verde tradicional do Tri.', supplierCode: 'JIN-MEX-26-T', confederation: 'CONCACAF', badge: 'País-sede' },
  { team: 'Canadá', slug: 'camisa-canada-2026', description: 'Camisa I do Canadá, país-sede da Copa 2026. Vermelho vivo com folha de bordo.', supplierCode: 'JIN-CAN-26-T', confederation: 'CONCACAF', badge: 'País-sede' },

  // ─── AMÉRICA DO SUL (CONMEBOL) ───
  { team: 'Brasil', slug: 'camisa-brasil-2026', description: 'A icônica camisa amarela e azul da Seleção Brasileira para a Copa 2026. Tecido premium, idêntica à dos jogadores.', supplierCode: 'JIN-BRA-26-T', confederation: 'CONMEBOL', badge: 'Destaque', featured: true },
  { team: 'Argentina', slug: 'camisa-argentina-2026', description: 'A albiceleste da campeã do mundo. Listras azul e branca tradicionais para a Copa 2026.', supplierCode: 'JIN-ARG-26-T', confederation: 'CONMEBOL', badge: 'Destaque', featured: true },
  { team: 'Uruguai', slug: 'camisa-uruguai-2026', description: 'A celeste do Uruguai. Camisa I para a Copa 2026.', supplierCode: 'JIN-URU-26-T', confederation: 'CONMEBOL' },
  { team: 'Colômbia', slug: 'camisa-colombia-2026', description: 'A amarela da Colômbia. Cafeteros para a Copa 2026.', supplierCode: 'JIN-COL-26-T', confederation: 'CONMEBOL' },
  { team: 'Equador', slug: 'camisa-equador-2026', description: 'A tricolor do Equador. La Tri para a Copa 2026.', supplierCode: 'JIN-EQU-26-T', confederation: 'CONMEBOL' },
  { team: 'Paraguai', slug: 'camisa-paraguai-2026', description: 'Listras vermelha e branca da Albirroja. Camisa I para a Copa 2026.', supplierCode: 'JIN-PAR-26-T', confederation: 'CONMEBOL' },

  // ─── CONCACAF (demais) ───
  { team: 'Panamá', slug: 'camisa-panama-2026', description: 'Vermelho e azul do Panamá. Camisa I para a Copa 2026.', supplierCode: 'JIN-PAN-26-T', confederation: 'CONCACAF' },
  { team: 'Haiti', slug: 'camisa-haiti-2026', description: 'Azul tradicional do Haiti. Camisa I para a Copa 2026.', supplierCode: 'JIN-HAI-26-T', confederation: 'CONCACAF' },
  { team: 'Curaçao', slug: 'camisa-curacao-2026', description: 'Azul e amarelo da seleção caribenha. Camisa I para a Copa 2026.', supplierCode: 'JIN-CUR-26-T', confederation: 'CONCACAF' },

  // ─── ÁFRICA (CAF) ───
  { team: 'Marrocos', slug: 'camisa-marrocos-2026', description: 'Vermelho dos Leões do Atlas. Camisa I para a Copa 2026.', supplierCode: 'JIN-MAR-26-T', confederation: 'CAF' },
  { team: 'Senegal', slug: 'camisa-senegal-2026', description: 'Verde dos Leões da Teranga. Camisa I para a Copa 2026.', supplierCode: 'JIN-SEN-26-T', confederation: 'CAF' },
  { team: 'Egito', slug: 'camisa-egito-2026', description: 'Vermelho dos Faraós. Camisa I para a Copa 2026.', supplierCode: 'JIN-EGY-26-T', confederation: 'CAF' },
  { team: 'Argélia', slug: 'camisa-argelia-2026', description: 'Verde e branco das Raposas do Deserto. Camisa I para a Copa 2026.', supplierCode: 'JIN-ALG-26-T', confederation: 'CAF' },
  { team: 'Tunísia', slug: 'camisa-tunisia-2026', description: 'Vermelho das Águias de Cartago. Camisa I para a Copa 2026.', supplierCode: 'JIN-TUN-26-T', confederation: 'CAF' },
  { team: 'Costa do Marfim', slug: 'camisa-costa-do-marfim-2026', description: 'Laranja dos Elefantes. Camisa I para a Copa 2026.', supplierCode: 'JIN-CIV-26-T', confederation: 'CAF' },
  { team: 'Gana', slug: 'camisa-gana-2026', description: 'Branco e amarelo das Estrelas Negras. Camisa I para a Copa 2026.', supplierCode: 'JIN-GHA-26-T', confederation: 'CAF' },
  { team: 'Cabo Verde', slug: 'camisa-cabo-verde-2026', description: 'Azul e branco dos Tubarões Azuis. Camisa I para a Copa 2026.', supplierCode: 'JIN-CPV-26-T', confederation: 'CAF' },
  { team: 'África do Sul', slug: 'camisa-africa-do-sul-2026', description: 'Amarelo dos Bafana Bafana. Camisa I para a Copa 2026.', supplierCode: 'JIN-RSA-26-T', confederation: 'CAF' },

  // ─── ÁSIA (AFC) ───
  { team: 'Japão', slug: 'camisa-japao-2026', description: 'Azul dos Samurais Azuis. Camisa I para a Copa 2026.', supplierCode: 'JIN-JPN-26-T', confederation: 'AFC' },
  { team: 'Coreia do Sul', slug: 'camisa-coreia-do-sul-2026', description: 'Vermelho dos Tigres da Ásia. Camisa I para a Copa 2026.', supplierCode: 'JIN-KOR-26-T', confederation: 'AFC' },
  { team: 'Irã', slug: 'camisa-ira-2026', description: 'Branco do Time Melli. Camisa I para a Copa 2026.', supplierCode: 'JIN-IRN-26-T', confederation: 'AFC' },
  { team: 'Arábia Saudita', slug: 'camisa-arabia-saudita-2026', description: 'Verde dos Falcões. Camisa I para a Copa 2026.', supplierCode: 'JIN-KSA-26-T', confederation: 'AFC' },
  { team: 'Austrália', slug: 'camisa-australia-2026', description: 'Amarelo dos Socceroos. Camisa I para a Copa 2026.', supplierCode: 'JIN-AUS-26-T', confederation: 'AFC' },
  { team: 'Jordânia', slug: 'camisa-jordania-2026', description: 'Branco dos Cavaleiros. Camisa I para a Copa 2026.', supplierCode: 'JIN-JOR-26-T', confederation: 'AFC' },
  { team: 'Uzbequistão', slug: 'camisa-uzbequistao-2026', description: 'Branco dos Lobos Brancos. Camisa I para a Copa 2026.', supplierCode: 'JIN-UZB-26-T', confederation: 'AFC' },
  { team: 'Catar', slug: 'camisa-catar-2026', description: 'Vinho dos Marrons. Camisa I para a Copa 2026.', supplierCode: 'JIN-QAT-26-T', confederation: 'AFC' },

  // ─── OCEANIA (OFC) ───
  { team: 'Nova Zelândia', slug: 'camisa-nova-zelandia-2026', description: 'Branco dos All Whites. Camisa I para a Copa 2026.', supplierCode: 'JIN-NZL-26-T', confederation: 'OFC' },

  // ─── EUROPA (UEFA) ───
  { team: 'Inglaterra', slug: 'camisa-inglaterra-2026', description: 'Branco dos Three Lions. Camisa I da Inglaterra para a Copa 2026.', supplierCode: 'JIN-ENG-26-T', confederation: 'UEFA' },
  { team: 'França', slug: 'camisa-franca-2026', description: 'A icônica camisa azul (com detalhes brancos) dos Bleus para a Copa 2026.', supplierCode: 'JIN-FRA-26-T', confederation: 'UEFA', badge: 'Destaque', featured: true },
  { team: 'Espanha', slug: 'camisa-espanha-2026', description: 'Vermelho de La Roja. Camisa I para a Copa 2026.', supplierCode: 'JIN-ESP-26-T', confederation: 'UEFA' },
  { team: 'Portugal', slug: 'camisa-portugal-2026', description: 'A icônica camisa vermelha da Seleção das Quinas para a Copa 2026.', supplierCode: 'JIN-POR-26-T', confederation: 'UEFA', badge: 'Destaque', featured: true },
  { team: 'Alemanha', slug: 'camisa-alemanha-2026', description: 'Branco da Nationalmannschaft. Camisa I para a Copa 2026.', supplierCode: 'JIN-GER-26-T', confederation: 'UEFA' },
  { team: 'Holanda', slug: 'camisa-holanda-2026', description: 'Laranja da Oranje. Camisa I da Holanda para a Copa 2026.', supplierCode: 'JIN-NED-26-T', confederation: 'UEFA' },
  { team: 'Bélgica', slug: 'camisa-belgica-2026', description: 'Vinho dos Diabos Vermelhos. Camisa I para a Copa 2026.', supplierCode: 'JIN-BEL-26-T', confederation: 'UEFA' },
  { team: 'Croácia', slug: 'camisa-croacia-2026', description: 'O xadrez vermelho e branco. Camisa I da Croácia para a Copa 2026.', supplierCode: 'JIN-CRO-26-T', confederation: 'UEFA' },
  { team: 'Noruega', slug: 'camisa-noruega-2026', description: 'Vermelho dos Vikings. Camisa I para a Copa 2026.', supplierCode: 'JIN-NOR-26-T', confederation: 'UEFA' },
  { team: 'Suíça', slug: 'camisa-suica-2026', description: 'Vermelho da Nati. Camisa I para a Copa 2026.', supplierCode: 'JIN-SUI-26-T', confederation: 'UEFA' },
  { team: 'Áustria', slug: 'camisa-austria-2026', description: 'Vermelho dos austríacos. Camisa I para a Copa 2026.', supplierCode: 'JIN-AUT-26-T', confederation: 'UEFA' },
  { team: 'Escócia', slug: 'camisa-escocia-2026', description: 'Azul da Tartan Army. Camisa I para a Copa 2026.', supplierCode: 'JIN-SCO-26-T', confederation: 'UEFA' },
  { team: 'Turquia', slug: 'camisa-turquia-2026', description: 'Vermelho dos Crescentes. Camisa I para a Copa 2026.', supplierCode: 'JIN-TUR-26-T', confederation: 'UEFA' },
  { team: 'Suécia', slug: 'camisa-suecia-2026', description: 'Amarelo e azul dos Blågult. Camisa I para a Copa 2026.', supplierCode: 'JIN-SWE-26-T', confederation: 'UEFA' },
  { team: 'República Tcheca', slug: 'camisa-republica-tcheca-2026', description: 'Vermelho dos Lvi. Camisa I para a Copa 2026.', supplierCode: 'JIN-CZE-26-T', confederation: 'UEFA' },
  { team: 'Bósnia e Herzegovina', slug: 'camisa-bosnia-2026', description: 'Azul dos Zmajevi. Camisa I para a Copa 2026.', supplierCode: 'JIN-BIH-26-T', confederation: 'UEFA' },

  // ─── REPESCAGEM INTERCONTINENTAL ───
  { team: 'RD Congo', slug: 'camisa-rd-congo-2026', description: 'Azul dos Leopardos. Camisa I para a Copa 2026.', supplierCode: 'JIN-COD-26-T', confederation: 'INTERCONTINENTAL' },
  { team: 'Iraque', slug: 'camisa-iraque-2026', description: 'Verde dos Leões da Mesopotâmia. Camisa I para a Copa 2026.', supplierCode: 'JIN-IRQ-26-T', confederation: 'INTERCONTINENTAL' },
]

async function main() {
  console.log('🌱 Iniciando seed Gabinete FC — Copa 2026...')

  // ─── Admin ───
  const hashedPassword = await bcrypt.hash('Admin@123', 12)
  await prisma.user.upsert({
    where: { email: 'admin@gabinetefc.com.br' },
    update: { password: hashedPassword },
    create: {
      email: 'admin@gabinetefc.com.br',
      name: 'Admin Gabinete FC',
      role: 'admin',
      password: hashedPassword,
    },
  })

  // ─── Store settings ───
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

  // ─── Cupom PRIMEIRA5 — 5% off na primeira compra ───
  await prisma.coupon.upsert({
    where: { code: 'PRIMEIRA5' },
    update: {
      type: 'percent',
      value: 5,
      firstOrderOnly: true,
      isActive: true,
      minOrderValue: 0,
    },
    create: {
      code: 'PRIMEIRA5',
      type: 'percent',
      value: 5,
      firstOrderOnly: true,
      isActive: true,
      minOrderValue: 0,
    },
  })

  // ─── 48 seleções Copa 2026 ───
  for (const s of SELECOES) {
    await prisma.product.upsert({
      where: { slug: s.slug },
      update: {
        name: `Camisa ${s.team} I 2026`,
        description: s.description,
        price: PRICE,
        costPrice: COST,
        category: 'selecoes',
        team: s.team,
        type: 'titular',
        badge: s.badge,
        sizesAvailable: SIZES,
        isActive: true,
        isFeatured: !!s.featured,
      },
      create: {
        name: `Camisa ${s.team} I 2026`,
        slug: s.slug,
        description: s.description,
        price: PRICE,
        costPrice: COST,
        supplierCode: s.supplierCode,
        category: 'selecoes',
        team: s.team,
        type: 'titular',
        badge: s.badge,
        sizesAvailable: SIZES,
        images: JSON.stringify([PLACEHOLDER]),
        isActive: true,
        isFeatured: !!s.featured,
        metaTitle: `Camisa ${s.team} 2026 | Gabinete FC`,
      },
    })
  }

  console.log(`✅ Seed concluído! ${SELECOES.length} seleções da Copa 2026 cadastradas.`)
  console.log('   Destaques: Brasil · Argentina · França · Portugal')
  console.log('   Cupom criado: PRIMEIRA5 (5% off na 1ª compra)')
}

main()
  .catch((e) => {
    console.error('❌ Erro no seed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
