// ============================================================
// GABINETE FC — Core Types
// ============================================================

export type ProductStatus = 'active' | 'draft' | 'out_of_stock' | 'archived'
export type OrderStatus =
  | 'pending'
  | 'confirmed'
  | 'processing'
  | 'shipped'
  | 'delivered'
  | 'cancelled'
  | 'refunded'
export type PaymentStatus = 'pending' | 'paid' | 'failed' | 'refunded'
export type PaymentMethod = 'credit_card' | 'debit_card' | 'pix' | 'boleto'
export type UserRole = 'customer' | 'admin'

// ----------------------------------------------------------------
// Product
// ----------------------------------------------------------------

export interface Product {
  id: string
  name: string
  slug: string
  description: string
  team: string
  category: string
  badge?: string | null
  price: number
  originalPrice?: number | null
  images: string[]
  sizesAvailable: string[]
  stock: number
  status: ProductStatus
  featured: boolean
  createdAt: Date
  updatedAt: Date
}

// ----------------------------------------------------------------
// Cart
// ----------------------------------------------------------------

export interface CartItem {
  product: Product
  size: string
  quantity: number
}

export interface Cart {
  items: CartItem[]
}

// ----------------------------------------------------------------
// User / Auth
// ----------------------------------------------------------------

export interface User {
  id: string
  name?: string | null
  email: string
  role: UserRole
  image?: string | null
  createdAt: Date
}

// ----------------------------------------------------------------
// Address
// ----------------------------------------------------------------

export interface Address {
  id: string
  userId: string
  label: string
  recipientName?: string
  recipientCpf?: string
  recipientPhone?: string
  zipCode: string
  street: string
  number: string
  complement?: string | null
  neighborhood: string
  city: string
  state: string
  isDefault: boolean
}

// ----------------------------------------------------------------
// Order
// ----------------------------------------------------------------

export interface OrderItem {
  id: string
  productId: string
  productName: string
  size: string
  quantity: number
  unitPrice: number
  totalPrice: number
}

export interface Order {
  id: string
  userId: string
  status: OrderStatus
  paymentStatus: PaymentStatus
  paymentMethod: PaymentMethod
  items: OrderItem[]
  subtotal: number
  shippingCost: number
  discount: number
  total: number
  addressId?: string | null
  trackingCode?: string | null
  notes?: string | null
  createdAt: Date
  updatedAt: Date
}

// ----------------------------------------------------------------
// Category
// ----------------------------------------------------------------

export interface Category {
  id: string
  label: string
  slug: string
}

// ----------------------------------------------------------------
// Store Settings
// ----------------------------------------------------------------

export interface StoreSetting {
  key: string
  value: string
  category: string
}
