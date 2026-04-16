import { prisma } from '@/lib/db'
import { formatPrice } from '@/lib/db-helpers'
import { CouponForm } from '@/components/admin/CouponForm'

export default async function CuponsAdminPage() {
  const coupons = await prisma.coupon.findMany({ orderBy: { createdAt: 'desc' } })

  return (
    <div>
      <div className="px-6 py-6 border-b border-border">
        <h1 className="text-xl font-bold uppercase tracking-widest">Cupons</h1>
      </div>
      <div className="p-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 border border-border">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-border bg-secondary">
                {['Código', 'Tipo', 'Valor', 'Usos', 'Validade', 'Status'].map(h => (
                  <th key={h} className="px-4 py-3 text-left font-bold uppercase tracking-widest text-muted-foreground">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {coupons.map(c => (
                <tr key={c.id} className="border-b border-border last:border-0 hover:bg-secondary/30">
                  <td className="px-4 py-3 font-mono font-bold">{c.code}</td>
                  <td className="px-4 py-3 uppercase">{c.type}</td>
                  <td className="px-4 py-3 font-bold">
                    {c.type === 'percent' ? `${c.value}%` : formatPrice(c.value)}
                  </td>
                  <td className="px-4 py-3">{c.usedCount}{c.maxUses ? `/${c.maxUses}` : ''}</td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {c.expiresAt ? new Intl.DateTimeFormat('pt-BR').format(c.expiresAt) : '—'}
                  </td>
                  <td className={`px-4 py-3 font-bold ${c.isActive ? 'text-primary' : 'text-muted-foreground'}`}>
                    {c.isActive ? 'Ativo' : 'Inativo'}
                  </td>
                </tr>
              ))}
              {coupons.length === 0 && <tr><td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">Nenhum cupom.</td></tr>}
            </tbody>
          </table>
        </div>
        <CouponForm />
      </div>
    </div>
  )
}
