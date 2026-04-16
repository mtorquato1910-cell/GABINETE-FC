import type { Metadata } from 'next'
import { Navbar } from '@/components/layout/Navbar'
import { Footer } from '@/components/layout/Footer'
import { ProductGrid } from '@/components/product/ProductGrid'
import { prisma } from '@/lib/db'
import { mapProductFromDb } from '@/lib/db-helpers'

export const metadata: Metadata = {
  title: 'Promoções | Gabinete FC',
  description: 'Camisas de futebol com os melhores preços.',
}

export const revalidate = 3600

export default async function PromocoesPage() {
  const products = await prisma.product.findMany({
    where: { isActive: true, badge: { in: ['Promo', 'Promoção', 'Sale'] } },
    orderBy: { price: 'asc' },
  })
  const mapped = products.map(p => mapProductFromDb(p))

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1">
        <div className="px-4 md:px-6 py-8 border-b border-border bg-primary/5">
          <p className="text-[10px] text-primary uppercase tracking-widest mb-1">Sale</p>
          <h1 className="text-3xl md:text-5xl font-bold tracking-tighter uppercase">Promoções</h1>
          <p className="text-muted-foreground text-sm mt-2">Ofertas por tempo limitado.</p>
        </div>
        {mapped.length === 0 ? (
          <div className="py-24 text-center">
            <p className="text-muted-foreground text-xs uppercase tracking-widest">Nenhuma promoção ativa no momento.</p>
          </div>
        ) : (
          <ProductGrid products={mapped} showFilters={false} />
        )}
      </main>
      <Footer />
    </div>
  )
}
