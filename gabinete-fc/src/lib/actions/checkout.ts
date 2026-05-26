'use server'
import { z } from 'zod'
import { prisma } from '@/lib/db'
import { requireAuth, auth } from '@/lib/auth'
import { isValidCpf } from '@/lib/masks'

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
  const userId = session.user.id
  const parsed = addressSchema.safeParse(data)
  if (!parsed.success) return { error: parsed.error.flatten().fieldErrors }

  const address = await prisma.address.create({
    data: { userId, ...parsed.data },
  })
  return { success: true, addressId: address.id }
}

export async function getUserAddresses() {
  const session = await requireAuth()
  const userId = session.user.id
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
  paymentMethod: z.enum(['pix', 'credit_card', 'debit_card', 'infinitepay']),
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
  const userId = session.user.id
  const parsed = orderSchema.safeParse(data)
  if (!parsed.success) {
    // Log estruturado server-side pra debug (sempre, não só dev)
    console.error('[createOrder] Validação Zod falhou', {
      userId,
      issues: parsed.error.issues,
      flatten: parsed.error.flatten(),
      receivedKeys: data && typeof data === 'object' ? Object.keys(data) : null,
    })
    // Devolve detalhes pro front (não vaza nada sensível — só nomes de campos)
    return {
      error: 'Dados inválidos',
      details: parsed.error.issues.map((i) => ({
        path: i.path.join('.'),
        message: i.message,
        code: i.code,
      })),
    }
  }

  const { addressId, paymentMethod, couponCode, items, freightCost } = parsed.data

  // Garante que o endereço é do user (sem revelar IDs)
  const address = await prisma.address.findFirst({
    where: { id: addressId, userId },
    select: { id: true },
  })
  if (!address) return { error: 'Endereço inválido' }

  // Valida produtos: todos precisam existir e estar ativos no momento do pedido
  const productIds = Array.from(new Set(items.map((i) => i.productId)))
  const validProducts = await prisma.product.findMany({
    where: { id: { in: productIds }, isActive: true },
    select: { id: true, price: true, name: true },
  })
  if (validProducts.length !== productIds.length) {
    return {
      error:
        'Alguns produtos do seu carrinho não estão mais disponíveis — remova-os e tente novamente',
    }
  }
  // Anti-fraude leve: usar SEMPRE o preço do banco (não do client)
  const priceById = new Map(validProducts.map((p) => [p.id, p.price]))
  const nameById = new Map(validProducts.map((p) => [p.id, p.name]))
  const itemsNormalized = items.map((i) => ({
    ...i,
    unitPrice: priceById.get(i.productId) ?? i.unitPrice,
    productName: nameById.get(i.productId) ?? i.productName,
  }))

  const subtotal = itemsNormalized.reduce((sum, i) => sum + i.unitPrice * i.quantity, 0)
  const itemCount = itemsNormalized.reduce((sum, i) => sum + i.quantity, 0)

  // Valida cupom (inclui expiração e maxUses) ANTES da transaction pra ter early return
  let couponSnapshot: {
    id: string
    type: string
    value: number
    firstOrderOnly: boolean
    maxUses: number | null
  } | null = null
  if (couponCode) {
    const coupon = await prisma.coupon.findFirst({
      where: {
        code: couponCode.toUpperCase(),
        isActive: true,
        OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
      },
    })
    if (!coupon) {
      return { error: 'Cupom inválido ou expirado' }
    }
    if (coupon.maxUses != null && coupon.usedCount >= coupon.maxUses) {
      return { error: 'Cupom esgotado' }
    }
    if (subtotal < coupon.minOrderValue) {
      return { error: `Pedido mínimo para o cupom: R$ ${coupon.minOrderValue.toFixed(2)}` }
    }
    if (coupon.firstOrderOnly && itemCount > FIRST_ORDER_COUPON_MAX_ITEMS) {
      return { error: 'Cupom não vale com 3+ peças' }
    }
    couponSnapshot = {
      id: coupon.id,
      type: coupon.type,
      value: coupon.value,
      firstOrderOnly: coupon.firstOrderOnly,
      maxUses: coupon.maxUses,
    }
  }

  const discountAmount = couponSnapshot
    ? couponSnapshot.type === 'percent'
      ? subtotal * (couponSnapshot.value / 100)
      : couponSnapshot.value
    : 0
  const pixDiscount = paymentMethod === 'pix' ? subtotal * 0.05 : 0
  const total = subtotal + freightCost - discountAmount - pixDiscount

  // Transação atômica: re-valida (firstOrderOnly/maxUses) + cria order + incrementa cupom
  try {
    const order = await prisma.$transaction(async (tx) => {
      if (couponSnapshot?.firstOrderOnly) {
        const previousOrders = await tx.order.count({
          where: { userId, paymentStatus: { in: ['paid', 'pending'] } },
        })
        if (previousOrders > 0) {
          throw new Error('Cupom válido apenas para primeira compra')
        }
      }
      if (couponSnapshot?.maxUses != null) {
        const fresh = await tx.coupon.findUnique({ where: { id: couponSnapshot.id } })
        if (!fresh || fresh.usedCount >= couponSnapshot.maxUses) {
          throw new Error('Cupom esgotado')
        }
      }

      const created = await tx.order.create({
        data: {
          userId,
          addressId: address.id,
          paymentMethod,
          paymentStatus: 'pending',
          status: 'pending',
          subtotal,
          freightCost,
          discountAmount: discountAmount + pixDiscount,
          total,
          couponId: couponSnapshot?.id,
          items: {
            create: itemsNormalized.map((item) => ({
              productId: item.productId,
              productName: item.productName,
              productImage: item.productImage,
              size: item.size,
              quantity: item.quantity,
              unitPrice: item.unitPrice,
              totalPrice: item.unitPrice * item.quantity,
              hasCustomization: item.hasCustomization ?? false,
              customName: item.hasCustomization
                ? item.customName?.toUpperCase() ?? null
                : null,
              customNumber: item.hasCustomization ? item.customNumber ?? null : null,
            })),
          },
        },
      })

      if (couponSnapshot) {
        await tx.coupon.update({
          where: { id: couponSnapshot.id },
          data: { usedCount: { increment: 1 } },
        })
      }

      await tx.orderHistory.create({
        data: { orderId: created.id, action: 'created', toStatus: 'pending' },
      })

      return created
    })

    return { success: true, orderId: order.id }
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Erro ao criar pedido'
    return { error: message }
  }
}

