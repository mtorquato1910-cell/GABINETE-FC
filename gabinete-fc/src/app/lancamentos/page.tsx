import type { Metadata } from 'next'
import { Navbar } from '@/components/layout/Navbar'
import { Footer } from '@/components/layout/Footer'
import { ProductGrid } from '@/components/product/ProductGrid'
import { prisma } from '@/lib/db'
import { mapProductFromDb } from '@/lib/db-helpers'

export const metadata: Metadata = {
  title: 'Lançamentos | Gabinete FC',
  description: 'Os últimos lançamentos de camisas de futebol.',
}

export const revalidate = 3600

export default async function LancamentosPage() {
  const products = await prisma.product.findMany({
    where: { isActive: true, badge: 'Lançamento' },
    orderBy: { createdAt: 'desc' },
  })
  const mapped = products.map(p => mapProductFromDb(p))

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1">
        <div className="px-4 md:px-6 py-8 border-b border-border flex items-end gap-4">
          <div>
            <p className="text-[10px] text-primary uppercase tracking-widest mb-1">New</p>
            <h1 className="text-3xl md:text-5xl font-bold tracking-tighter uppercase">Lançamentos</h1>
          </div>
        </div>
        {mapped.length === 0 ? (
          <div className="py-24 text-center">
            <p className="text-muted-foreground text-xs uppercase tracking-widest">Em breve novidades.</p>
          </div>
        ) : (
          <ProductGrid products={mapped} showFilters={false} showSearch searchPlaceholder="Pesquisar em lançamentos…" />
        )}
      </main>
      <Footer />
    </div>
  )
}
