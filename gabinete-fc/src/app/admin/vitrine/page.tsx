import { prisma } from '@/lib/db'
import { FeaturedToggle } from '@/components/admin/FeaturedToggle'
import { parseJsonField } from '@/lib/db-helpers'
import Image from 'next/image'

export default async function VitrineAdminPage() {
  const [products, topSellers] = await Promise.all([
    // Todos os produtos ativos
    prisma.product.findMany({
      where: { isActive: true },
      orderBy: [{ isFeatured: 'desc' }, { name: 'asc' }],
      select: {
        id: true,
        name: true,
        team: true,
        category: true,
        price: true,
        isFeatured: true,
        badge: true,
        images: true,
      },
    }),
    // Mais vendidos: produtos com mais itens em pedidos pagos
    prisma.orderItem.groupBy({
      by: ['productId'],
      _sum: { quantity: true },
      orderBy: { _sum: { quantity: 'desc' } },
      take: 5,
    }),
  ])

  const topSellerIds = new Set(topSellers.map(t => t.productId))
  const featuredCount = products.filter(p => p.isFeatured).length

  return (
    <div>
      <div className="px-6 py-6 border-b border-border">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-xl font-bold uppercase tracking-widest">Vitrine & Destaques</h1>
            <p className="text-xs text-muted-foreground mt-1 normal-case">
              Controle quais produtos aparecem na página inicial. Destaques ativos: <strong className="text-foreground">{featuredCount}</strong>
            </p>
          </div>
        </div>
      </div>

      <div className="p-6 space-y-6">

        {/* Info */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="border border-border p-4">
            <p className="text-[10px] text-muted-foreground uppercase tracking-widest mb-1">Em destaque (homepage)</p>
            <p className="text-3xl font-bold">{featuredCount}</p>
          </div>
          <div className="border border-border p-4">
            <p className="text-[10px] text-muted-foreground uppercase tracking-widest mb-1">Produtos ativos</p>
            <p className="text-3xl font-bold">{products.length}</p>
          </div>
          <div className="border border-border p-4">
            <p className="text-[10px] text-muted-foreground uppercase tracking-widest mb-1">Mais vendidos (top 5)</p>
            <p className="text-3xl font-bold">{topSellers.length}</p>
          </div>
        </div>

        {/* Mais vendidos */}
        {topSellers.length > 0 && (
          <div className="border border-primary/30 bg-primary/5">
            <div className="px-4 py-3 border-b border-primary/20">
              <h2 className="text-xs font-bold uppercase tracking-widest text-primary">Mais Vendidos (por quantidade)</h2>
            </div>
            <div className="p-3 flex flex-wrap gap-2">
              {topSellers.map((ts) => {
                const prod = products.find(p => p.id === ts.productId)
                if (!prod) return null
                return (
                  <div key={ts.productId} className="border border-border px-3 py-2 flex items-center gap-2 text-xs">
                    <span className="font-bold">{prod.name}</span>
                    <span className="text-muted-foreground">({ts._sum.quantity ?? 0} und.)</span>
                    <FeaturedToggle productId={prod.id} isFeatured={prod.isFeatured} productName={prod.name} />
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Lista de produtos */}
        <div className="border border-border">
          <div className="px-4 py-3 border-b border-border bg-secondary flex justify-between items-center">
            <h2 className="text-xs font-bold uppercase tracking-widest">Todos os Produtos</h2>
            <p className="text-[10px] text-muted-foreground uppercase tracking-widest">
              Clique em &quot;Adicionar&quot; para colocar na homepage
            </p>
          </div>

          <div className="divide-y divide-border">
            {products.map((product) => {
              const images = parseJsonField<string[]>(product.images, [])
              const isTopSeller = topSellerIds.has(product.id)

              return (
                <div key={product.id} className={`flex items-center gap-4 px-4 py-3 hover:bg-secondary/20 transition-colors ${product.isFeatured ? 'bg-primary/5' : ''}`}>
                  {/* Thumbnail */}
                  <div className="relative w-12 h-12 bg-secondary shrink-0 overflow-hidden">
                    <Image
                      src={images[0] || '/images/products/placeholder-jersey.svg'}
                      alt={product.name}
                      fill
                      className="object-cover"
                      sizes="48px"
                    />
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-xs font-bold uppercase tracking-wide truncate">{product.name}</p>
                      {product.badge && (
                        <span className="text-[9px] bg-primary text-primary-foreground px-1.5 py-0.5 font-bold uppercase tracking-wider shrink-0">
                          {product.badge}
                        </span>
                      )}
                      {isTopSeller && (
                        <span className="text-[9px] bg-yellow-500/20 text-yellow-400 px-1.5 py-0.5 font-bold uppercase tracking-wider border border-yellow-500/30 shrink-0">
                          🔥 Mais vendido
                        </span>
                      )}
                    </div>
                    <p className="text-[10px] text-muted-foreground normal-case">
                      {product.team} · {product.category} · R$ {product.price.toFixed(2)}
                    </p>
                  </div>

                  {/* Toggle */}
                  <div className="shrink-0">
                    <FeaturedToggle
                      productId={product.id}
                      isFeatured={product.isFeatured}
                      productName={product.name}
                    />
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        <p className="text-[10px] text-muted-foreground normal-case">
          * Os produtos em destaque aparecem na seção &quot;Destaques&quot; da página inicial. Adicione ou remova quantos quiser.
          As alterações são refletidas imediatamente no site.
        </p>
      </div>
    </div>
  )
}
