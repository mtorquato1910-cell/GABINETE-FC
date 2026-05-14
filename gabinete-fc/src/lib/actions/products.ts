'use server'
import { prisma } from '@/lib/db'
import { mapProductFromDb } from '@/lib/db-helpers'
import type { Product } from '@/types'

// Calcula estoque: soma de 'in' - soma de 'out' para um produto
async function calcStock(productId: string): Promise<number> {
  const movements = await prisma.stockMovement.groupBy({
    by: ['type'],
    where: { productId },
    _sum: { quantity: true },
  })
  const inQty = movements.find(m => m.type === 'in')?._sum.quantity ?? 0
  const outQty = movements.find(m => m.type === 'out')?._sum.quantity ?? 0
  const calculated = inQty - outQty
  return calculated > 0 ? calculated : 99  // default 99 para seed sem movimentos
}

// Busca todos os produtos ativos com estoque calculado
export async function getActiveProducts(): Promise<Product[]> {
  const products = await prisma.product.findMany({
    where: { isActive: true },
    orderBy: { createdAt: 'desc' },
  })

  return Promise.all(
    products.map(async (p) => {
      const stock = await calcStock(p.id)
      return mapProductFromDb(p, stock)
    })
  )
}

// Busca produtos em destaque — ordenados por featuredOrder (1 = primeiro)
export async function getFeaturedProducts(): Promise<Product[]> {
  const products = await prisma.product.findMany({
    where: { isActive: true, isFeatured: true },
    orderBy: [{ featuredOrder: 'asc' }, { createdAt: 'desc' }],
    take: 8,
  })

  return Promise.all(
    products.map(async (p) => {
      const stock = await calcStock(p.id)
      return mapProductFromDb(p, stock)
    })
  )
}

// Busca produto por slug
export async function getProductBySlug(slug: string): Promise<Product | null> {
  const product = await prisma.product.findFirst({
    where: { slug, isActive: true },
  })
  if (!product) return null
  const stock = await calcStock(product.id)
  return mapProductFromDb(product, stock)
}

// Busca produtos por categoria
export async function getProductsByCategory(category: string): Promise<Product[]> {
  const where = category === 'all' || !category
    ? { isActive: true }
    : { isActive: true, category }

  const products = await prisma.product.findMany({
    where,
    orderBy: { createdAt: 'desc' },
  })

  return Promise.all(
    products.map(async (p) => {
      const stock = await calcStock(p.id)
      return mapProductFromDb(p, stock)
    })
  )
}

// Busca de texto em nome/descrição/time
export async function searchProductsDb(query: string): Promise<Product[]> {
  if (!query.trim()) return []

  const products = await prisma.product.findMany({
    where: {
      isActive: true,
      OR: [
        { name: { contains: query } },
        { description: { contains: query } },
        { team: { contains: query } },
        { category: { contains: query } },
      ],
    },
    orderBy: { isFeatured: 'desc' },
    take: 20,
  })

  return Promise.all(
    products.map(async (p) => {
      const stock = await calcStock(p.id)
      return mapProductFromDb(p, stock)
    })
  )
}

// Busca todos os slugs (para generateStaticParams)
export async function getAllProductSlugs(): Promise<string[]> {
  const products = await prisma.product.findMany({
    where: { isActive: true },
    select: { slug: true },
  })
  return products.map(p => p.slug)
}
