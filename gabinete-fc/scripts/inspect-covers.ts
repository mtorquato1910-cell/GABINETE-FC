import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  const slugs = [
    'camisa-mexico-2026', 'camisa-mexico-2026-torcedor',
    'camisa-uruguai-2026', 'camisa-uruguai-2026-torcedor',
    'camisa-brasil-2026',
    'camisa-cabo-verde-2026',
    'camisa-estados-unidos-2026', 'camisa-estados-unidos-2026-torcedor',
  ]
  for (const slug of slugs) {
    const prod = await prisma.product.findUnique({ where: { slug } })
    if (!prod) { console.log(`${slug} → NOT FOUND`); continue }
    let imgs: string[] = []
    try { imgs = JSON.parse(prod.images) } catch {}
    console.log(`${slug} → first 2 images:`)
    for (const img of imgs.slice(0, 2)) console.log(`   ${img}`)
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
