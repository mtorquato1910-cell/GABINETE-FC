// Google Tag Manager — helpers client-side (GA4 ecommerce spec)
// Container ID lido de NEXT_PUBLIC_GTM_ID. O snippet do container está em layout.tsx.

declare global {
  interface Window {
    dataLayer?: Record<string, unknown>[]
  }
}

export const GTM_ID = process.env.NEXT_PUBLIC_GTM_ID ?? ''

export function pushDataLayer(event: Record<string, unknown>): void {
  if (typeof window === 'undefined') return
  window.dataLayer = window.dataLayer ?? []
  window.dataLayer.push(event)
}

interface GA4Item {
  item_id: string
  item_name: string
  price: number
  quantity: number
  item_variant?: string
}

export const gtmEvents = {
  viewItem: (item: GA4Item) =>
    pushDataLayer({
      event: 'view_item',
      ecommerce: { currency: 'BRL', value: item.price, items: [item] },
    }),

  addToCart: (item: GA4Item) =>
    pushDataLayer({
      event: 'add_to_cart',
      ecommerce: { currency: 'BRL', value: item.price * item.quantity, items: [item] },
    }),

  beginCheckout: (items: GA4Item[], value: number) =>
    pushDataLayer({
      event: 'begin_checkout',
      ecommerce: { currency: 'BRL', value, items },
    }),

  purchase: (params: {
    transactionId: string
    value: number
    items: GA4Item[]
    shipping?: number
    coupon?: string
  }) =>
    pushDataLayer({
      event: 'purchase',
      ecommerce: {
        transaction_id: params.transactionId,
        currency: 'BRL',
        value: params.value,
        shipping: params.shipping ?? 0,
        coupon: params.coupon,
        items: params.items,
      },
    }),
}
