'use client'
import { useEffect } from 'react'
import { useCartStore } from '@/stores/cart-store'
import { clearServerCart } from '@/lib/actions/cart'
import { gtmEvents } from '@/lib/gtm'

interface PurchasePayload {
  transactionId: string
  value: number
  shipping: number
  items: Array<{
    item_id: string
    item_name: string
    price: number
    quantity: number
    item_variant?: string
  }>
}

interface Props {
  purchase?: PurchasePayload
}

/**
 * Limpa carrinho local E carrinho persistido no servidor após
 * pagamento concluído com sucesso. Quando recebe `purchase`,
 * também envia o evento `purchase` (GA4) ao dataLayer — uma única
 * vez por orderId (dedupe via sessionStorage).
 */
export function ClearCartOnSuccess({ purchase }: Props = {}) {
  const clearCart = useCartStore((s) => s.clearCart)

  useEffect(() => {
    clearCart()
    void clearServerCart().catch((err) => {
      console.error('[ClearCartOnSuccess] server clear failed:', err)
    })

    if (purchase) {
      const dedupeKey = `gfc_purchase_fired_${purchase.transactionId}`
      if (typeof window !== 'undefined' && !sessionStorage.getItem(dedupeKey)) {
        sessionStorage.setItem(dedupeKey, '1')
        gtmEvents.purchase(purchase)
      }
    }
  }, [clearCart, purchase])

  return null
}
