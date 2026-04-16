import type { Metadata } from 'next'
import { Navbar } from '@/components/layout/Navbar'
import { Footer } from '@/components/layout/Footer'
import { ProductGrid } from '@/components/product/ProductGrid'
import { mockProducts } from '@/data/products'

export const metadata: Metadata = {
  title: 'Loja',
  description: 'Todas as camisas de futebol premium. Seleções e clubes do mundo todo.',
}

export default function LojaPage() {
  const activeProducts = mockProducts.filter((p) => p.status === 'active')

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1">
        <div className="px-4 md:px-6 py-8 border-b border-border">
          <h1 className="text-3xl md:text-5xl font-bold tracking-tighter uppercase">Camisas</h1>
          <p className="text-muted-foreground text-sm mt-2">
            Autênticas. Importadas. Entrega para todo o Brasil.
          </p>
        </div>
        <ProductGrid products={activeProducts} showFilters />
      </main>
      <Footer />
    </div>
  )
}
