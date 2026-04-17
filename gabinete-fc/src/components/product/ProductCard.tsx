'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { toast } from 'sonner'
import { useCartStore } from '@/stores/cart-store'
import type { Product } from '@/types'

interface ProductCardProps {
  product: Product
}

const BADGE_COLORS: Record<string, string> = {
  'Lançamento':     'bg-primary text-primary-foreground',
  'Novo':           'bg-primary text-primary-foreground',
  'Esgotando':      'bg-primary text-primary-foreground',
  'Exclusivo':      'bg-primary text-primary-foreground',
  'Limitado':       'bg-primary text-primary-foreground',
  'Promo':          'bg-primary text-primary-foreground',
  'Sale':           'bg-primary text-primary-foreground',
  'Top Venda':      'bg-primary text-primary-foreground',
  'Colecionador':   'bg-white/10 text-white border border-white/20',
  'Edição Especial':'bg-white/10 text-white border border-white/20',
  'Raro':           'bg-white/10 text-white border border-white/20',
}

export function ProductCard({ product }: ProductCardProps) {
  const addItem = useCartStore((s) => s.addItem)
  const [selectedSize, setSelectedSize] = useState(
    product.sizesAvailable[1] || product.sizesAvailable[0]
  )

  const handleAdd = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (!selectedSize) return
    addItem(product, selectedSize)
    toast.success('Adicionado ao carrinho', {
      description: `${product.name} — ${selectedSize}`,
    })
  }

  const isOutOfStock = product.stock === 0
  const badgeClass = product.badge
    ? (BADGE_COLORS[product.badge] ?? 'bg-primary text-primary-foreground')
    : ''

  return (
    <article className="group bg-[#0d0d0d] flex flex-col relative border-r border-b border-[#1a1a1a] last:border-r-0 overflow-hidden">

      {/* Badge */}
      {product.badge && (
        <div className={`absolute top-3 left-3 z-10 text-[10px] font-bold px-2.5 py-1 uppercase tracking-wider ${badgeClass}`}>
          {product.badge}
        </div>
      )}

      {/* Esgotado overlay */}
      {isOutOfStock && (
        <div className="absolute inset-0 z-20 bg-black/60 flex items-center justify-center pointer-events-none">
          <span className="text-[10px] font-bold uppercase tracking-widest text-white/50 border border-white/20 px-3 py-1">
            Esgotado
          </span>
        </div>
      )}

      {/* Image */}
      <Link
        href={`/produto/${product.slug}`}
        className="relative aspect-[3/4] bg-[#111] overflow-hidden block"
      >
        {/* Glow sutil no centro */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_55%,rgba(255,255,255,0.05)_0%,transparent_65%)]" />
        <Image
          src={product.images[0] || '/images/products/placeholder-jersey.svg'}
          alt={product.name}
          fill
          className="product-img object-contain p-8"
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
        />
      </Link>

      {/* Info */}
      <div className="p-4 md:p-5 flex flex-col gap-3 flex-grow border-t border-[#1a1a1a]">
        <div>
          <h3 className="text-xs font-bold uppercase tracking-wide leading-snug group-hover:text-primary transition-colors duration-200">
            {product.name}
          </h3>
          <p className="text-[10px] text-muted-foreground uppercase tracking-widest mt-1">
            {product.team}
          </p>
        </div>

        {/* Sizes */}
        {!isOutOfStock && product.sizesAvailable.length > 0 && (
          <div className="flex gap-1 flex-wrap">
            {product.sizesAvailable.map((size) => (
              <button
                key={size}
                onClick={() => setSelectedSize(size)}
                className={`min-w-[28px] h-7 px-1.5 text-[9px] font-bold uppercase transition-all duration-150 ${
                  selectedSize === size
                    ? 'bg-foreground text-background'
                    : 'border border-[#2a2a2a] text-muted-foreground hover:border-white/40 hover:text-foreground'
                }`}
              >
                {size}
              </button>
            ))}
          </div>
        )}

        {/* Price + CTA */}
        <div className="flex justify-between items-end mt-auto pt-1">
          <div className="flex flex-col">
            {product.originalPrice && (
              <span className="text-[10px] text-muted-foreground/50 line-through leading-none mb-0.5">
                R$ {product.originalPrice.toFixed(2)}
              </span>
            )}
            <span className="text-base font-bold leading-none">
              R$ {product.price.toFixed(2)}
            </span>
          </div>

          {!isOutOfStock && (
            <button
              onClick={handleAdd}
              className="text-[10px] font-bold uppercase tracking-widest px-3 py-2 border border-[#2a2a2a] text-muted-foreground hover:border-primary hover:text-primary hover:bg-primary/5 transition-all duration-200"
            >
              + Add
            </button>
          )}
        </div>
      </div>
    </article>
  )
}
