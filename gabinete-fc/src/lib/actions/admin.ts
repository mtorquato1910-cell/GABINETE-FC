'use server'
import { z } from 'zod'
import { revalidatePath } from 'next/cache'
import { requireAdmin } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { stringifyJsonField } from '@/lib/db-helpers'

const productSchema = z.object({
  name: z.string().min(2),
  slug: z.string().min(2).regex(/^[a-z0-9-]+$/, 'Slug: só letras minúsculas, números e hífens'),
  description: z.string().optional(),
  price: z.number().positive(),
  costPrice: z.number().positive().optional(),
  supplierCode: z.string().optional(),
  category: z.string().min(1),
  team: z.string().min(1),
  type: z.string().default('titular'),
  badge: z.string().optional(),
  sizesAvailable: z.array(z.string()),
  images: z.array(z.string()),
  isActive: z.boolean().default(false),
  isFeatured: z.boolean().default(false),
  metaTitle: z.string().optional(),
  metaDescription: z.string().optional(),
})

// Allowlist explícita de campos editáveis via .pick(). Spread `...parsed.data`
// aceitaria QUALQUER campo futuro adicionado ao productSchema — risco de mass
// assignment se um campo sensível (ex: vendorId, internalNotes) for incluído
// no schema sem perceber. .pick() força revisão consciente do que é editável.
const productEditableSchema = productSchema.pick({
  name: true,
  slug: true,
  description: true,
  price: true,
  costPrice: true,
  supplierCode: true,
  category: true,
  team: true,
  type: true,
  badge: true,
  sizesAvailable: true,
  images: true,
  isActive: true,
  isFeatured: true,
  metaTitle: true,
  metaDescription: true,
})

export async function createProduct(data: unknown) {
  await requireAdmin()
  const parsed = productSchema.safeParse(data)
  if (!parsed.success) return { error: parsed.error.flatten().fieldErrors }

  const safeData = productEditableSchema.parse(parsed.data)

  const product = await prisma.product.create({
    data: {
      ...safeData,
      sizesAvailable: stringifyJsonField(safeData.sizesAvailable),
      images: stringifyJsonField(safeData.images),
    },
  })

  revalidatePath('/loja')
  revalidatePath('/admin/produtos')
  return { success: true, productId: product.id }
}

export async function updateProduct(id: string, data: unknown) {
  await requireAdmin()
  const parsed = productSchema.partial().safeParse(data)
  if (!parsed.success) return { error: parsed.error.flatten().fieldErrors }

  const safeData = productEditableSchema.partial().parse(parsed.data)

  const updateData: Record<string, unknown> = { ...safeData }
  if (safeData.sizesAvailable) updateData.sizesAvailable = stringifyJsonField(safeData.sizesAvailable)
  if (safeData.images) updateData.images = stringifyJsonField(safeData.images)

  await prisma.product.update({ where: { id }, data: updateData })
  revalidatePath('/loja')
  revalidatePath('/admin/produtos')
  return { success: true }
}

export async function deleteProduct(id: string) {
  await requireAdmin()
  await prisma.product.update({ where: { id }, data: { isActive: false } })
  revalidatePath('/admin/produtos')
  return { success: true }
}

export async function updateOrderStatus(orderId: string, status: string, note?: string) {
  const session = await requireAdmin()
  const adminId = (session.user as { id: string }).id

  const order = await prisma.order.findUnique({ where: { id: orderId } })
  if (!order) return { error: 'Pedido não encontrado' }

  await prisma.order.update({ where: { id: orderId }, data: { status } })
  await prisma.orderHistory.create({
    data: { orderId, adminUserId: adminId, action: 'status_changed', fromStatus: order.status, toStatus: status, note },
  })

  revalidatePath('/admin/pedidos')
  return { success: true }
}

export async function createCoupon(data: unknown) {
  await requireAdmin()
  const schema = z.object({
    code: z.string().min(3).toUpperCase(),
    type: z.enum(['percent', 'fixed']),
    value: z.number().positive(),
    minOrderValue: z.number().default(0),
    maxUses: z.number().optional(),
    expiresAt: z.string().optional(),
    isActive: z.boolean().default(true),
  })
  const parsed = schema.safeParse(data)
  if (!parsed.success) return { error: parsed.error.flatten().fieldErrors }

  const coupon = await prisma.coupon.create({
    data: {
      ...parsed.data,
      code: parsed.data.code.toUpperCase(),
      expiresAt: parsed.data.expiresAt ? new Date(parsed.data.expiresAt) : null,
    },
  })

  revalidatePath('/admin/cupons')
  return { success: true, couponId: coupon.id }
}

export async function toggleFeatured(productId: string, featured: boolean) {
  await requireAdmin()
  await prisma.product.update({
    where: { id: productId },
    data: { isFeatured: featured },
  })
  revalidatePath('/')
  revalidatePath('/admin/vitrine')
  return { success: true }
}

export async function updateStoreSetting(key: string, value: string) {
  await requireAdmin()
  await prisma.storeSetting.upsert({
    where: { key },
    update: { value },
    create: { key, value, category: 'general' },
  })
  revalidatePath('/admin/configuracoes')
  return { success: true }
}
