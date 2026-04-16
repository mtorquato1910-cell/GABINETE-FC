import Link from 'next/link'
import { prisma } from '@/lib/db'
import { parseJsonField, formatPrice } from '@/lib/db-helpers'
import Image from 'next/image'
import { Plus } from 'lucide-react'
import { DeleteProductButton } from '@/components/admin/DeleteProductButton'

export default async function ProdutosAdminPage() {
  const products = await prisma.product.findMany({
    orderBy: { createdAt: 'desc' },
  })

  return (
    <div>
      <div className="px-6 py-6 border-b border-border flex justify-between items-center">
        <h1 className="text-xl font-bold uppercase tracking-widest">Produtos</h1>
        <Link
          href="/admin/produtos/novo"
          className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground text-xs font-bold uppercase tracking-widest hover:bg-foreground hover:text-background transition-colors"
        >
          <Plus className="w-4 h-4" /> Novo
        </Link>
      </div>
      <div className="p-6">
        <div className="border border-border">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-border bg-secondary">
                {['Produto', 'Categoria', 'Preço', 'Status', 'Destaque', 'Ações'].map(h => (
                  <th key={h} className="px-4 py-3 text-left font-bold uppercase tracking-widest text-muted-foreground">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {products.map(p => {
                const images = parseJsonField<string[]>(p.images, [])
                return (
                  <tr key={p.id} className="border-b border-border last:border-0 hover:bg-secondary/30">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-12 bg-secondary relative shrink-0">
                          {images[0] && (
                            <Image src={images[0]} alt={p.name} fill className="object-contain" />
                          )}
                        </div>
                        <div>
                          <p className="font-bold uppercase tracking-wide">{p.name}</p>
                          <p className="text-muted-foreground text-[10px]">{p.team}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground uppercase">{p.category}</td>
                    <td className="px-4 py-3 font-bold">{formatPrice(p.price)}</td>
                    <td className={`px-4 py-3 font-bold ${p.isActive ? 'text-primary' : 'text-muted-foreground'}`}>
                      {p.isActive ? 'Ativo' : 'Rascunho'}
                    </td>
                    <td className="px-4 py-3">{p.isFeatured ? <span className="text-primary">★</span> : '—'}</td>
                    <td className="px-4 py-3">
                      <div className="flex gap-3 items-center">
                        <Link href={`/admin/produtos/${p.id}`} className="text-muted-foreground hover:text-primary transition-colors uppercase text-[10px] tracking-widest">
                          Editar
                        </Link>
                        <DeleteProductButton productId={p.id} />
                      </div>
                    </td>
                  </tr>
                )
              })}
              {products.length === 0 && (
                <tr><td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">Nenhum produto cadastrado.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
