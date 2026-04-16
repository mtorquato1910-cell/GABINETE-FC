import type { Metadata } from 'next'
import { Navbar } from '@/components/layout/Navbar'
import { Footer } from '@/components/layout/Footer'
import { CartClient } from '@/components/cart/CartClient'

export const metadata: Metadata = {
  title: 'Carrinho',
}

export default function CarrinhoPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1">
        <CartClient />
      </main>
      <Footer />
    </div>
  )
}
