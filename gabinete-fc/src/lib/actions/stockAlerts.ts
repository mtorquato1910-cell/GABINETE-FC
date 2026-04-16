'use server'
import { z } from 'zod'
import { prisma } from '@/lib/db'

const alertSchema = z.object({
  productId: z.string(),
  size: z.string(),
  email: z.string().email(),
})

export async function createStockAlert(data: unknown) {
  const parsed = alertSchema.safeParse(data)
  if (!parsed.success) return { error: parsed.error.flatten().fieldErrors }

  // Verifica se alerta já existe
  const existing = await prisma.stockAlert.findFirst({
    where: { productId: parsed.data.productId, size: parsed.data.size, email: parsed.data.email },
  })
  if (existing) return { error: { _: ['Você já tem um alerta para este produto/tamanho'] } }

  await prisma.stockAlert.create({ data: parsed.data })
  return { success: true }
}
