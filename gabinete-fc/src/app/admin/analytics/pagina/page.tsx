import { prisma } from '@/lib/db'
import Link from 'next/link'
import { ArrowLeft, User, UserX, ExternalLink } from 'lucide-react'

export const dynamic = 'force-dynamic'

interface SearchParams {
  url?: string
  page?: string
}

const PAGE_SIZE = 30

export default async function PageAnalyticsDetailPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>
}) {
  const params = await searchParams
  const pageUrl = params.url?.trim() ?? ''
  const currentPage = Math.max(1, parseInt(params.page ?? '1', 10) || 1)

  if (!pageUrl) {
    return (
      <div className="p-6">
        <Link
          href="/admin/analytics"
          className="flex items-center gap-2 text-[10px] uppercase tracking-widest text-muted-foreground hover:text-foreground mb-3 w-fit"
        >
          <ArrowLeft className="w-3 h-3" /> Voltar
        </Link>
        <p className="text-sm text-muted-foreground">Parâmetro url ausente.</p>
      </div>
    )
  }

  // KPIs gerais da página
  const [totalViews, uniqueSessionsAgg, sessionGroups] = await Promise.all([
    prisma.behaviorEvent.count({ where: { pageUrl, eventType: 'page_view' } }),
    prisma.behaviorEvent.findMany({
      where: { pageUrl },
      select: { sessionId: true },
      distinct: ['sessionId'],
    }),
    prisma.behaviorEvent.groupBy({
      by: ['sessionId'],
      where: { pageUrl },
      _count: { id: true },
      _min: { createdAt: true },
      _max: { createdAt: true },
      orderBy: { _max: { createdAt: 'desc' } },
      take: PAGE_SIZE,
      skip: (currentPage - 1) * PAGE_SIZE,
    }),
  ])

  const uniqueSessions = uniqueSessionsAgg.length
  const totalPages = Math.max(1, Math.ceil(uniqueSessions / PAGE_SIZE))

  // Pra cada sessão, descobre userId (pode haver mais de um se a pessoa logou no meio)
  // e busca o nome/email se logado
  const sessionIds = sessionGroups.map((g) => g.sessionId)
  const userLinks = await prisma.behaviorEvent.findMany({
    where: { sessionId: { in: sessionIds }, userId: { not: null } },
    select: { sessionId: true, userId: true, createdAt: true },
    orderBy: { createdAt: 'asc' },
  })

  // Agrupa userIds por sessão
  const userIdsBySession = new Map<string, Set<string>>()
  for (const link of userLinks) {
    if (!link.userId) continue
    if (!userIdsBySession.has(link.sessionId)) {
      userIdsBySession.set(link.sessionId, new Set())
    }
    userIdsBySession.get(link.sessionId)!.add(link.userId)
  }

  // Busca info dos usuários
  const allUserIds = Array.from(new Set(userLinks.map((l) => l.userId).filter((id): id is string => !!id)))
  const users = allUserIds.length
    ? await prisma.user.findMany({
        where: { id: { in: allUserIds } },
        select: { id: true, name: true, email: true, isVip: true, deletedAt: true },
      })
    : []
  const userMap = new Map(users.map((u) => [u.id, u]))

  const totalUniqueUsers = allUserIds.length

  const buildPageHref = (page: number) => {
    const sp = new URLSearchParams()
    sp.set('url', pageUrl)
    if (page > 1) sp.set('page', String(page))
    return `/admin/analytics/pagina?${sp.toString()}`
  }

  return (
    <div>
      <div className="px-6 py-6 border-b border-border">
        <Link
          href="/admin/analytics"
          className="flex items-center gap-2 text-[10px] uppercase tracking-widest text-muted-foreground hover:text-foreground transition-colors mb-3 w-fit"
        >
          <ArrowLeft className="w-3 h-3" /> Voltar pra Analytics
        </Link>
        <div className="flex items-center gap-3 flex-wrap">
          <h1 className="text-xl font-bold uppercase tracking-widest">Visitantes da página</h1>
          <a
            href={pageUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-[10px] uppercase tracking-widest text-primary hover:underline flex items-center gap-1"
          >
            Abrir página <ExternalLink className="w-3 h-3" />
          </a>
        </div>
        <p className="text-xs text-muted-foreground normal-case mt-1 font-mono">{pageUrl}</p>
      </div>

      <div className="p-6 space-y-6">
        {/* KPIs */}
        <div className="grid grid-cols-3 gap-4">
          <div className="border border-border p-4">
            <p className="text-[10px] text-muted-foreground uppercase tracking-widest mb-2">Page views</p>
            <p className="text-2xl font-bold">{totalViews.toLocaleString('pt-BR')}</p>
          </div>
          <div className="border border-border p-4">
            <p className="text-[10px] text-muted-foreground uppercase tracking-widest mb-2">Sessões únicas</p>
            <p className="text-2xl font-bold">{uniqueSessions.toLocaleString('pt-BR')}</p>
          </div>
          <div className="border border-border p-4">
            <p className="text-[10px] text-muted-foreground uppercase tracking-widest mb-2">Visitantes logados</p>
            <p className="text-2xl font-bold">{totalUniqueUsers.toLocaleString('pt-BR')}</p>
          </div>
        </div>

        {/* Sessões */}
        <div className="border border-border">
          <div className="px-4 py-3 border-b border-border bg-secondary">
            <h2 className="text-xs font-bold uppercase tracking-widest">
              Sessões ({uniqueSessions})
            </h2>
            <p className="text-[9px] text-muted-foreground/70 uppercase tracking-widest mt-1 normal-case">
              Sessões logadas mostram o cliente cadastrado. Anônimas mostram só o hash da sessão.
            </p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-border bg-secondary/50">
                  {['Visitante', 'Sessão', 'Eventos', 'Primeira visita', 'Última visita', ''].map((h) => (
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
                {sessionGroups.map((g) => {
                  const userIds = Array.from(userIdsBySession.get(g.sessionId) ?? [])
                  const sessionUsers = userIds.map((uid) => userMap.get(uid)).filter((u) => !!u)
                  const isAnonymous = sessionUsers.length === 0
                  return (
                    <tr
                      key={g.sessionId}
                      className="border-b border-border last:border-0 hover:bg-secondary/30 align-top"
                    >
                      <td className="px-3 py-2">
                        {isAnonymous ? (
                          <span className="flex items-center gap-1.5 text-muted-foreground">
                            <UserX className="w-3 h-3" />
                            <span className="uppercase text-[10px]">Anônimo</span>
                          </span>
                        ) : (
                          <div className="space-y-1">
                            {sessionUsers.map((u) => (
                              <div key={u!.id} className="flex items-center gap-1.5">
                                <User className="w-3 h-3 text-primary shrink-0" />
                                <Link
                                  href={`/admin/clientes/${u!.id}`}
                                  className="hover:text-primary"
                                >
                                  <span className="font-bold normal-case">{u!.name ?? 'Sem nome'}</span>
                                  <span className="text-muted-foreground text-[10px] ml-2 normal-case">
                                    {u!.email}
                                  </span>
                                </Link>
                                {u!.isVip && (
                                  <span className="text-[9px] uppercase text-primary">VIP</span>
                                )}
                                {u!.deletedAt && (
                                  <span className="text-[9px] uppercase text-destructive">Deletado</span>
                                )}
                              </div>
                            ))}
                            {sessionUsers.length > 1 && (
                              <p className="text-[9px] text-muted-foreground/70 uppercase">
                                Mudou de conta na sessão
                              </p>
                            )}
                          </div>
                        )}
                      </td>
                      <td className="px-3 py-2 font-mono text-[10px] text-muted-foreground">
                        {g.sessionId.slice(0, 8)}...
                      </td>
                      <td className="px-3 py-2 font-bold">{g._count.id}</td>
                      <td className="px-3 py-2 text-muted-foreground text-[10px]">
                        {g._min.createdAt
                          ? new Intl.DateTimeFormat('pt-BR', {
                              dateStyle: 'short',
                              timeStyle: 'short',
                            }).format(g._min.createdAt)
                          : '—'}
                      </td>
                      <td className="px-3 py-2 text-muted-foreground text-[10px]">
                        {g._max.createdAt
                          ? new Intl.DateTimeFormat('pt-BR', {
                              dateStyle: 'short',
                              timeStyle: 'short',
                            }).format(g._max.createdAt)
                          : '—'}
                      </td>
                      <td className="px-3 py-2">
                        <Link
                          href={`/admin/heatmap?session=${encodeURIComponent(g.sessionId)}`}
                          className="text-muted-foreground hover:text-primary uppercase text-[10px] tracking-widest"
                        >
                          Jornada
                        </Link>
                      </td>
                    </tr>
                  )
                })}
                {sessionGroups.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-3 py-6 text-center text-muted-foreground">
                      Nenhuma sessão nesta página.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Paginação */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between text-[10px] uppercase tracking-widest text-muted-foreground">
            <span>Página {currentPage} de {totalPages}</span>
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
      </div>
    </div>
  )
}
