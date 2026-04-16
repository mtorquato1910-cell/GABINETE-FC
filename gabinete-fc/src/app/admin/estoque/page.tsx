import { prisma } from '@/lib/db'
import { parseJsonField } from '@/lib/db-helpers'
import { AddStockForm } from '@/components/admin/AddStockForm'

export default async function EstoquePage() {
  const products = await prisma.product.findMany({
    where: { isActive: true },
    include: {
      stockMovements: {
        select: { type: true, quantity: true },
      },
    },
    orderBy: { name: 'asc' },
  })

  const withStock = products.map(p => {
    const inQty = p.stockMovements.filter(m => m.type === 'in').reduce((s, m) => s + m.quantity, 0)
    const outQty = p.stockMovements.filter(m => m.type === 'out').reduce((s, m) => s + m.quantity, 0)
    const stock = inQty - outQty
    const sizes = parseJsonField<string[]>(p.sizesAvailable, [])
    return { ...p, stock, sizes }
  })

  return (
    <div>
      <div className="px-6 py-6 border-b border-border">
        <h1 className="text-xl font-bold uppercase tracking-widest">Estoque</h1>
      </div>
      <div className="p-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 border border-border">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-border bg-secondary">
                {['Produto', 'Tamanhos', 'Estoque (soma)', 'Alerta'].map(h => (
                  <th key={h} className="px-4 py-3 text-left font-bold uppercase tracking-widest text-muted-foreground">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {withStock.map(p => (
                <tr key={p.id} className="border-b border-border last:border-0 hover:bg-secondary/30">
                  <td className="px-4 py-3">
                    <p className="font-bold uppercase tracking-wide">{p.name}</p>
                    <p className="text-muted-foreground text-[10px]">{p.team}</p>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{p.sizes.join(', ')}</td>
                  <td className="px-4 py-3 font-bold">
                    <span className={p.stock <= 5 ? 'text-destructive' : p.stock <= 15 ? 'text-yellow-400' : 'text-primary'}>
                      {p.stock > 0 ? p.stock : 'N/A (sem movim.)'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    {p.stock <= 5 && p.stock > 0 && <span className="text-destructive text-[10px] font-bold uppercase">Baixo</span>}
                    {p.stock === 0 && <span className="text-yellow-400 text-[10px] font-bold uppercase">Sem reg.</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <AddStockForm products={withStock.map(p => ({ id: p.id, name: p.name, sizes: p.sizes }))} />
      </div>
    </div>
  )
}
