'use client'

import { useMemo, useState } from 'react'
import { Search, X } from 'lucide-react'
import { ProductCard } from './ProductCard'
import { mockCategories } from '@/data/products'
import type { Product, ProductVersion } from '@/types'

interface ProductGridProps {
  products: Product[]
  showFilters?: boolean
  /** Mostra toggle Jogador/Torcedor (faz sentido em /loja/selecoes) */
  showVersionFilter?: boolean
  /** Mostra campo de busca dentro da seção */
  showSearch?: boolean
  /** Placeholder customizado do campo de busca */
  searchPlaceholder?: string
}

type VersionFilter = 'all' | ProductVersion

export function ProductGrid({
  products,
  showFilters = true,
  showVersionFilter = false,
  showSearch = false,
  searchPlaceholder = 'Pesquisar seleção, time…',
}: ProductGridProps) {
  const [activeCategory, setActiveCategory] = useState('all')
  const [activeVersion, setActiveVersion] = useState<VersionFilter>('all')
  const [query, setQuery] = useState('')

  const filtered = useMemo(() => {
    let pool = products
    if (activeCategory !== 'all') {
      pool = pool.filter((p) => p.category === activeCategory)
    }
    if (showVersionFilter && activeVersion !== 'all') {
      pool = pool.filter((p) => p.version === activeVersion)
    }
    const q = query.trim().toLowerCase()
    if (showSearch && q.length > 0) {
      pool = pool.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.team.toLowerCase().includes(q)
      )
    }
    return pool
  }, [products, activeCategory, activeVersion, showVersionFilter, showSearch, query])

  const versionTabs: Array<{ id: VersionFilter; label: string }> = [
    { id: 'all', label: 'Todas' },
    { id: 'jogador', label: 'Jogador' },
    { id: 'torcedor', label: 'Torcedor' },
  ]

  return (
    <section>
      {showVersionFilter && (
        <div className="flex justify-center px-6 md:px-8 py-5 border-b border-[#1a1a1a] bg-black">
          <div role="tablist" className="inline-flex border border-[#1a1a1a]">
            {versionTabs.map((tab) => (
              <button
                key={tab.id}
                role="tab"
                aria-selected={activeVersion === tab.id}
                onClick={() => setActiveVersion(tab.id)}
                className={`px-6 py-2.5 text-[11px] font-black uppercase tracking-[0.2em] transition-colors ${
                  activeVersion === tab.id
                    ? 'bg-primary text-primary-foreground'
                    : 'text-white/60 hover:text-white'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {showFilters && (
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center px-6 md:px-8 py-4 border-b border-[#1a1a1a] gap-4 bg-black">
          <div className="flex gap-2 flex-wrap">
            {mockCategories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                className={`px-4 py-2 text-xs font-bold uppercase tracking-widest transition-all duration-200 ${
                  activeCategory === cat.id
                    ? 'border border-white text-white'
                    : 'text-white/50 hover:text-white transition-colors'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>
          <div className="text-xs text-white/30 uppercase tracking-[0.2em] font-bold shrink-0">
            {filtered.length} {filtered.length === 1 ? 'item' : 'itens'}
          </div>
        </div>
      )}

      {showSearch && (
        <div className="px-6 md:px-8 py-3 border-b border-[#1a1a1a] bg-black">
          <div className="relative max-w-xl">
            <Search
              className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/30 pointer-events-none"
              aria-hidden="true"
            />
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={searchPlaceholder}
              aria-label="Pesquisar produtos nesta seção"
              className="w-full bg-[#0a0a0a] border border-[#1a1a1a] pl-10 pr-10 py-2.5 text-xs uppercase tracking-[0.15em] text-white placeholder:text-white/30 focus:outline-none focus:border-white/40 transition-colors"
            />
            {query && (
              <button
                type="button"
                onClick={() => setQuery('')}
                aria-label="Limpar busca"
                className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>
      )}

      {!showFilters && (showVersionFilter || showSearch) && (
        <div className="px-6 md:px-8 py-2 text-right text-[10px] text-white/30 uppercase tracking-[0.2em] font-bold border-b border-[#1a1a1a]">
          {filtered.length} {filtered.length === 1 ? 'item' : 'itens'}
        </div>
      )}

      {filtered.length === 0 ? (
        <div className="py-32 text-center text-xs text-white/30 uppercase tracking-[0.2em]">
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
