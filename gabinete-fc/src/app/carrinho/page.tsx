import type { Metadata } from 'next'
import { Navbar } from '@/components/layout/Navbar'
import { Footer } from '@/components/layout/Footer'
import { CartClient } from '@/components/cart/CartClient'
import { auth } from '@/lib/auth'

export const metadata: Metadata = {
  title: 'Carrinho',
}

export default async function CarrinhoPage() {
  const session = await auth()
  const isLoggedIn = !!session?.user

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1">
        <CartClient isLoggedIn={isLoggedIn} />
      </main>
      <Footer />
    </div>
  )
}
