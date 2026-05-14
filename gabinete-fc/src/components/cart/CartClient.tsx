'use client'

import Link from 'next/link'
import Image from 'next/image'
import { Minus, Plus, Trash2 } from 'lucide-react'
import { useCartStore } from '@/stores/cart-store'

export function CartClient() {
  const { items, removeItem, updateQuantity, totalPrice } = useCartStore()

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-32 gap-6">
        <p className="text-xs text-muted-foreground uppercase tracking-widest">
          Seu carrinho está vazio.
        </p>
        <Link
          href="/loja"
          className="px-8 py-4 bg-primary text-primary-foreground font-bold text-xs uppercase tracking-widest hover:bg-foreground hover:text-background transition-colors"
        >
          Ver Camisas
        </Link>
      </div>
    )
  }

  const subtotal = totalPrice()
  const frete = subtotal >= 500 ? 0 : 29.9
  const total = subtotal + frete

  return (
    <div className="max-w-5xl mx-auto">
      <div className="px-4 md:px-6 py-8 border-b border-border">
        <h1 className="text-3xl font-bold tracking-tighter uppercase">
          Carrinho{' '}
          <span className="text-muted-foreground text-lg">
            ({items.length} {items.length === 1 ? 'item' : 'itens'})
          </span>
        </h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-0">
        {/* Items */}
        <div className="lg:col-span-2 border-r border-border">
          {items.map((item) => (
            <div
              key={item.lineId}
              className="flex gap-4 p-4 md:p-6 border-b border-border"
            >
              <div className="relative w-20 h-24 bg-secondary shrink-0">
                <Image
                  src={item.product.images[0] || '/images/products/placeholder-jersey.svg'}
                  alt={item.product.name}
                  fill
                  className="object-cover product-img"
                />
              </div>
              <div className="flex-1 flex flex-col justify-between gap-2">
                <div>
                  <h3 className="text-sm font-bold uppercase tracking-wide">
                    {item.product.name}
                  </h3>
                  <p className="text-[10px] text-muted-foreground uppercase tracking-widest">
                    Tamanho: {item.size}
                  </p>
                  {item.hasCustomization && item.customName && item.customNumber && (
                    <p className="text-[10px] text-primary uppercase tracking-widest mt-1">
                      ⚡ Personalizada · {item.customName} · #{item.customNumber}
                    </p>
                  )}
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => updateQuantity(item.lineId, item.quantity - 1)}
                      disabled={item.hasCustomization && item.quantity === 1}
                      className="w-7 h-7 border border-border flex items-center justify-center hover:border-foreground transition-colors disabled:opacity-40"
                    >
                      <Minus className="w-3 h-3" />
                    </button>
                    <span className="text-sm font-bold w-6 text-center">{item.quantity}</span>
                    <button
                      onClick={() => updateQuantity(item.lineId, item.quantity + 1)}
                      disabled={item.hasCustomization}
                      title={item.hasCustomization ? 'Camisa personalizada — quantidade fixa em 1' : ''}
                      className="w-7 h-7 border border-border flex items-center justify-center hover:border-foreground transition-colors disabled:opacity-40"
                    >
                      <Plus className="w-3 h-3" />
                    </button>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="text-sm font-bold">
                      R$ {(item.product.price * item.quantity).toFixed(2)}
                    </span>
                    <button
                      onClick={() => removeItem(item.lineId)}
                      className="text-muted-foreground hover:text-destructive transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Summary */}
        <div className="p-6 flex flex-col gap-4">
          <h2 className="text-xs font-bold uppercase tracking-widest border-b border-border pb-4">
            Resumo
          </h2>
          <div className="flex justify-between text-xs uppercase tracking-widest">
            <span className="text-muted-foreground">Subtotal</span>
            <span>R$ {subtotal.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-xs uppercase tracking-widest">
            <span className="text-muted-foreground">Frete</span>
            <span>{frete === 0 ? <span className="text-primary">Grátis</span> : `R$ ${frete.toFixed(2)}`}</span>
          </div>
          {frete > 0 && (
            <p className="text-[10px] text-muted-foreground">
              Faltam R$ {(500 - subtotal).toFixed(2)} para frete grátis
            </p>
          )}
          <div className="flex justify-between text-sm font-bold uppercase tracking-widest border-t border-border pt-4">
            <span>Total</span>
            <span>R$ {total.toFixed(2)}</span>
          </div>
          <p className="text-[10px] text-primary uppercase tracking-widest">
            ou R$ {(total * 0.95).toFixed(2)} no Pix (5% off)
          </p>
          <Link
            href="/checkout"
            className="w-full flex items-center justify-center py-4 bg-primary text-primary-foreground font-bold text-xs uppercase tracking-widest hover:bg-foreground hover:text-background transition-colors mt-2"
          >
            Finalizar Compra →
          </Link>
          <Link
            href="/loja"
            className="text-center text-[10px] text-muted-foreground hover:text-primary transition-colors uppercase tracking-widest"
          >
            Continuar comprando
          </Link>
        </div>
      </div>
    </div>
  )
}
