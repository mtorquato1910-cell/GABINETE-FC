import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'

// Painel admin desativado — middleware bloqueia globalmente quando ADMIN_ENABLED!=true.
// Defesa em profundidade: validação dupla aqui caso middleware falhe.
const ADMIN_ENABLED = process.env.ADMIN_ENABLED === 'true'

const stockSchema = z.object({
  productId: z.string().min(1),
  size: z.string().min(1).max(10),
  type: z.enum(['in', 'out']),
  quantity: z.coerce.number().int().positive().max(10000),
  reason: z.string().min(1).max(255),
})

export async function POST(req: NextRequest) {
  if (!ADMIN_ENABLED) {
    return new NextResponse('Not Found', { status: 404 })
  }

  const session = await auth()
  const user = session?.user as { role?: string; id?: string } | undefined
  if (user?.role !== 'admin') {
    return NextResponse.json({ error: 'Acesso negado' }, { status: 403 })
  }

  const body = await req.json().catch(() => null)
  const parsed = stockSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Dados inválidos', details: parsed.error.flatten().fieldErrors },
      { status: 400 }
    )
  }

  // Verifica produto existe
  const product = await prisma.product.findUnique({
    where: { id: parsed.data.productId },
    select: { id: true },
  })
  if (!product) {
    return NextResponse.json({ error: 'Produto não encontrado' }, { status: 404 })
  }

  await prisma.stockMovement.create({
    data: {
      productId: parsed.data.productId,
      size: parsed.data.size,
      type: parsed.data.type,
      quantity: parsed.data.quantity,
      reason: parsed.data.reason,
      adminUserId: user.id,
    },
  })

  return NextResponse.json({ success: true })
}
