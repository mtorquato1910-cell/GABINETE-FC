'use server'
import { z } from 'zod'
import { revalidatePath } from 'next/cache'
import { requireAuth, requireAdmin } from '@/lib/auth'
import { prisma } from '@/lib/db'

const reviewSchema = z.object({
  productId: z.string(),
  orderId: z.string().optional(),
  rating: z.number().int().min(1).max(5),
  title: z.string().optional(),
  body: z.string().optional(),
})

export async function createReview(data: unknown) {
  const session = await requireAuth()
  const userId = (session.user as { id: string }).id
  const parsed = reviewSchema.safeParse(data)
  if (!parsed.success) return { error: parsed.error.flatten().fieldErrors }

  // Verifica se já avaliou
  const existing = await prisma.review.findFirst({
    where: { userId, productId: parsed.data.productId },
  })
  if (existing) return { error: { _: ['Você já avaliou este produto'] } }

  await prisma.review.create({
    data: { userId, ...parsed.data, status: 'pending' },
  })

  revalidatePath(`/produto/${parsed.data.productId}`)
  return { success: true }
}

export async function approveReview(reviewId: string) {
  await requireAdmin()
  const review = await prisma.review.update({
    where: { id: reviewId },
    data: { status: 'approved', updatedAt: new Date() },
    include: { user: true },
  })

  // Gera cupom automático para o reviewer (5% desconto)
  const couponCode = `REVIEW-${review.userId.slice(-6).toUpperCase()}`
  const existing = await prisma.coupon.findFirst({ where: { code: couponCode } })
  if (!existing) {
    const coupon = await prisma.coupon.create({
      data: {
        code: couponCode,
        type: 'percent',
        value: 5,
        maxUses: 1,
        userRestriction: review.userId,
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 dias
      },
    })
    await prisma.review.update({
      where: { id: reviewId },
      data: { couponGeneratedId: coupon.id },
    })
  }

  revalidatePath('/admin/avaliacoes')
  return { success: true }
}

export async function rejectReview(reviewId: string) {
  await requireAdmin()
  await prisma.review.update({ where: { id: reviewId }, data: { status: 'rejected' } })
  revalidatePath('/admin/avaliacoes')
  return { success: true }
}

export async function getProductReviews(productId: string) {
  return prisma.review.findMany({
    where: { productId, status: 'approved' },
    orderBy: { createdAt: 'desc' },
    include: { user: { select: { name: true } } },
    take: 20,
  })
}
