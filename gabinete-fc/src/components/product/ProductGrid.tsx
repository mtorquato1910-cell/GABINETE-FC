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
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center px-4 md:px-6 py-4 border-b border-[#1a1a1a] gap-4 bg-[#050505]">
          <div className="flex gap-2 flex-wrap">
            {mockCategories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                className={`px-4 py-2 text-[11px] font-bold uppercase tracking-widest transition-all duration-150 ${
                  activeCategory === cat.id
                    ? 'bg-foreground text-background'
                    : 'border border-[#2a2a2a] text-muted-foreground hover:border-foreground/50 hover:text-foreground'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>
          <div className="text-[11px] text-muted-foreground uppercase tracking-widest shrink-0">
            {filtered.length} {filtered.length === 1 ? 'item' : 'itens'}
          </div>
        </div>
      )}

      {filtered.length === 0 ? (
        <div className="py-24 text-center text-xs text-muted-foreground uppercase tracking-widest">
          Nenhum produto encontrado.
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 border-t border-l border-[#1a1a1a]">
          {filtered.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      )}
    </section>
  )
}
