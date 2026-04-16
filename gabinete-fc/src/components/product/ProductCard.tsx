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
      description: `${product.name} (${selectedSize})`,
    })
  }

  const isOutOfStock = product.stock === 0

  return (
    <article className="group bg-background flex flex-col relative border-r border-b border-border last:border-r-0">
      {/* Badge */}
      {product.badge && (
        <div className="absolute top-3 left-3 z-10 bg-primary text-primary-foreground text-[10px] font-bold px-2 py-1 uppercase tracking-wider">
          {product.badge}
        </div>
      )}

      {/* Image */}
      <Link
        href={`/produto/${product.slug}`}
        className="relative aspect-[4/5] bg-secondary overflow-hidden block p-6"
      >
        <Image
          src={product.images[0] || '/images/products/placeholder-jersey.svg'}
          alt={product.name}
          fill
          className="object-cover product-img grayscale group-hover:grayscale-0 transition-all duration-300"
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
        />
        {isOutOfStock && (
          <div className="absolute inset-0 bg-background/70 flex items-center justify-center">
            <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
              Esgotado
            </span>
          </div>
        )}
      </Link>

      {/* Info */}
      <div className="p-4 md:p-5 flex flex-col gap-3 flex-grow">
        <div>
          <h3 className="text-sm font-bold uppercase tracking-wide group-hover:text-primary transition-colors">
            {product.name}
          </h3>
          <p className="text-[10px] text-muted-foreground uppercase tracking-widest mt-0.5">
            {product.team}
          </p>
        </div>

        {/* Sizes */}
        {!isOutOfStock && (
          <div className="flex gap-1.5 flex-wrap">
            {product.sizesAvailable.map((size) => (
              <button
                key={size}
                onClick={() => setSelectedSize(size)}
                className={`w-8 h-8 text-[10px] font-bold uppercase transition-colors ${
                  selectedSize === size
                    ? 'bg-foreground text-background'
                    : 'border border-border text-muted-foreground hover:border-foreground hover:text-foreground'
                }`}
              >
                {size}
              </button>
            ))}
          </div>
        )}

        {/* Price + CTA */}
        <div className="flex justify-between items-end mt-auto">
          <div className="flex items-baseline gap-2">
            {product.originalPrice && (
              <span className="text-xs text-muted-foreground line-through">
                R$ {product.originalPrice.toFixed(2)}
              </span>
            )}
            <span className="text-lg font-bold">
              R$ {product.price.toFixed(2)}
            </span>
          </div>
          {!isOutOfStock && (
            <button
              onClick={handleAdd}
              className="text-[10px] font-bold uppercase tracking-wider border-b border-transparent group-hover:border-primary group-hover:text-primary transition-all"
            >
              + Adicionar
            </button>
          )}
        </div>
      </div>
    </article>
  )
}