// Política Gabinete FC (Sprint 4) — cupons firstOrderOnly bloqueados acima desse total.
const FIRST_ORDER_COUPON_MAX_ITEMS = 2

export async function validateCoupon(code: string, subtotal: number, itemCount = 1) {
  const coupon = await prisma.coupon.findFirst({
    where: {
      code: code.toUpperCase(),
      isActive: true,
      OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
    },
  })
  if (!coupon) return { valid: false, message: 'Cupom inválido ou expirado' }
  if (coupon.maxUses != null && coupon.usedCount >= coupon.maxUses) {
    return { valid: false, message: 'Cupom esgotado' }
  }
  if (subtotal < coupon.minOrderValue) {
    return {
      valid: false,
      message: `Pedido mínimo: R$ ${coupon.minOrderValue.toFixed(2)}`,
    }
  }

  if (coupon.firstOrderOnly) {
    if (itemCount > FIRST_ORDER_COUPON_MAX_ITEMS) {
      return {
        valid: false,
        message: 'Cupom indisponível com 3 ou mais peças — já está no melhor preço promocional',
      }
    }
    const session = await auth()
    const userId = session?.user?.id
    if (!userId) return { valid: false, message: 'Faça login para usar este cupom' }
    const previousOrders = await prisma.order.count({
      where: { userId, paymentStatus: { in: ['paid', 'pending'] } },
    })
    if (previousOrders > 0)
      return { valid: false, message: 'Cupom válido apenas para primeira compra' }
  }

  const discount =
    coupon.type === 'percent' ? subtotal * (coupon.value / 100) : coupon.value
  return {
    valid: true,
    couponId: coupon.id,
    discount,
    type: coupon.type,
    value: coupon.value,
  }
}
