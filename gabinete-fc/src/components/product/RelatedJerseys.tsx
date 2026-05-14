import { prisma } from '@/lib/db'
import { mapProductFromDb } from '@/lib/db-helpers'
import { ProductCard } from './ProductCard'

interface Props {
  productId: string
  category?: string
  team?: string
  limit?: number
}

export async function RelatedJerseys({ productId, category, team, limit = 4 }: Props) {
  const sameCategory = category
    ? await prisma.product.findMany({
        where: {
          isActive: true,
          category,
          NOT: { id: productId },
        },
        orderBy: [{ isFeatured: 'desc' }, { createdAt: 'desc' }],
        take: limit,
      })
    : []

  let pool = sameCategory
  if (pool.length < limit) {
    const fillers = await prisma.product.findMany({
      where: {
        isActive: true,
        NOT: { id: { in: [productId, ...pool.map((p) => p.id)] } },
        ...(team ? { team: { not: team } } : {}),
      },
      orderBy: [{ isFeatured: 'desc' }, { createdAt: 'desc' }],
      take: limit - pool.length,
    })
    pool = [...pool, ...fillers]
  }

  if (pool.length === 0) return null

  const products = pool.map((p) => mapProductFromDb(p, 99))

  return (
    <section className="border-t border-border px-4 md:px-6 py-12 md:py-16">
      <div className="flex items-end justify-between mb-8">
        <div>
          <p className="text-[10px] uppercase tracking-[0.25em] text-muted-foreground mb-2">
            Para combinar com sua escolha
          </p>
          <h2 className="text-2xl md:text-4xl font-bold tracking-tighter uppercase">
            Você também pode gostar
          </h2>
        </div>
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-px bg-[#1a1a1a]">
        {products.map((p) => (
          <ProductCard key={p.id} product={p} />
        ))}
      </div>
    </section>
  )
}
