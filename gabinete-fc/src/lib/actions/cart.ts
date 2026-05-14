'use server'
import { revalidatePath } from 'next/cache'
import { Prisma } from '@prisma/client'
import { prisma } from '@/lib/db'
import { auth } from '@/lib/auth'
import { mapProductFromDb } from '@/lib/db-helpers'
import type { CartItem } from '@/types'

// Forma do item que vem do client (Zustand)
export interface ClientCartLine {
  productId: string
  size: string
  quantity: number
  hasCustomization?: boolean
  customName?: string | null
  customNumber?: string | null
}

// Forma do item que volta pro client (com lineId estável do banco + product completo)
export interface ServerCartLine extends CartItem {
  lineId: string
}

export interface CartSyncResult {
  items: ServerCartLine[]
  /** Itens que tiveram quantidade reduzida pelo limite server (20/item) */
  cappedItems: string[]
}

const MAX_QTY_PER_LINE = 20

function itemKey(i: {
  productId: string
  size: string
  hasCustomization?: boolean | null
  customName?: string | null
  customNumber?: string | null
}): string {
  return [
    i.productId,
    i.size,
    i.hasCustomization ? '1' : '0',
    i.customName ?? '',
    i.customNumber ?? '',
  ].join('|')
}

/**
 * Retorna apenas itens cujo produto ainda está ativo — produtos desativados
 * pelo admin não aparecem mais no carrinho (evita UX confusa de "produto morto").
 */
async function fetchCartLines(cartId: string): Promise<ServerCartLine[]> {
  const items = await prisma.cartItem.findMany({
    where: { cartId, product: { isActive: true } },
    include: { product: true },
    orderBy: { createdAt: 'asc' },
  })
  return items.map((i) => ({
    lineId: i.id,
    product: mapProductFromDb(i.product, 99),
    size: i.size,
    quantity: i.quantity,
    hasCustomization: i.hasCustomization,
    customName: i.customName ?? undefined,
    customNumber: i.customNumber ?? undefined,
  }))
}

/** Retorna os itens do carrinho do usuário logado (vazio se anônimo). */
export async function getServerCart(): Promise<ServerCartLine[]> {
  const session = await auth()
  if (!session) return []
  const cart = await prisma.cart.findUnique({ where: { userId: session.user.id } })
  if (!cart) return []
  return fetchCartLines(cart.id)
}

function capAndIdentify(items: ClientCartLine[]): {
  capped: ClientCartLine[]
  cappedKeys: string[]
} {
  const cappedKeys: string[] = []
  const capped = items.map((i) => {
    if (i.quantity > MAX_QTY_PER_LINE) {
      cappedKeys.push(itemKey(i))
      return { ...i, quantity: MAX_QTY_PER_LINE }
    }
    return i
  })
  return { capped, cappedKeys }
}

/**
 * Sync bulk: replace items do server pelos do client.
 * Filtra produtos inválidos · respeita limite de quantity.
 * Roda em SERIALIZABLE pra evitar race em tabs paralelos.
 */
export async function syncCart(items: ClientCartLine[]): Promise<CartSyncResult> {
  const session = await auth()
  if (!session) return { items: [], cappedItems: [] }
  const userId = session.user.id

  const { capped, cappedKeys } = capAndIdentify(items.filter((i) => i.quantity > 0))

  // 2 queries paralelas: cart upsert + validProducts
  const productIds = Array.from(new Set(capped.map((i) => i.productId)))
  const [cart, validProducts] = await Promise.all([
    prisma.cart.upsert({
      where: { userId },
      create: { userId },
      update: {},
      select: { id: true },
    }),
    productIds.length === 0
      ? Promise.resolve([] as { id: string }[])
      : prisma.product.findMany({
          where: { id: { in: productIds }, isActive: true },
          select: { id: true },
        }),
  ])

  const validIds = new Set(validProducts.map((p) => p.id))
  const filtered = capped.filter((i) => validIds.has(i.productId))

  await prisma.$transaction(
    [
      prisma.cartItem.deleteMany({ where: { cartId: cart.id } }),
      ...(filtered.length > 0
        ? [
            prisma.cartItem.createMany({
              data: filtered.map((i) => ({
                cartId: cart.id,
                productId: i.productId,
                size: i.size,
                quantity: i.quantity,
                hasCustomization: !!i.hasCustomization,
                customName: i.hasCustomization
                  ? i.customName?.toUpperCase() ?? null
                  : null,
                customNumber: i.hasCustomization ? i.customNumber ?? null : null,
              })),
            }),
          ]
        : []),
    ],
    { isolationLevel: Prisma.TransactionIsolationLevel.Serializable }
  )

  return { items: await fetchCartLines(cart.id), cappedItems: cappedKeys }
}

