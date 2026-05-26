/**
 * Atualiza preços de TODAS as camisas:
 *  - version = "jogador"  → R$ 237,90
 *  - version = "torcedor" → R$ 199,90
 *
 * Modos:
 *   DRY RUN (padrão — só mostra o que mudaria, não escreve no banco):
 *     npx dotenv-cli -e .env.local -- npx ts-node --transpile-only --project scripts/tsconfig.json scripts/update-jersey-prices.ts
 *
 *   APPLY (escreve no banco de verdade):
 *     npx dotenv-cli -e .env.local -- npx ts-node --transpile-only --project scripts/tsconfig.json scripts/update-jersey-prices.ts --apply
 */
import { PrismaClient } from '@prisma/client'

const PRICE_JOGADOR = 237.9
const PRICE_TORCEDOR = 199.9

async function main() {
  const apply = process.argv.includes('--apply')
  const prisma = new PrismaClient()

  console.log(`\n${apply ? '🚀 APPLY MODE — vai escrever no banco' : '🔍 DRY RUN — nada será alterado'}\n`)

  const products = await prisma.product.findMany({
    select: { id: true, slug: true, name: true, version: true, price: true, isActive: true },
    orderBy: [{ version: 'asc' }, { name: 'asc' }],
  })

  const jogadores = products.filter((p) => p.version === 'jogador')
  const torcedores = products.filter((p) => p.version === 'torcedor')
  const outros = products.filter((p) => p.version !== 'jogador' && p.version !== 'torcedor')

  console.log(`Total no banco: ${products.length}`)
  console.log(`  ├─ jogador:  ${jogadores.length}`)
  console.log(`  ├─ torcedor: ${torcedores.length}`)
  console.log(`  └─ outros:   ${outros.length} (NÃO serão alterados)\n`)

  const changes: { id: string; slug: string; from: number; to: number; version: string }[] = []

  for (const p of jogadores) {
    if (p.price !== PRICE_JOGADOR) {
      changes.push({ id: p.id, slug: p.slug, from: p.price, to: PRICE_JOGADOR, version: p.version })
    }
  }
  for (const p of torcedores) {
    if (p.price !== PRICE_TORCEDOR) {
      changes.push({ id: p.id, slug: p.slug, from: p.price, to: PRICE_TORCEDOR, version: p.version })
    }
  }

  console.log(`📋 ${changes.length} produto(s) precisam de update:\n`)
  console.log('  versão     | de         → para        | slug')
  console.log('  -----------+----------- ' + '-'.repeat(13) + '+' + '-'.repeat(40))
  for (const c of changes) {
    const fromStr = `R$ ${c.from.toFixed(2).padStart(7, ' ')}`
    const toStr = `R$ ${c.to.toFixed(2).padStart(7, ' ')}`
    console.log(`  ${c.version.padEnd(10)} | ${fromStr} → ${toStr}   | ${c.slug}`)
  }

  if (outros.length > 0) {
    console.log(`\n⚠️  Produtos com version "outro" (não alterados):`)
    for (const p of outros) {
      console.log(`   - ${p.slug} (version="${p.version}", preço atual R$ ${p.price.toFixed(2)})`)
    }
  }

  if (!apply) {
    console.log(`\n✅ DRY RUN concluído. Rode com --apply pra aplicar.`)
    await prisma.$disconnect()
    return
  }

  if (changes.length === 0) {
    console.log(`\n✅ Nada a fazer — todos os preços já estão corretos.`)
    await prisma.$disconnect()
    return
  }

  console.log(`\n⚡ Aplicando ${changes.length} updates...`)

  const jogadorRes = await prisma.product.updateMany({
    where: { version: 'jogador', price: { not: PRICE_JOGADOR } },
    data: { price: PRICE_JOGADOR },
  })
  const torcedorRes = await prisma.product.updateMany({
    where: { version: 'torcedor', price: { not: PRICE_TORCEDOR } },
    data: { price: PRICE_TORCEDOR },
  })

  console.log(`\n✅ Updates concluídos:`)
  console.log(`   jogador:  ${jogadorRes.count} linha(s)`)
  console.log(`   torcedor: ${torcedorRes.count} linha(s)`)

  await prisma.$disconnect()
}

main().catch((err) => {
  console.error('\n❌ Erro:', err)
  process.exit(1)
})
