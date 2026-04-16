# Story 005 — Mock Data, Tipos e Utilitários Base

**Epic:** EPIC-01 (Infraestrutura)
**Sprint:** Sprint 1
**Referência:** US-01.4 (complementar) + US-A.1 (adaptado)
**Agente:** @dev
**SP:** 5
**Status:** [x] Concluído — 2026-04-16

---

## Objetivo

Criar os tipos TypeScript de negócio, funções utilitárias (formatação de moeda, CEP, CPF) e dados mock estáticos que serão usados até o Sprint 2 quando as páginas forem construídas. Os dados mock ficam em `src/data/` e são substituídos por queries Prisma nos sprints seguintes.

---

## Tarefas

- [ ] 1. Criar tipos TypeScript de negócio (`src/types/index.ts`)
- [ ] 2. Criar funções de formatação (`src/lib/formatters.ts`)
- [ ] 3. Criar dados mock de produtos (`src/data/products.ts`)
- [ ] 4. Criar store do carrinho com Zustand (`src/stores/cart-store.ts`)
- [ ] 5. Criar helpers de preço (Pix, parcelamento)

---

## Implementação

### 1. Tipos TypeScript — src/types/index.ts

```typescript
// src/types/index.ts

// ─── PRODUTO ──────────────────────────────────────────
export type ProductCategory =
  | 'selecoes'
  | 'clubes-europeus'
  | 'clubes-brasileiros'
  | 'retro'
  | 'especial'

export type ProductType = 'titular' | 'reserva' | 'terceiro' | 'goleiro'

export type ProductSize = 'P' | 'M' | 'G' | 'GG' | 'XG' | '2XL' | '3XL' | '4XL'

export interface Product {
  id: string
  name: string
  slug: string
  description?: string
  price: number
  category: ProductCategory
  team: string
  type: ProductType
  sizesAvailable: ProductSize[]
  images: string[]
  isActive: boolean
  isFeatured: boolean
  metaTitle?: string
  metaDescription?: string
  createdAt: Date
  updatedAt: Date
  // Campos privados (apenas admin)
  costPrice?: number
  supplierCode?: string
}

// ─── CARRINHO ─────────────────────────────────────────
export interface CartItem {
  productId: string
  productName: string
  productImage: string
  productSlug: string
  size: ProductSize
  quantity: number
  unitPrice: number
}

// ─── ENDEREÇO ─────────────────────────────────────────
export interface Address {
  id: string
  userId: string
  label: string
  recipientName: string
  street: string
  number: string
  complement?: string
  neighborhood: string
  city: string
  state: string
  zipCode: string
  isDefault: boolean
}

// ─── PEDIDO ───────────────────────────────────────────
export type OrderStatus =
  | 'pending'
  | 'confirmed'
  | 'processing'
  | 'shipped'
  | 'delivered'
  | 'cancelled'
  | 'refunded'

export type PaymentMethod = 'credit_card' | 'debit_card' | 'pix'
export type PaymentStatus = 'pending' | 'paid' | 'failed' | 'refunded'

export interface OrderItem {
  id: string
  productId: string
  productName: string
  productImage: string
  size: string
  quantity: number
  unitPrice: number
  totalPrice: number
}

export interface Order {
  id: string
  userId: string
  status: OrderStatus
  subtotal: number
  freightCost: number
  discountAmount: number
  total: number
  paymentMethod: PaymentMethod
  paymentStatus: PaymentStatus
  trackingCode?: string
  carrier?: string
  items: OrderItem[]
  createdAt: Date
  updatedAt: Date
}

// ─── CHECKOUT ─────────────────────────────────────────
export interface CheckoutData {
  addressId: string
  freightOption: FreightOption
  paymentMethod: PaymentMethod
  couponCode?: string
  installments?: number
}

export interface FreightOption {
  code: string
  name: string
  price: number
  daysMin: number
  daysMax: number
}

// ─── USUÁRIO ──────────────────────────────────────────
export type UserRole = 'customer' | 'admin'

export interface UserProfile {
  id: string
  email: string
  name?: string
  phone?: string
  cpf?: string
  role: UserRole
  isVip: boolean
  image?: string
  createdAt: Date
}

// ─── REVIEW ───────────────────────────────────────────
export type ReviewStatus = 'pending' | 'approved' | 'rejected'

export interface Review {
  id: string
  userId: string
  productId: string
  orderId?: string
  rating: number
  title?: string
  body?: string
  photos: string[]
  status: ReviewStatus
  adminResponse?: string
  createdAt: Date
}

// ─── CONFIGURAÇÕES ────────────────────────────────────
export interface StoreSettings {
  storeName: string
  storeEmail: string
  whatsapp: string
  pixDiscountPercent: number
  pixExpiryMinutes: number
  stripe3dsThreshold: number
  metaPixelId?: string
  metaBmId?: string
  returnAddress?: string
  freightOriginCep: string
}
```

