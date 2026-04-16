'use server'
import { z } from 'zod'
import { prisma } from '@/lib/db'
import { requireAuth } from '@/lib/auth'

const addressSchema = z.object({
  label: z.string().default('Casa'),
  recipientName: z.string().min(2),
  street: z.string().min(3),
  number: z.string().min(1),
  complement: z.string().optional(),
  neighborhood: z.string().min(2),
  city: z.string().min(2),
  state: z.string().length(2),
  zipCode: z.string().regex(/^\d{8}$/, 'CEP inválido (8 dígitos)'),
  isDefault: z.boolean().default(false),
})

export async function saveAddress(data: unknown) {
  const session = await requireAuth()
  const userId = (session.user as { id: string }).id
  const parsed = addressSchema.safeParse(data)
  if (!parsed.success) return { error: parsed.error.flatten().fieldErrors }

  const address = await prisma.address.create({
    data: { userId, ...parsed.data },
  })
  return { success: true, addressId: address.id }
}

export async function getUserAddresses() {
  const session = await requireAuth()
  const userId = (session.user as { id: string }).id
  return prisma.address.findMany({
    where: { userId },
    orderBy: { isDefault: 'desc' },
  })
}

const orderSchema = z.object({
  addressId: z.string(),
  paymentMethod: z.enum(['pix', 'credit_card', 'debit_card']),
  couponCode: z.string().optional(),
  items: z.array(z.object({
    productId: z.string(),
    productName: z.string(),
    productImage: z.string(),
    size: z.string(),
    quantity: z.number().int().positive(),
    unitPrice: z.number().positive(),
  })),
  freightCost: z.number().default(0),
})

export async function createOrder(data: unknown) {
  const session = await requireAuth()
  const userId = (session.user as { id: string }).id
  const parsed = orderSchema.safeParse(data)
  if (!parsed.success) return { error: 'Dados inválidos' }

  const { addressId, paymentMethod, couponCode, items, freightCost } = parsed.data

  // Valida cupom se fornecido
  let couponId: string | undefined
  let discountAmount = 0
  if (couponCode) {
    const coupon = await prisma.coupon.findFirst({
      where: { code: couponCode, isActive: true },
    })
    if (coupon) {
      couponId = coupon.id
      const subtotal = items.reduce((sum, i) => sum + i.unitPrice * i.quantity, 0)
      discountAmount = coupon.type === 'percent'
        ? subtotal * (coupon.value / 100)
        : coupon.value
    }
  }

  const subtotal = items.reduce((sum, i) => sum + i.unitPrice * i.quantity, 0)
  const pixDiscount = paymentMethod === 'pix' ? subtotal * 0.05 : 0
  const total = subtotal + freightCost - discountAmount - pixDiscount

  const order = await prisma.order.create({
    data: {
      userId,
      addressId,
      paymentMethod,
      paymentStatus: 'pending',
      status: 'pending',
      subtotal,
      freightCost,
      discountAmount: discountAmount + pixDiscount,
      total,
      couponId,
      items: {
        create: items.map((item) => ({
          productId: item.productId,
          productName: item.productName,
          productImage: item.productImage,
          size: item.size,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          totalPrice: item.unitPrice * item.quantity,
        })),
      },
    },
  })

  // Log histórico
  await prisma.orderHistory.create({
    data: { orderId: order.id, action: 'created', toStatus: 'pending' },
  })

  return { success: true, orderId: order.id }
}

export async function validateCoupon(code: string, subtotal: number) {
  const coupon = await prisma.coupon.findFirst({
    where: { code: code.toUpperCase(), isActive: true },
  })
  if (!coupon) return { valid: false, message: 'Cupom inválido ou expirado' }
  if (coupon.expiresAt && coupon.expiresAt < new Date()) return { valid: false, message: 'Cupom expirado' }
  if (coupon.maxUses && coupon.usedCount >= coupon.maxUses) return { valid: false, message: 'Cupom esgotado' }
  if (subtotal < coupon.minOrderValue) return { valid: false, message: `Pedido mínimo: R$ ${coupon.minOrderValue.toFixed(2)}` }

  const discount = coupon.type === 'percent' ? subtotal * (coupon.value / 100) : coupon.value
  return { valid: true, couponId: coupon.id, discount, type: coupon.type, value: coupon.value }
}
