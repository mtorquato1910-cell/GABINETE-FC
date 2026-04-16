import type { Product, ProductStatus } from '@/types'

export function parseJsonField<T>(value: string | null | undefined, fallback: T): T {
  if (!value) return fallback
  try { return JSON.parse(value) as T } catch { return fallback }
}

export function stringifyJsonField<T>(value: T): string {
  return JSON.stringify(value)
}

// Mapeia produto do Prisma para tipo Product do frontend
// dbProduct: resultado de prisma.product.findMany() ou findUnique()
// stock: calculado externamente via StockMovement (default 99 se não houver movimentos)
export function mapProductFromDb(
  dbProduct: {
    id: string; name: string; slug: string; description: string | null;
    team: string; category: string; badge: string | null; price: number;
    images: string; sizesAvailable: string; isActive: boolean; isFeatured: boolean;
    createdAt: Date; updatedAt: Date;
  },
  stock = 99
): Product {
  return {
    id: dbProduct.id,
    name: dbProduct.name,
    slug: dbProduct.slug,
    description: dbProduct.description ?? '',
    team: dbProduct.team,
    category: dbProduct.category,
    badge: dbProduct.badge,
    price: dbProduct.price,
    originalPrice: null,
    images: parseJsonField<string[]>(dbProduct.images, ['/images/products/placeholder-jersey.svg']),
    sizesAvailable: parseJsonField<string[]>(dbProduct.sizesAvailable, []),
    stock,
    status: dbProduct.isActive ? 'active' : 'draft' as ProductStatus,
    featured: dbProduct.isFeatured,
    createdAt: dbProduct.createdAt,
    updatedAt: dbProduct.updatedAt,
  }
}

export function isAdmin(role?: string | null): boolean {
  return role === 'admin'
}

export function formatPrice(value: number): string {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value)
}
