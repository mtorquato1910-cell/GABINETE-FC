'use server'
import { prisma } from '@/lib/db'
import { mapProductFromDb } from '@/lib/db-helpers'
import type { Product } from '@/types'

/**
 * Calcula estoque em batch — uma única query agrupada por productId+type.
 * Substitui o pattern N+1 (1 query por produto). Default 99 quando sem movimentos.
 */
export async function calcStockBatch(
  productIds: string[]
): Promise<Record<string, number>> {
  if (productIds.length === 0) return {}
  const movements = await prisma.stockMovement.groupBy({
    by: ['productId', 'type'],
    where: { productId: { in: productIds } },
    _sum: { quantity: true },
  })
  const out: Record<string, number> = {}
  for (const id of productIds) {
    const inQty = movements.find((m) => m.productId === id && m.type === 'in')?._sum.quantity ?? 0
    const outQty = movements.find((m) => m.productId === id && m.type === 'out')?._sum.quantity ?? 0
    const calculated = inQty - outQty
    out[id] = calculated > 0 ? calculated : 99 // default pra produtos sem movimento (seed inicial)
  }
  return out
}

async function calcStock(productId: string): Promise<number> {
  const map = await calcStockBatch([productId])
  return map[productId] ?? 99
}

// Ordena produtos: com estoque primeiro, depois com fotos reais (>2 imagens),
// depois com capa, depois destaques, depois createdAt desc.
function sortProducts<T extends { images: string; isFeatured: boolean; createdAt: Date; id: string }>(
  products: T[],
  stocks: Record<string, number>,
): T[] {
  const photoCount = (imagesJson: string) => {
    try { return (JSON.parse(imagesJson) as string[]).filter((u) => !u.includes('/covers/') && !u.endsWith('placeholder-jersey.svg')).length }
    catch { return 0 }
  }
  return [...products].sort((a, b) => {
    const aInStock = (stocks[a.id] ?? 99) > 0 ? 1 : 0
    const bInStock = (stocks[b.id] ?? 99) > 0 ? 1 : 0
    if (aInStock !== bInStock) return bInStock - aInStock
    const aPhotos = photoCount(a.images) > 0 ? 1 : 0
    const bPhotos = photoCount(b.images) > 0 ? 1 : 0
    if (aPhotos !== bPhotos) return bPhotos - aPhotos
    const aHasCover = a.images.includes('/covers/') ? 1 : 0
    const bHasCover = b.images.includes('/covers/') ? 1 : 0
    if (aHasCover !== bHasCover) return bHasCover - aHasCover
    const aFeat = a.isFeatured ? 1 : 0
    const bFeat = b.isFeatured ? 1 : 0
    if (aFeat !== bFeat) return bFeat - aFeat
    return b.createdAt.getTime() - a.createdAt.getTime()
  })
}

export async function getActiveProducts(): Promise<Product[]> {
  const products = await prisma.product.findMany({
    where: { isActive: true },
  })
  const stocks = await calcStockBatch(products.map((p) => p.id))
  const sorted = sortProducts(products, stocks)
  return sorted.map((p) => mapProductFromDb(p, stocks[p.id] ?? 99))
}

export async function getFeaturedProducts(): Promise<Product[]> {
  const products = await prisma.product.findMany({
    where: { isActive: true, isFeatured: true },
    orderBy: [{ featuredOrder: 'asc' }, { createdAt: 'desc' }],
    take: 8,
  })
  const stocks = await calcStockBatch(products.map((p) => p.id))
  return products.map((p) => mapProductFromDb(p, stocks[p.id] ?? 99))
}

export async function getProductBySlug(slug: string): Promise<Product | null> {
  const product = await prisma.product.findFirst({
    where: { slug, isActive: true },
  })
  if (!product) return null
  const stock = await calcStock(product.id)
  return mapProductFromDb(product, stock)
}

export async function getProductsByCategory(category: string): Promise<Product[]> {
  const where =
    category === 'all' || !category ? { isActive: true } : { isActive: true, category }

  const products = await prisma.product.findMany({ where })
  const stocks = await calcStockBatch(products.map((p) => p.id))
  const sorted = sortProducts(products, stocks)
  return sorted.map((p) => mapProductFromDb(p, stocks[p.id] ?? 99))
}

export async function searchProductsDb(query: string): Promise<Product[]> {
  if (!query.trim()) return []
  const products = await prisma.product.findMany({
    where: {
      isActive: true,
      OR: [
        { name: { contains: query, mode: 'insensitive' } },
        { description: { contains: query, mode: 'insensitive' } },
        { team: { contains: query, mode: 'insensitive' } },
        { category: { contains: query, mode: 'insensitive' } },
      ],
    },
    orderBy: { isFeatured: 'desc' },
    take: 20,
  })
  const stocks = await calcStockBatch(products.map((p) => p.id))
  return products.map((p) => mapProductFromDb(p, stocks[p.id] ?? 99))
}

export async function getAllProductSlugs(): Promise<string[]> {
  const products = await prisma.product.findMany({
    where: { isActive: true },
    select: { slug: true },
  })
  return products.map((p) => p.slug)
}
