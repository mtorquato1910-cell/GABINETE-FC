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
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center px-6 md:px-8 py-4 border-b border-[#1a1a1a] gap-4 bg-black">
          <div className="flex gap-2 flex-wrap">
            {mockCategories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                className={`px-4 py-2 text-[11px] font-bold uppercase tracking-widest transition-all duration-200 ${
                  activeCategory === cat.id
                    ? 'border border-white text-white'
                    : 'text-white/50 hover:text-white transition-colors'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>
          <div className="text-[9px] text-white/30 uppercase tracking-[0.2em] font-bold shrink-0">
            {filtered.length} {filtered.length === 1 ? 'item' : 'itens'}
          </div>
        </div>
      )}

      {filtered.length === 0 ? (
        <div className="py-32 text-center text-[10px] text-white/30 uppercase tracking-[0.2em]">
          Nenhum produto encontrado.
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-px bg-[#111]">
          {filtered.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      )}
    </section>
  )
}