### 2. Formatadores — src/lib/formatters.ts

```typescript
// src/lib/formatters.ts

/**
 * Formata valor para moeda brasileira (BRL)
 * Ex: 199.90 → "R$ 199,90"
 */
export function formatBRL(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value)
}

/**
 * Formata data para pt-BR
 * Ex: new Date('2024-04-16') → "16 de abril de 2024"
 */
export function formatDate(date: Date | string, opts?: Intl.DateTimeFormatOptions): string {
  return new Intl.DateTimeFormat('pt-BR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    ...opts,
  }).format(new Date(date))
}

/**
 * Formata CEP: "01310100" → "01310-100"
 */
export function formatCEP(cep: string): string {
  return cep.replace(/^(\d{5})(\d{3})$/, '$1-$2')
}

/**
 * Formata CPF: "12345678901" → "123.456.789-01"
 */
export function formatCPF(cpf: string): string {
  return cpf
    .replace(/\D/g, '')
    .replace(/^(\d{3})(\d{3})(\d{3})(\d{2})$/, '$1.$2.$3-$4')
}

/**
 * Formata telefone: "11999999999" → "(11) 99999-9999"
 */
export function formatPhone(phone: string): string {
  const digits = phone.replace(/\D/g, '')
  if (digits.length === 11) {
    return digits.replace(/^(\d{2})(\d{5})(\d{4})$/, '($1) $2-$3')
  }
  return digits.replace(/^(\d{2})(\d{4})(\d{4})$/, '($1) $2-$3')
}

/**
 * Gera slug a partir de texto
 * Ex: "Camisa Brasil 2024 Titular" → "camisa-brasil-2024-titular"
 */
export function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
}

/**
 * Trunca texto com reticências
 */
export function truncate(text: string, length: number): string {
  if (text.length <= length) return text
  return text.slice(0, length).trimEnd() + '...'
}

/**
 * Retorna "há X tempo" relativo
 */
export function timeAgo(date: Date | string): string {
  const seconds = Math.floor((Date.now() - new Date(date).getTime()) / 1000)

  if (seconds < 60) return 'agora mesmo'
  if (seconds < 3600) return `há ${Math.floor(seconds / 60)} min`
  if (seconds < 86400) return `há ${Math.floor(seconds / 3600)}h`
  if (seconds < 604800) return `há ${Math.floor(seconds / 86400)} dias`

  return formatDate(date)
}
```

### 3. Helpers de Preço — src/lib/pricing.ts

