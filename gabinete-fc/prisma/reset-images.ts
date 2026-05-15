/**
 * Reseta as imagens dos produtos em destaque (isFeatured=true) para placeholder.
 * Uso: npx ts-node --skip-project --transpile-only --compiler-options "{\"module\":\"commonjs\"}" prisma/reset-images.ts
 */
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()
const PLACEHOLDER = '/images/products/placeholder-jersey.svg'

async function main() {
  const featured = await prisma.product.findMany({
    where: { isFeatured: true },
    select: { id: true, slug: true, name: true },
  })

  console.log(`Encontrados ${featured.length} produtos em destaque:`)
  for (const p of featured) {
    console.log(`  - ${p.slug}  (${p.name})`)
  }

  const result = await prisma.product.updateMany({
    where: { isFeatured: true },
    data: { images: JSON.stringify([PLACEHOLDER]) },
  })

  console.log(`\n${result.count} produto(s) atualizado(s) com placeholder.`)
}

main()
  .catch((e) => { console.error(e); process.exit(1) })
  .finally(() => prisma.$disconnect())
