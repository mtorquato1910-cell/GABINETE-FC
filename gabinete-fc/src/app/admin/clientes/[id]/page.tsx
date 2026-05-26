import { prisma } from '@/lib/db'
import { auth } from '@/lib/auth'
import { formatCpf, logAdminAction } from '@/lib/admin-audit'
import { formatPrice } from '@/lib/db-helpers'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Mail, Phone, MapPin, ShoppingBag, Star } from 'lucide-react'

export const dynamic = 'force-dynamic'

export default async function ClienteDetalhePage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const session = await auth()

  const customer = await prisma.user.findUnique({
    where: { id },
    include: {
      orders: {
        orderBy: { createdAt: 'desc' },
        take: 20,
        select: {
          id: true,
          status: true,
          paymentStatus: true,
          total: true,
          createdAt: true,
          items: { select: { id: true } },
        },
      },
      addresses: {
        orderBy: { isDefault: 'desc' },
        select: {
          id: true,
          label: true,
          street: true,
          number: true,
          neighborhood: true,
          city: true,
          state: true,
          zipCode: true,
          isDefault: true,
        },
      },
      reviews: {
        orderBy: { createdAt: 'desc' },
        take: 10,
        include: { product: { select: { name: true, slug: true } } },
      },
    },
  })

  if (!customer || customer.role !== 'customer') notFound()

  // Audit log — toda visualização de cliente fica registrada (LGPD)
  if (session?.user) {
    await logAdminAction({
      adminUserId: session.user.id,
      adminEmail: session.user.email,
      action: 'view_customer',
      targetType: 'customer',
      targetId: customer.id,
    })
    if (customer.cpf) {
      await logAdminAction({
        adminUserId: session.user.id,
        adminEmail: session.user.email,
        action: 'view_cpf',
        targetType: 'customer',
        targetId: customer.id,
      })
    }
  }

  const totalSpent = customer.orders
    .filter((o) => o.paymentStatus === 'paid')
    .reduce((sum, o) => sum + o.total, 0)

  return (
    <div>
      <div className="px-6 py-6 border-b border-border">
        <Link
          href="/admin/clientes"
          className="flex items-center gap-2 text-[10px] uppercase tracking-widest text-muted-foreground hover:text-foreground transition-colors mb-3 w-fit"
        >
          <ArrowLeft className="w-3 h-3" /> Voltar
        </Link>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold uppercase tracking-widest">{customer.name ?? 'Sem nome'}</h1>
            <p className="text-[10px] text-muted-foreground uppercase tracking-widest mt-1 normal-case">
              {customer.email}
            </p>
          </div>
          <div className="flex gap-2">
            {customer.isVip && (
              <span className="px-3 py-1 bg-primary text-primary-foreground text-[10px] font-bold uppercase tracking-widest">
                VIP
              </span>
            )}
            {customer.deletedAt && (
              <span className="px-3 py-1 bg-destructive/20 text-destructive text-[10px] font-bold uppercase tracking-widest">
                Deletado
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="p-6 grid gap-6 lg:grid-cols-3">
        {/* Coluna 1 — Perfil + Endereços */}
        <div className="space-y-6 lg:col-span-1">
          {/* Perfil */}
          <div className="border border-border">
            <div className="px-4 py-3 border-b border-border bg-secondary">
              <h2 className="text-xs font-bold uppercase tracking-widest">Perfil</h2>
            </div>
            <div className="p-4 space-y-3 text-xs">
              <div>
                <p className="text-[10px] uppercase tracking-widest text-muted-foreground mb-1">Nome</p>
                <p className="font-bold">{customer.name ?? '—'}</p>
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-widest text-muted-foreground mb-1 flex items-center gap-1">
                  <Mail className="w-3 h-3" /> Email
                </p>
                <p className="font-mono normal-case">{customer.email}</p>
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-widest text-muted-foreground mb-1 flex items-center gap-1">
                  <Phone className="w-3 h-3" /> Telefone
                </p>
                <p className="font-mono normal-case">{customer.phone ?? '—'}</p>
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-widest text-muted-foreground mb-1">
                  CPF <span className="text-primary normal-case">(LGPD: acesso logado)</span>
                </p>
                <p className="font-mono">{formatCpf(customer.cpf) || '—'}</p>
              </div>
              <div className="pt-2 border-t border-border grid grid-cols-2 gap-3 text-[10px] uppercase tracking-widest text-muted-foreground">
                <div>
                  <p className="mb-1">Cadastro</p>
                  <p className="text-foreground">
                    {new Intl.DateTimeFormat('pt-BR').format(customer.createdAt)}
                  </p>
                </div>
                <div>
                  <p className="mb-1">Total gasto</p>
                  <p className="text-foreground font-bold normal-case">{formatPrice(totalSpent)}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Endereços */}
          <div className="border border-border">
            <div className="px-4 py-3 border-b border-border bg-secondary flex items-center gap-2">
              <MapPin className="w-3 h-3" />
              <h2 className="text-xs font-bold uppercase tracking-widest">
                Endereços ({customer.addresses.length})
              </h2>
            </div>
            <div className="p-4 space-y-3 text-xs">
              {customer.addresses.length === 0 && (
                <p className="text-muted-foreground text-[10px]">Nenhum endereço cadastrado.</p>
              )}
              {customer.addresses.map((a) => (
                <div key={a.id} className="pb-3 border-b border-border last:border-0">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold">
                      {a.label}
                    </p>
                    {a.isDefault && (
                      <span className="text-[9px] uppercase text-primary">Padrão</span>
                    )}
                  </div>
                  <p className="normal-case">
                    {a.street}, {a.number} · {a.neighborhood}
                  </p>
                  <p className="normal-case text-muted-foreground text-[10px]">
                    {a.city}/{a.state} · CEP {a.zipCode}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Coluna 2-3 — Pedidos + Reviews */}
        <div className="space-y-6 lg:col-span-2">
          {/* Pedidos */}
          <div className="border border-border">
            <div className="px-4 py-3 border-b border-border bg-secondary flex items-center gap-2">
              <ShoppingBag className="w-3 h-3" />
              <h2 className="text-xs font-bold uppercase tracking-widest">
                Últimos pedidos ({customer.orders.length})
              </h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-border bg-secondary/50">
                    {['Pedido', 'Itens', 'Total', 'Pgto', 'Status', 'Data', ''].map((h) => (
                      <th
                        key={h}
                        className="px-3 py-2 text-left font-bold uppercase tracking-widest text-muted-foreground text-[9px]"
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {customer.orders.map((o) => (
                    <tr key={o.id} className="border-b border-border last:border-0 hover:bg-secondary/30">
                      <td className="px-3 py-2 font-mono">#{o.id.slice(-8).toUpperCase()}</td>
                      <td className="px-3 py-2">{o.items.length}</td>
                      <td className="px-3 py-2 font-bold normal-case">{formatPrice(o.total)}</td>
                      <td className="px-3 py-2 uppercase text-[10px]">{o.paymentStatus}</td>
                      <td className="px-3 py-2 uppercase text-[10px]">{o.status}</td>
                      <td className="px-3 py-2 text-muted-foreground text-[10px]">
                        {new Intl.DateTimeFormat('pt-BR').format(o.createdAt)}
                      </td>
                      <td className="px-3 py-2">
                        <Link
                          href={`/admin/pedidos/${o.id}`}
                          className="text-muted-foreground hover:text-primary uppercase text-[10px] tracking-widest"
                        >
                          Ver
                        </Link>
                      </td>
                    </tr>
                  ))}
                  {customer.orders.length === 0 && (
                    <tr>
                      <td colSpan={7} className="px-3 py-6 text-center text-muted-foreground">
                        Nenhum pedido ainda.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Reviews */}
          <div className="border border-border">
            <div className="px-4 py-3 border-b border-border bg-secondary flex items-center gap-2">
              <Star className="w-3 h-3" />
              <h2 className="text-xs font-bold uppercase tracking-widest">
                Avaliações ({customer.reviews.length})
              </h2>
            </div>
            <div className="p-4 space-y-3 text-xs">
              {customer.reviews.length === 0 && (
                <p className="text-muted-foreground text-[10px]">Nenhuma avaliação ainda.</p>
              )}
              {customer.reviews.map((r) => (
                <div key={r.id} className="pb-3 border-b border-border last:border-0">
                  <div className="flex items-center justify-between mb-1">
                    <Link
                      href={`/produto/${r.product.slug}`}
                      className="font-bold normal-case hover:text-primary"
                    >
                      {r.product.name}
                    </Link>
                    <span className="text-primary">{'★'.repeat(r.rating)}{'☆'.repeat(5 - r.rating)}</span>
                  </div>
                  {r.title && <p className="text-[10px] font-bold normal-case mb-1">{r.title}</p>}
                  {r.body && <p className="text-muted-foreground normal-case text-[10px]">{r.body}</p>}
                  <p className="text-[9px] text-muted-foreground/60 uppercase tracking-widest mt-1">
                    {r.status} · {new Intl.DateTimeFormat('pt-BR').format(r.createdAt)}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
