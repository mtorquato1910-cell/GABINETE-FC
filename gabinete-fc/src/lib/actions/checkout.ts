'use server'
import { z } from 'zod'
import { prisma } from '@/lib/db'
import { requireAuth, auth } from '@/lib/auth'

function isValidCpf(cpf: string): boolean {
  const digits = cpf.replace(/\D/g, '')
  if (digits.length !== 11) return false
  if (/^(\d)\1{10}$/.test(digits)) return false // todos iguais
  let sum = 0
  for (let i = 0; i < 9; i++) sum += parseInt(digits[i]) * (10 - i)
  let rev = 11 - (sum % 11)
  if (rev === 10 || rev === 11) rev = 0
  if (rev !== parseInt(digits[9])) return false
  sum = 0
  for (let i = 0; i < 10; i++) sum += parseInt(digits[i]) * (11 - i)
  rev = 11 - (sum % 11)
  if (rev === 10 || rev === 11) rev = 0
  return rev === parseInt(digits[10])
}

const addressSchema = z.object({
  label: z.string().default('Casa'),
  recipientName: z.string().min(2, 'Nome do destinatário é obrigatório'),
  recipientCpf: z.string().refine(isValidCpf, 'CPF inválido'),
  recipientPhone: z.string().min(10, 'Telefone deve ter DDD + número (mín. 10 dígitos)'),
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

const customizationSchema = z.object({
  hasCustomization: z.boolean().default(false),
  customName: z
    .string()
    .trim()
    .max(12, 'Nome até 12 caracteres')
    .regex(/^[A-Z0-9 ]*$/i, 'Use apenas letras e números')
    .optional()
    .nullable(),
  customNumber: z
    .string()
    .regex(/^[0-9]{1,2}$/, 'Número de 1 a 99')
    .refine((v) => !v || (Number(v) >= 1 && Number(v) <= 99), 'Número entre 1 e 99')
    .optional()
    .nullable(),
})

const orderSchema = z.object({
  addressId: z.string(),
  paymentMethod: z.enum(['pix', 'credit_card', 'debit_card']),
  couponCode: z.string().optional(),
  items: z.array(
    z
      .object({
        productId: z.string(),
        productName: z.string(),
        productImage: z.string(),
        size: z.string(),
        quantity: z.number().int().positive(),
        unitPrice: z.number().positive(),
      })
      .merge(customizationSchema)
      .refine(
        (item) =>
          !item.hasCustomization || (!!item.customName?.trim() && !!item.customNumber),
        { message: 'Personalização exige nome e número' }
      ),
  ),
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
          hasCustomization: item.hasCustomization ?? false,
          customName: item.hasCustomization ? item.customName?.toUpperCase() ?? null : null,
          customNumber: item.hasCustomization ? item.customNumber ?? null : null,
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

// Cupons exclusivos da primeira compra ficam bloqueados quando o carrinho
// ultrapassa este número de peças — política Gabinete FC (Sprint 4).
const FIRST_ORDER_COUPON_MAX_ITEMS = 2

export async function validateCoupon(code: string, subtotal: number, itemCount = 1) {
  const coupon = await prisma.coupon.findFirst({
    where: { code: code.toUpperCase(), isActive: true },
  })
  if (!coupon) return { valid: false, message: 'Cupom inválido ou expirado' }
  if (coupon.expiresAt && coupon.expiresAt < new Date()) return { valid: false, message: 'Cupom expirado' }
  if (coupon.maxUses && coupon.usedCount >= coupon.maxUses) return { valid: false, message: 'Cupom esgotado' }
  if (subtotal < coupon.minOrderValue) return { valid: false, message: `Pedido mínimo: R$ ${coupon.minOrderValue.toFixed(2)}` }

  if (coupon.firstOrderOnly) {
    if (itemCount > FIRST_ORDER_COUPON_MAX_ITEMS) {
      return {
        valid: false,
        message: 'Cupom indisponível com 3 ou mais peças — já está no melhor preço promocional',
      }
    }
    const session = await auth()
    const userId = (session?.user as { id?: string } | undefined)?.id
    if (!userId) return { valid: false, message: 'Faça login para usar este cupom' }
    const previousOrders = await prisma.order.count({
      where: { userId, paymentStatus: { in: ['paid', 'pending'] } },
    })
    if (previousOrders > 0) return { valid: false, message: 'Cupom válido apenas para primeira compra' }
  }

  const discount = coupon.type === 'percent' ? subtotal * (coupon.value / 100) : coupon.value
  return { valid: true, couponId: coupon.id, discount, type: coupon.type, value: coupon.value }
}
