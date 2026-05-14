import { config } from 'dotenv'
import * as path from 'node:path'
import { PrismaClient } from '@prisma/client'

config({ path: path.resolve(__dirname, '..', '.env.local') })

const prisma = new PrismaClient()

async function main() {
  const result = await prisma.product.updateMany({
    where: { slug: 'camisa-brasil-2026' },
    data: {
      images: JSON.stringify(['/images/products/copa2026/camisa-brasil-2026.webp']),
    },
  })
  console.log(`✓ ${result.count} produto atualizado`)
  await prisma.$disconnect()
}

main()
