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

  return (
    <article className="product-card group flex flex-col relative overflow-hidden">

      {/* Badge — mínimo e elegante */}
      {product.badge && (
        <div className="absolute top-4 left-4 z-10 text-[9px] font-bold px-2 py-0.5 uppercase tracking-[0.15em] bg-black/80 text-white/70 border border-white/10">
          {product.badge}
        </div>
      )}

      {/* Esgotado overlay */}
      {isOutOfStock && (
        <div className="absolute inset-0 z-20 bg-black/70 flex items-center justify-center pointer-events-none">
          <span className="text-[9px] font-bold uppercase tracking-[0.2em] text-white/40 border border-white/10 px-3 py-1">
            Esgotado
          </span>
        </div>
      )}

      {/* Image — camisa "flutuando" */}
      <Link
        href={`/produto/${product.slug}`}
        className="relative aspect-[4/5] bg-[#0a0a0a] overflow-hidden block"
      >
        {/* Radial glow center */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_60%,rgba(255,255,255,0.04)_0%,transparent_70%)]" />
        <Image
          src={product.images[0] || '/images/products/placeholder-jersey.svg'}
          alt={product.name}
          fill
          className="product-img object-contain p-10 lg:p-12"
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
        />
      </Link>

      {/* Info */}
      <div className="px-5 py-5 flex flex-col gap-4 flex-grow bg-[#0a0a0a] group-hover:bg-[#121212] transition-colors duration-300">
        <div>
          <Link href={`/produto/${product.slug}`}>
            <h3 className="text-[11px] font-bold uppercase tracking-wide leading-snug text-white/90 hover:text-white transition-colors duration-200">
              {product.name}
            </h3>
          </Link>
          <p className="text-[10px] text-white/40 uppercase tracking-[0.15em] mt-1 font-medium">
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
                className={`min-w-[30px] h-7 px-1.5 text-[9px] font-bold uppercase transition-all duration-150 ${
                  selectedSize === size
                    ? 'bg-white text-black'
                    : 'border border-white/10 text-white/40 hover:border-white/30 hover:text-white/70'
                }`}
              >
                {size}
              </button>
            ))}
          </div>
        )}

        {/* Price + CTA */}
        <div className="flex justify-between items-end mt-auto">
          <div className="flex flex-col">
            {product.originalPrice && (
              <span className="text-[9px] text-white/25 line-through leading-none mb-1">
                R$ {product.originalPrice.toFixed(2)}
              </span>
            )}
            <span className="text-base font-bold leading-none text-white">
              R$ {product.price.toFixed(2)}
            </span>
          </div>

          {!isOutOfStock && (
            <button
              onClick={handleAdd}
              className="text-[9px] font-bold uppercase tracking-[0.15em] px-4 py-2.5 border border-white/15 text-white/50 hover:border-white/40 hover:text-white hover:bg-white/5 transition-all duration-200"
            >
              + Add
            </button>
          )}
        </div>
      </div>
    </article>
  )
}
