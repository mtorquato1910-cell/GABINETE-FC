/**
 * Parse seguro de campo JSON armazenado como string (SQLite)
 */
export function parseJsonField<T>(value: string | null | undefined, fallback: T): T {
  if (!value) return fallback
  try {
    return JSON.parse(value) as T
  } catch {
    return fallback
  }
}

/**
 * Serializa array/objeto para string JSON para salvar no banco
 */
export function stringifyJsonField<T>(value: T): string {
  return JSON.stringify(value)
}

/**
 * Converte produto do Prisma para tipo Product do frontend
 */
export function mapProductFromDb(dbProduct: {
  id: string
  name: string
  slug: string
  description: string
  team: string
  category: string
  badge: string | null
  price: number
  originalPrice: number | null
  images: string
  sizesAvailable: string
  stock: number
  status: string
  featured: boolean
  createdAt: Date
  updatedAt: Date
}) {
  return {
    ...dbProduct,
    sizesAvailable: parseJsonField<string[]>(dbProduct.sizesAvailable, []),
    images: parseJsonField<string[]>(dbProduct.images, []),
  }
}

/**
 * Verifica se usuário é admin
 */
export function isAdmin(role?: string | null): boolean {
  return role === 'admin'
}

/**
 * Formata preço para BRL
 */
export function formatPrice(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value)
}