/**
 * Faz merge do carrinho local (Zustand, do navegador) com o carrinho do banco.
 * Itens com mesma chave (productId+size+customização) somam quantidades.
 * Roda em SERIALIZABLE pra ser seguro com tabs paralelos no login.
 */
export async function mergeCart(localItems: ClientCartLine[]): Promise<CartSyncResult> {
  const session = await auth()
  if (!session) return { items: [], cappedItems: [] }
  const userId = session.user.id

  // 1 query: upsert cart + carrega items + descobre productIds em paralelo
  const cart = await prisma.cart.upsert({
    where: { userId },
    create: { userId },
    update: {},
    select: { id: true },
  })

  const localProductIds = localItems.map((i) => i.productId)
  const [existing, localValidProducts] = await Promise.all([
    prisma.cartItem.findMany({ where: { cartId: cart.id } }),
    localProductIds.length === 0
      ? Promise.resolve([] as { id: string }[])
      : prisma.product.findMany({
          where: { id: { in: localProductIds }, isActive: true },
          select: { id: true },
        }),
  ])

  const validIds = new Set(localValidProducts.map((p) => p.id))

  // Existing items: mantém TODOS (já estavam no cart). Quando filtra inativos no fetchCartLines.
  const merged = new Map<string, ClientCartLine>()
  for (const e of existing) {
    merged.set(itemKey(e), {
      productId: e.productId,
      size: e.size,
      quantity: e.quantity,
      hasCustomization: e.hasCustomization,
      customName: e.customName,
      customNumber: e.customNumber,
    })
  }
  // Local items: só agrega se produto válido
  const cappedKeys: string[] = []
  for (const i of localItems) {
    if (!validIds.has(i.productId) || i.quantity <= 0) continue
    const k = itemKey(i)
    const prev = merged.get(k)
    if (prev) {
      const target = prev.quantity + i.quantity
      if (target > MAX_QTY_PER_LINE) cappedKeys.push(k)
      prev.quantity = Math.min(target, MAX_QTY_PER_LINE)
    } else {
      if (i.quantity > MAX_QTY_PER_LINE) cappedKeys.push(k)
      merged.set(k, { ...i, quantity: Math.min(i.quantity, MAX_QTY_PER_LINE) })
    }
  }

  const finalItems = Array.from(merged.values())

  await prisma.$transaction(
    [
      prisma.cartItem.deleteMany({ where: { cartId: cart.id } }),
      ...(finalItems.length > 0
        ? [
            prisma.cartItem.createMany({
              data: finalItems.map((i) => ({
                cartId: cart.id,
                productId: i.productId,
                size: i.size,
                quantity: i.quantity,
                hasCustomization: !!i.hasCustomization,
                customName: i.hasCustomization
                  ? i.customName?.toUpperCase() ?? null
                  : null,
                customNumber: i.hasCustomization ? i.customNumber ?? null : null,
              })),
            }),
          ]
        : []),
    ],
    { isolationLevel: Prisma.TransactionIsolationLevel.Serializable }
  )

  return { items: await fetchCartLines(cart.id), cappedItems: cappedKeys }
}

/** Limpa o carrinho do usuário logado no banco (uso: pós-checkout sucesso). */
export async function clearServerCart() {
  const session = await auth()
  if (!session) return { success: true }
  const cart = await prisma.cart.findUnique({ where: { userId: session.user.id } })
  if (cart) {
    await prisma.cartItem.deleteMany({ where: { cartId: cart.id } })
  }
  // Invalida caches de Server Components que listam o carrinho
  revalidatePath('/carrinho')
  revalidatePath('/checkout')
  revalidatePath('/minha-conta')
  return { success: true }
}
