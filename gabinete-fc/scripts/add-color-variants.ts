/**
 * Cria 3 novos produtos (jogador + torcedor) clonando estrutura dos existentes:
 * - camisa-espanha-branca-2026 (variante II — branca)
 * - camisa-espanha-azul-2026 (variante III — azul alternativa)
 * - camisa-portugal-especial-2026 (edição especial branca)
 *
 * Uso:
 *   npx dotenv-cli -e .env.local -- npx ts-node --transpile-only --project scripts/tsconfig.json scripts/add-color-variants.ts
 */
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

interface VariantSpec {
  baseSlug: string
  newSlug: string
  team: string
  nameSuffix: string
  description: string
  type: 'titular' | 'reserva' | 'terceiro' | 'goleiro'
  supplierCode: string
}

const VARIANTS: VariantSpec[] = [
  {
    baseSlug: 'camisa-espanha-2026',
    newSlug: 'camisa-espanha-branca-2026',
    team: 'Espanha',
    nameSuffix: 'Camisa Espanha II 2026 (Branca)',
    description: 'Camisa II reserva da Espanha — branca com detalhes vermelhos e dourados. La Roja para a Copa 2026.',
    type: 'reserva',
    supplierCode: 'JIN-ESP-26-R',
  },
  {
    baseSlug: 'camisa-espanha-2026',
    newSlug: 'camisa-espanha-azul-2026',
    team: 'Espanha',
    nameSuffix: 'Camisa Espanha III 2026 (Azul)',
    description: 'Camisa alternativa da Espanha — azul royal com detalhes vermelhos. La Roja para a Copa 2026.',
    type: 'terceiro',
    supplierCode: 'JIN-ESP-26-3',
  },
  {
    baseSlug: 'camisa-portugal-2026',
    newSlug: 'camisa-portugal-especial-2026',
    team: 'Portugal',
    nameSuffix: 'Camisa Portugal Edição Especial 2026 (Branca)',
    description: 'Camisa Edição Especial de Portugal — branca com bordados em ouro. Lançamento limitado para a Copa 2026.',
    type: 'titular',
    supplierCode: 'JIN-POR-26-ES',
  },
]

async function main() {
  for (const v of VARIANTS) {
    console.log(`\n━━━ ${v.newSlug} ━━━`)
    const baseJ = await prisma.product.findUnique({ where: { slug: v.baseSlug } })
    const baseT = await prisma.product.findUnique({ where: { slug: `${v.baseSlug}-torcedor` } })
    if (!baseJ || !baseT) {
      console.error(`  ❌ Base não encontrado: ${v.baseSlug}`)
      continue
    }

    const placeholder = JSON.stringify(['/images/products/placeholder-jersey.svg'])

    // Jogador
    await prisma.product.upsert({
      where: { slug: v.newSlug },
      update: {
        name: `${v.nameSuffix} · Jogador`,
        team: v.team,
        description: v.description,
        type: v.type,
        version: 'jogador',
        price: baseJ.price,
        costPrice: baseJ.costPrice,
        category: baseJ.category,
        supplierCode: v.supplierCode,
        supplierName: baseJ.supplierName,
        sizesAvailable: baseJ.sizesAvailable,
        isActive: true,
      },
      create: {
        slug: v.newSlug,
        name: `${v.nameSuffix} · Jogador`,
        team: v.team,
        description: v.description,
        type: v.type,
        version: 'jogador',
        price: baseJ.price,
        costPrice: baseJ.costPrice,
        category: baseJ.category,
        supplierCode: v.supplierCode,
        supplierName: baseJ.supplierName,
        sizesAvailable: baseJ.sizesAvailable,
        images: placeholder,
        isActive: true,
      },
    })

    // Torcedor
    const torcedorSlug = `${v.newSlug}-torcedor`
    await prisma.product.upsert({
      where: { slug: torcedorSlug },
      update: {
        name: `${v.nameSuffix} · Torcedor`,
        team: v.team,
        description: v.description,
        type: v.type,
        version: 'torcedor',
        price: baseT.price,
        costPrice: baseT.costPrice,
        category: baseT.category,
        supplierCode: `${v.supplierCode}-T`,
        supplierName: baseT.supplierName,
        sizesAvailable: baseT.sizesAvailable,
        isActive: true,
      },
      create: {
        slug: torcedorSlug,
        name: `${v.nameSuffix} · Torcedor`,
        team: v.team,
        description: v.description,
        type: v.type,
        version: 'torcedor',
        price: baseT.price,
        costPrice: baseT.costPrice,
        category: baseT.category,
        supplierCode: `${v.supplierCode}-T`,
        supplierName: baseT.supplierName,
        sizesAvailable: baseT.sizesAvailable,
        images: placeholder,
        isActive: true,
      },
    })

    console.log(`  ✓ ${v.newSlug} (jogador + torcedor)`)
  }
  console.log('\n✅ Pronto!')
}

main()
  .catch((e) => { console.error(e); process.exit(1) })
  .finally(() => prisma.$disconnect())
