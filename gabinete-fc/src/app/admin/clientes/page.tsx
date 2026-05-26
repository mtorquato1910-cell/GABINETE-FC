import { prisma } from '@/lib/db'
import { maskCpf } from '@/lib/admin-audit'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

interface SearchParams {
  q?: string
  vip?: string
  deleted?: string
  page?: string
}

const PAGE_SIZE = 25

export default async function ClientesAdminPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>
}) {
  const params = await searchParams
  const q = params.q?.trim() ?? ''
  const onlyVip = params.vip === '1'
  const includeDeleted = params.deleted === '1'
  const currentPage = Math.max(1, parseInt(params.page ?? '1', 10) || 1)

  const where = {
    role: 'customer' as const,
    ...(includeDeleted ? {} : { deletedAt: null }),
    ...(onlyVip ? { isVip: true } : {}),
    ...(q
      ? {
          OR: [
            { name: { contains: q, mode: 'insensitive' as const } },
            { email: { contains: q, mode: 'insensitive' as const } },
            { cpf: { contains: q.replace(/\D/g, '') } },
          ],
        }
      : {}),
  }

  const [total, customers] = await Promise.all([
    prisma.user.count({ where }),
    prisma.user.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: (currentPage - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        cpf: true,
        isVip: true,
        createdAt: true,
        deletedAt: true,
        _count: { select: { orders: true } },
      },
    }),
  ])

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE))

  const buildPageHref = (page: number) => {
    const sp = new URLSearchParams()
    if (q) sp.set('q', q)
    if (onlyVip) sp.set('vip', '1')
    if (includeDeleted) sp.set('deleted', '1')
    if (page > 1) sp.set('page', String(page))
    const qs = sp.toString()
    return qs ? `/admin/clientes?${qs}` : '/admin/clientes'
  }

  return (
    <div>
      <div className="px-6 py-6 border-b border-border flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold uppercase tracking-widest">Clientes</h1>
          <p className="text-[10px] text-muted-foreground uppercase tracking-widest mt-1">
            {total} {total === 1 ? 'cadastro' : 'cadastros'} encontrado{total === 1 ? '' : 's'}
          </p>
        </div>
      </div>

      <div className="p-6 space-y-4">
        {/* Filtros */}
        <form method="GET" className="flex flex-wrap gap-2 items-end">
          <div className="flex-1 min-w-[200px]">
            <label className="text-[10px] uppercase tracking-widest text-muted-foreground block mb-1">
              Buscar
            </label>
            <input
              type="text"
              name="q"
              defaultValue={q}
              placeholder="Nome, email ou CPF"
              className="w-full bg-secondary border border-border px-3 py-2 text-xs normal-case focus:outline-none focus:border-primary"
            />
          </div>
          <label className="flex items-center gap-2 text-[10px] uppercase tracking-widest text-muted-foreground cursor-pointer">
            <input type="checkbox" name="vip" value="1" defaultChecked={onlyVip} />
            VIP
          </label>
          <label className="flex items-center gap-2 text-[10px] uppercase tracking-widest text-muted-foreground cursor-pointer">
            <input type="checkbox" name="deleted" value="1" defaultChecked={includeDeleted} />
            Incluir deletados
          </label>
          <button
            type="submit"
            className="px-4 py-2 bg-primary text-primary-foreground text-[10px] font-bold uppercase tracking-widest hover:bg-foreground hover:text-background transition-colors"
          >
            Filtrar
          </button>
          {(q || onlyVip || includeDeleted) && (
            <Link
              href="/admin/clientes"
              className="px-4 py-2 border border-border text-[10px] font-bold uppercase tracking-widest text-muted-foreground hover:text-foreground transition-colors"
            >
              Limpar
            </Link>
          )}
        </form>

        {/* Tabela */}
        <div className="border border-border">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-border bg-secondary">
                {['Nome', 'Email', 'Telefone', 'CPF', 'Pedidos', 'VIP', 'Cadastro', ''].map((h) => (
                  <th
                    key={h}
                    className="px-4 py-3 text-left font-bold uppercase tracking-widest text-muted-foreground"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {customers.map((c) => (
                <tr
                  key={c.id}
                  className={`border-b border-border last:border-0 hover:bg-secondary/30 ${c.deletedAt ? 'opacity-50' : ''}`}
                >
                  <td className="px-4 py-3 font-bold">
                    {c.name ?? '—'}
                    {c.deletedAt && (
                      <span className="ml-2 text-[9px] text-destructive uppercase">Deletado</span>
                    )}
                  </td>
                  <td className="px-4 py-3 normal-case text-muted-foreground">{c.email}</td>
                  <td className="px-4 py-3 normal-case text-muted-foreground">{c.phone ?? '—'}</td>
                  <td className="px-4 py-3 font-mono text-muted-foreground">
                    {c.cpf ? maskCpf(c.cpf) : '—'}
                  </td>
                  <td className="px-4 py-3">{c._count.orders}</td>
                  <td className="px-4 py-3">
                    {c.isVip ? (
                      <span className="text-primary font-bold uppercase text-[10px]">VIP</span>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {new Intl.DateTimeFormat('pt-BR').format(c.createdAt)}
                  </td>
                  <td className="px-4 py-3">
                    <Link
                      href={`/admin/clientes/${c.id}`}
                      className="text-muted-foreground hover:text-primary transition-colors uppercase text-[10px] tracking-widest"
                    >
                      Ver
                    </Link>
                  </td>
                </tr>
              ))}
              {customers.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-4 py-8 text-center text-muted-foreground">
                    Nenhum cliente encontrado.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Paginação */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between text-[10px] uppercase tracking-widest text-muted-foreground">
            <span>
              Página {currentPage} de {totalPages}
            </span>
            <div className="flex gap-2">
              {currentPage > 1 && (
                <Link
                  href={buildPageHref(currentPage - 1)}
                  className="px-3 py-1 border border-border hover:border-primary hover:text-primary transition-colors"
                >
                  ← Anterior
                </Link>
              )}
              {currentPage < totalPages && (
                <Link
                  href={buildPageHref(currentPage + 1)}
                  className="px-3 py-1 border border-border hover:border-primary hover:text-primary transition-colors"
                >
                  Próxima →
                </Link>
              )}
            </div>
          </div>
        )}

        <p className="text-[9px] text-muted-foreground/60 normal-case">
          🔒 LGPD: CPFs são exibidos mascarados nesta lista. O CPF completo só é
          revelado na tela de detalhes do cliente, e cada acesso é registrado em
          log de auditoria.
        </p>
      </div>
    </div>
  )
}
