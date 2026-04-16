import type { Metadata } from 'next'
import { Navbar } from '@/components/layout/Navbar'
import { Footer } from '@/components/layout/Footer'
import { ProductGrid } from '@/components/product/ProductGrid'
import { getActiveProducts } from '@/lib/actions/products'

export const metadata: Metadata = {
  title: 'Loja | Gabinete FC',
  description: 'Todas as camisas de futebol premium. Seleções e clubes do mundo todo.',
}

export const revalidate = 3600

export default async function LojaPage() {
  const products = await getActiveProducts()

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
        <ProductGrid products={products} showFilters />
      </main>
      <Footer />
    </div>
  )
}
