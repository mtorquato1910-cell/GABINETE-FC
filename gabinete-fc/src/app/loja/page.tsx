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
        <div className="px-4 md:px-8 py-10 border-b border-[#1a1a1a] flex flex-col sm:flex-row sm:items-end justify-between gap-4 bg-[#050505]">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-widest text-primary mb-2">Gabinete FC — Coleção</p>
            <h1
              className="text-[clamp(3rem,8vw,6rem)] font-black leading-[0.9] tracking-tight uppercase text-white"
              style={{ fontFamily: "'Barlow Condensed', 'Space Grotesk', sans-serif", fontWeight: 900 }}
            >
              Todas as<br />Camisas.
            </h1>
          </div>
          <p className="text-muted-foreground text-xs uppercase tracking-widest max-w-[28ch] sm:text-right">
            Importadas.<br />Entrega para todo o Brasil.
          </p>
        </div>
        <ProductGrid products={products} showFilters showSearch />
      </main>
      <Footer />
    </div>
  )
}
