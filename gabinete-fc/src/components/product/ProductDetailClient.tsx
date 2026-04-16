'use client'

import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { ArrowLeft, ShoppingCart } from 'lucide-react'
import { toast } from 'sonner'
import { useCartStore } from '@/stores/cart-store'
import { SocialProof } from '@/components/shared/SocialProof'
import { StockAlertButton } from '@/components/product/StockAlertButton'
import type { Product } from '@/types'

interface Props {
  product: Product
}

export function ProductDetailClient({ product }: Props) {
  const addItem = useCartStore((s) => s.addItem)
  const [selectedSize, setSelectedSize] = useState('')

  const handleAdd = () => {
    if (!selectedSize) {
      toast.error('Selecione um tamanho')
      return
    }
    addItem(product, selectedSize)
    toast.success('Adicionado!', {
      description: `${product.name} (${selectedSize}) no carrinho.`,
    })
  }

  return (
    <div>
      {/* Breadcrumb */}
      <div className="px-4 md:px-6 py-4 border-b border-border">
        <Link
          href="/loja"
          className="inline-flex items-center gap-2 text-xs text-muted-foreground hover:text-primary transition-colors uppercase tracking-widest"
        >
          <ArrowLeft className="w-3 h-3" /> Voltar
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 min-h-[calc(100vh-200px)]">
        {/* Image */}
        <div className="bg-secondary p-8 lg:p-16 flex items-center justify-center min-h-[50vh] relative">
          <Image
            src={product.images[0] || '/images/products/placeholder-jersey.svg'}
            alt={product.name}
            width={500}
            height={600}
            className="max-h-[60vh] w-auto object-contain"
            priority
          />
        </div>

        {/* Info */}
        <div className="p-6 lg:p-16 flex flex-col justify-center gap-8 border-l border-border">
          <div>
            {product.badge && (
              <span className="inline-block bg-primary text-primary-foreground text-[10px] font-bold px-3 py-1 uppercase tracking-wider mb-4">
                {product.badge}
              </span>
            )}
            <h1 className="text-3xl md:text-5xl font-bold tracking-tighter uppercase mb-2">
              {product.name}
            </h1>
            <p className="text-xs text-muted-foreground uppercase tracking-widest">
              {product.team}
            </p>
          </div>

          <p className="text-muted-foreground text-sm leading-relaxed normal-case tracking-normal">
            {product.description}
          </p>

          {/* Price */}
          <div className="flex items-baseline gap-3">
            {product.originalPrice && (
              <span className="text-lg text-muted-foreground line-through">
                R$ {product.originalPrice.toFixed(2)}
              </span>
            )}
            <span className="text-3xl font-bold">R$ {product.price.toFixed(2)}</span>
            <span className="text-xs text-primary uppercase tracking-widest">
              ou R$ {(product.price * 0.95).toFixed(2)} no Pix
            </span>
          </div>

          {/* Sizes */}
          <div>
            <p className="text-[10px] uppercase tracking-widest text-muted-foreground mb-3">
              Tamanho{' '}
              {selectedSize && (
                <span className="text-primary ml-2">— Selecionado: {selectedSize}</span>
              )}
            </p>
            <div className="flex gap-2 flex-wrap">
              {product.sizesAvailable.map((size) => (
                <button
                  key={size}
                  onClick={() => setSelectedSize(size)}
                  className={`w-12 h-12 text-xs font-bold uppercase transition-colors ${
                    selectedSize === size
                      ? 'bg-foreground text-background'
                      : 'border border-border text-muted-foreground hover:border-foreground hover:text-foreground'
                  }`}
                >
                  {size}
                </button>
              ))}
            </div>
          </div>

          {/* Social Proof */}
          <SocialProof productId={product.id} />

          {/* CTA */}
          {product.stock > 0 ? (
            <button
              onClick={handleAdd}
              className="w-full flex items-center justify-center gap-3 bg-primary text-primary-foreground py-4 font-bold text-sm uppercase tracking-widest hover:bg-foreground hover:text-background transition-colors"
            >
              <ShoppingCart className="w-4 h-4" />
              Adicionar ao Carrinho
            </button>
          ) : (
            <StockAlertButton productId={product.id} size={selectedSize || 'Único'} />
          )}

          {/* Details */}
          <div className="grid grid-cols-2 gap-4 text-xs uppercase tracking-wider text-muted-foreground border-t border-border pt-6">
            <div>
              <span className="text-foreground font-bold block mb-1">Frete</span>
              Grátis acima de R$ 500
            </div>
            <div>
              <span className="text-foreground font-bold block mb-1">Troca</span>
              Em até 30 dias
            </div>
            <div>
              <span className="text-foreground font-bold block mb-1">Estoque</span>
              {product.stock > 10
                ? 'Disponível'
                : product.stock > 0
                  ? `Últimas ${product.stock} unidades`
                  : 'Esgotado'}
            </div>
            <div>
              <span className="text-foreground font-bold block mb-1">Pagamento</span>
              Pix, Cartão, Boleto
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