```typescript
// src/lib/pricing.ts
import type { CartItem } from '@/types'

/**
 * Calcula desconto Pix
 */
export function calcularDescontoPix(valor: number, percentual: number = 5): number {
  return Math.round(valor * (1 - percentual / 100) * 100) / 100
}

/**
 * Calcula parcelamento sem juros
 * Retorna array com opções de 1 a maxParcelas
 */
export function calcularParcelamento(
  valor: number,
  maxParcelas: number = 12,
  minParcela: number = 20
) {
  const parcelas = []
  for (let i = 1; i <= maxParcelas; i++) {
    const valorParcela = Math.round((valor / i) * 100) / 100
    if (valorParcela >= minParcela) {
      parcelas.push({
        installments: i,
        value: valorParcela,
        total: valor,
        label: i === 1 ? `${formatBRL(valor)} à vista` : `${i}x de ${formatBRL(valorParcela)} sem juros`,
      })
    }
  }
  return parcelas
}

function formatBRL(value: number) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value)
}

/**
 * Calcula total do carrinho
 */
export function calcularTotalCarrinho(items: CartItem[]): number {
  return items.reduce((total, item) => total + item.unitPrice * item.quantity, 0)
}

/**
 * Aplica desconto de cupom
 */
export function aplicarCupom(
  subtotal: number,
  coupon: { type: 'percent' | 'fixed'; value: number }
): number {
  if (coupon.type === 'percent') {
    return Math.max(0, subtotal * (1 - coupon.value / 100))
  }
  return Math.max(0, subtotal - coupon.value)
}
```

### 4. Dados Mock — src/data/products.ts

```typescript
// src/data/products.ts
// Dados mock usados até o Sprint 2/3 quando as páginas conectam ao banco real
import type { Product } from '@/types'

export const mockProducts: Product[] = [
  {
    id: 'prod_1',
    name: 'Camisa Brasil I 2024',
    slug: 'camisa-brasil-2024-titular',
    description: 'Camisa oficial da Seleção Brasileira. Tecido dry-fit de alta qualidade, idêntica à usada pelos jogadores em campo.',
    price: 249.90,
    category: 'selecoes',
    team: 'Brasil',
    type: 'titular',
    sizesAvailable: ['P', 'M', 'G', 'GG', 'XG', '2XL'],
    images: ['/images/products/placeholder.jpg'],
    isActive: true,
    isFeatured: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: 'prod_2',
    name: 'Camisa Argentina I 2024',
    slug: 'camisa-argentina-2024-titular',
    description: 'A camisa da Campeã do Mundo. Listras azul e branca icônicas.',
    price: 249.90,
    category: 'selecoes',
    team: 'Argentina',
    type: 'titular',
    sizesAvailable: ['P', 'M', 'G', 'GG', 'XG'],
    images: ['/images/products/placeholder.jpg'],
    isActive: true,
    isFeatured: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: 'prod_3',
    name: 'Camisa Real Madrid I 2024/25',
    slug: 'camisa-real-madrid-2024-titular',
    description: 'Camisa do maior clube do mundo. Branco clássico com detalhes em dourado.',
    price: 229.90,
    category: 'clubes-europeus',
    team: 'Real Madrid',
    type: 'titular',
    sizesAvailable: ['P', 'M', 'G', 'GG', 'XG', '2XL', '3XL'],
    images: ['/images/products/placeholder.jpg'],
    isActive: true,
    isFeatured: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: 'prod_4',
    name: 'Camisa Barcelona I 2024/25',
    slug: 'camisa-barcelona-2024-titular',
    description: 'As listras azul e grená do Barça em alta qualidade.',
    price: 229.90,
    category: 'clubes-europeus',
    team: 'Barcelona',
    type: 'titular',
    sizesAvailable: ['P', 'M', 'G', 'GG', 'XG'],
    images: ['/images/products/placeholder.jpg'],
    isActive: true,
    isFeatured: false,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: 'prod_5',
    name: 'Camisa Flamengo I 2024',
    slug: 'camisa-flamengo-2024-titular',
    description: 'O manto sagrado do Mengão. Rubro-negro raça e amor.',
    price: 199.90,
    category: 'clubes-brasileiros',
    team: 'Flamengo',
    type: 'titular',
    sizesAvailable: ['P', 'M', 'G', 'GG', 'XG', '2XL'],
    images: ['/images/products/placeholder.jpg'],
    isActive: true,
    isFeatured: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: 'prod_6',
    name: 'Camisa Brasil Retrô 1970',
    slug: 'camisa-brasil-retro-1970',
    description: 'A camisa da Copa do Mundo de 1970. Pelé eterno.',
    price: 219.90,
    category: 'retro',
    team: 'Brasil',
    type: 'titular',
    sizesAvailable: ['P', 'M', 'G', 'GG'],
    images: ['/images/products/placeholder.jpg'],
    isActive: true,
    isFeatured: false,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
]

export const featuredProducts = mockProducts.filter(p => p.isFeatured)
export const productsByCategory = (cat: string) => mockProducts.filter(p => p.category === cat)
```

