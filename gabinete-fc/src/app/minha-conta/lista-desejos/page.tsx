import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { mapProductFromDb } from '@/lib/db-helpers'
import { ProductGrid } from '@/components/product/ProductGrid'

export default async function ListaDesejosPage() {
  const session = await auth()
  const userId = (session?.user as { id?: string })?.id

  const wishlists = userId
    ? await prisma.wishlist.findMany({
        where: { userId },
        include: { product: true },
        orderBy: { createdAt: 'desc' },
      })
    : []

  const products = wishlists
    .filter((w) => w.product.isActive)
    .map((w) => mapProductFromDb(w.product))

  return (
    <div>
      <h2 className="text-xs font-bold uppercase tracking-widest mb-6 border-b border-border pb-4">
        Lista de Desejos ({products.length})
      </h2>
      {products.length === 0 ? (
        <p className="text-muted-foreground text-xs uppercase tracking-widest">
          Sua lista de desejos está vazia.
        </p>
      ) : (
        <ProductGrid products={products} showFilters={false} />
      )}
    </div>
  )
}
