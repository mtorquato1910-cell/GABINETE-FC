// Helper para resolver imagem de produto com fallback brutal.
// Uso: getProductImage(product) → string da URL absoluta ou caminho local.

import type { Product } from '@/types'

const PLACEHOLDER = '/images/products/placeholder-jersey.svg'

export interface ProductImageResult {
  src: string
  isPlaceholder: boolean
}

export function getProductImage(product: Pick<Product, 'images' | 'slug'>): ProductImageResult {
  const first = product.images?.[0]?.trim()
  if (first && first.length > 0 && first !== PLACEHOLDER) {
    return { src: first, isPlaceholder: false }
  }
  return { src: PLACEHOLDER, isPlaceholder: true }
}

// Para uso futuro: quando começarem a chegar imagens reais na pasta copa2026/,
// é só popular o campo `images` do Product e o helper já passa a usar.
