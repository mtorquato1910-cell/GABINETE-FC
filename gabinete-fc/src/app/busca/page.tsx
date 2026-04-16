import type { Metadata } from 'next'
import { Navbar } from '@/components/layout/Navbar'
import { Footer } from '@/components/layout/Footer'
import { ProductGrid } from '@/components/product/ProductGrid'
import { searchProductsDb } from '@/lib/actions/products'
import { SearchForm } from '@/components/shared/SearchForm'

export const metadata: Metadata = {
  title: 'Busca | Gabinete FC',
}

interface Props {
  searchParams: Promise<{ q?: string }>
}

export default async function BuscaPage({ searchParams }: Props) {
  const { q } = await searchParams
  const products = q ? await searchProductsDb(q) : []

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1">
        <div className="px-4 md:px-6 py-8 border-b border-border">
          <h1 className="text-3xl font-bold tracking-tighter uppercase mb-6">Buscar</h1>
          <SearchForm initialQuery={q} />
          {q && (
            <p className="text-muted-foreground text-sm mt-4">
              {products.length} resultado{products.length !== 1 ? 's' : ''} para "{q}"
            </p>
          )}
        </div>
        {products.length > 0 && <ProductGrid products={products} showFilters={false} />}
        {q && products.length === 0 && (
          <div className="py-24 text-center">
            <p className="text-muted-foreground text-xs uppercase tracking-widest">
              Nenhum produto encontrado para "{q}"
            </p>
          </div>
        )}
      </main>
      <Footer />
    </div>
  )
}
