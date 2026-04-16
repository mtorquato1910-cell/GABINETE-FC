import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'

export async function POST(req: NextRequest) {
  const session = await auth()
  const user = session?.user as { role?: string; id?: string } | undefined
  if (user?.role !== 'admin') return NextResponse.json({ error: 'Acesso negado' }, { status: 403 })

  const body = await req.json()
  const { productId, size, type, quantity, reason } = body

  if (!productId || !size || !type || !quantity || !reason) {
    return NextResponse.json({ error: 'Campos obrigatórios' }, { status: 400 })
  }

  await prisma.stockMovement.create({
    data: { productId, size, type, quantity: parseInt(quantity), reason, adminUserId: user.id },
  })

  return NextResponse.json({ success: true })
}
