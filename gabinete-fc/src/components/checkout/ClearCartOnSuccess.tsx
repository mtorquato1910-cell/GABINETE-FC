'use client'
import { useEffect } from 'react'
import { useCartStore } from '@/stores/cart-store'
import { clearServerCart } from '@/lib/actions/cart'

/**
 * Limpa carrinho local E carrinho persistido no servidor após
 * pagamento concluído com sucesso.
 */
export function ClearCartOnSuccess() {
  const clearCart = useCartStore((s) => s.clearCart)

  useEffect(() => {
    clearCart()
    void clearServerCart().catch((err) => {
      console.error('[ClearCartOnSuccess] server clear failed:', err)
    })
  }, [clearCart])

  return null
}