### 5. Store do Carrinho — src/stores/cart-store.ts

```typescript
// src/stores/cart-store.ts
'use client'

import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { CartItem, ProductSize } from '@/types'

interface CartStore {
  items: CartItem[]
  isOpen: boolean

  // Actions
  addItem: (item: Omit<CartItem, 'quantity'>) => void
  removeItem: (productId: string, size: string) => void
  updateQuantity: (productId: string, size: string, quantity: number) => void
  clearCart: () => void
  openCart: () => void
  closeCart: () => void

  // Computed
  itemCount: number
  subtotal: number
}

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],
      isOpen: false,

      addItem: (newItem) => {
        set((state) => {
          const existing = state.items.find(
            (i) => i.productId === newItem.productId && i.size === newItem.size
          )

          if (existing) {
            return {
              items: state.items.map((i) =>
                i.productId === newItem.productId && i.size === newItem.size
                  ? { ...i, quantity: i.quantity + 1 }
                  : i
              ),
              isOpen: true,
            }
          }

          return {
            items: [...state.items, { ...newItem, quantity: 1 }],
            isOpen: true,
          }
        })
      },

      removeItem: (productId, size) => {
        set((state) => ({
          items: state.items.filter(
            (i) => !(i.productId === productId && i.size === size)
          ),
        }))
      },

      updateQuantity: (productId, size, quantity) => {
        if (quantity <= 0) {
          get().removeItem(productId, size)
          return
        }
        set((state) => ({
          items: state.items.map((i) =>
            i.productId === productId && i.size === size
              ? { ...i, quantity }
              : i
          ),
        }))
      },

      clearCart: () => set({ items: [] }),
      openCart: () => set({ isOpen: true }),
      closeCart: () => set({ isOpen: false }),

      get itemCount() {
        return get().items.reduce((sum, i) => sum + i.quantity, 0)
      },

      get subtotal() {
        return get().items.reduce((sum, i) => sum + i.unitPrice * i.quantity, 0)
      },
    }),
    {
      name: 'gabinete-fc-cart',
      version: 1,
    }
  )
)
```

---

## Critérios de Aceitação

- [ ] `import type { Product } from '@/types'` funciona sem erro de TypeScript
- [ ] `formatBRL(249.90)` retorna `"R$ 249,90"`
- [ ] `calcularDescontoPix(249.90)` retorna `237.41` (5% off)
- [ ] `calcularParcelamento(249.90, 12)` retorna 12 opções com valores corretos
- [ ] `slugify("Camisa Brasil I 2024")` retorna `"camisa-brasil-i-2024"`
- [ ] `useCartStore` adiciona item, persiste no localStorage, reflete no `itemCount`
- [ ] Mock data exporta 6 produtos com todos os campos tipados
- [ ] `npm run typecheck` passa sem erros

---

## Arquivos criados/modificados

- [ ] `src/types/index.ts`
- [ ] `src/lib/formatters.ts`
- [ ] `src/lib/pricing.ts`
- [ ] `src/data/products.ts`
- [ ] `src/stores/cart-store.ts`
- [ ] `public/images/products/placeholder.jpg` (imagem temporária 400x500px)

---

*Story 005 | Sprint 1 | Gabinete FC*
