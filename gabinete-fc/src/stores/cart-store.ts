import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { CartItem, Product } from '@/types'

export interface CustomizationInput {
  name: string
  number: string
}

export interface CartLineItem extends CartItem {
  lineId: string
}

interface CartStore {
  items: CartLineItem[]
  addItem: (
    product: Product,
    size: string,
    quantity?: number,
    customization?: CustomizationInput | null
  ) => void
  removeItem: (lineId: string) => void
  updateQuantity: (lineId: string, quantity: number) => void
  clearCart: () => void
  totalItems: () => number
  totalPrice: () => number
}

function makeLineId(): string {
  if (typeof globalThis.crypto?.randomUUID === 'function') {
    return globalThis.crypto.randomUUID()
  }
  return `line_${Date.now()}_${Math.random().toString(36).slice(2)}`
}

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],

      addItem: (product, size, quantity = 1, customization = null) => {
        const hasCustomization = !!customization
        set((state) => {
          if (!hasCustomization) {
            const existing = state.items.find(
              (i) =>
                i.product.id === product.id &&
                i.size === size &&
                !i.hasCustomization
            )
            if (existing) {
              return {
                items: state.items.map((i) =>
                  i.lineId === existing.lineId
                    ? { ...i, quantity: i.quantity + quantity }
                    : i
                ),
              }
            }
          }
          return {
            items: [
              ...state.items,
              {
                lineId: makeLineId(),
                product,
                size,
                quantity,
                hasCustomization,
                customName: customization?.name?.toUpperCase().trim() || undefined,
                customNumber: customization?.number?.trim() || undefined,
              },
            ],
          }
        })
      },

      removeItem: (lineId) => {
        set((state) => ({
          items: state.items.filter((i) => i.lineId !== lineId),
        }))
      },

      updateQuantity: (lineId, quantity) => {
        if (quantity <= 0) {
          get().removeItem(lineId)
          return
        }
        set((state) => ({
          items: state.items.map((i) =>
            i.lineId === lineId ? { ...i, quantity } : i
          ),
        }))
      },

      clearCart: () => set({ items: [] }),

      totalItems: () => get().items.reduce((acc, i) => acc + i.quantity, 0),

      totalPrice: () =>
        get().items.reduce((acc, i) => acc + i.product.price * i.quantity, 0),
    }),
    {
      name: 'gabinete-fc-cart',
      version: 2,
      migrate: (persisted: unknown, version) => {
        if (version < 2 && persisted && typeof persisted === 'object') {
          const state = persisted as { items?: CartItem[] }
          return {
            ...state,
            items: (state.items ?? []).map((i) => ({
              ...i,
              lineId: makeLineId(),
              hasCustomization: i.hasCustomization ?? false,
            })),
          }
        }
        return persisted as CartStore
      },
    }
  )
)
