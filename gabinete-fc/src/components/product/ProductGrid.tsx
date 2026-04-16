'use client'

import { useState } from 'react'
import { ProductCard } from './ProductCard'
import { mockCategories } from '@/data/products'
import type { Product } from '@/types'

interface ProductGridProps {
  products: Product[]
  showFilters?: boolean
}

export function ProductGrid({ products, showFilters = true }: ProductGridProps) {
  const [activeCategory, setActiveCategory] = useState('all')

  const filtered =
    activeCategory === 'all'
      ? products
      : products.filter((p) => p.category === activeCategory)

  return (
    <section>
      {showFilters && (
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center px-4 md:px-6 py-4 border-b border-border gap-4">
          <div className="flex gap-2 flex-wrap">
            {mockCategories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                className={`px-4 py-2 text-xs font-bold uppercase tracking-widest transition-colors ${
                  activeCategory === cat.id
                    ? 'bg-foreground text-background'
                    : 'border border-border text-muted-foreground hover:border-foreground hover:text-foreground'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>
          <div className="text-xs text-muted-foreground uppercase tracking-widest">
            {filtered.length} {filtered.length === 1 ? 'item' : 'itens'}
          </div>
        </div>
      )}

      {filtered.length === 0 ? (
        <div className="py-24 text-center text-xs text-muted-foreground uppercase tracking-widest">
          Nenhum produto encontrado.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 border-t border-l border-border">
          {filtered.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      )}
    </section>
  )
}
