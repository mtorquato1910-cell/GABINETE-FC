import Link from 'next/link'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { Package, Truck, ShoppingBag, MapPin, Heart, Sparkles, ArrowRight } from 'lucide-react'

export default async function ContaDashboardPage() {
  const session = await auth()
  const userId = (session?.user as { id?: string })?.id

  const [user, orderStats, abandonedCount, wishlistCount, loyaltyPoints] = userId
    ? await Promise.all([
        prisma.user.findUnique({
          where: { id: userId },
          select: { name: true, email: true, phone: true, createdAt: true, isVip: true },
        }),
        prisma.order.groupBy({
          by: ['status'],
          where: { userId },
          _count: { id: true },
        }),
        prisma.order.count({
          where: { userId, status: 'pending', paymentStatus: 'pending' },
        }),
        prisma.wishlist.count({ where: { userId } }),
        prisma.loyaltyPoint.aggregate({
          where: { userId },
          _sum: { points: true },
        }),
      ])
    : [null, [], 0, 0, { _sum: { points: 0 } }]

  const totalOrders = orderStats.reduce((acc, s) => acc + s._count.id, 0)
  const inTransit =
    (orderStats.find((s) => s.status === 'shipped')?._count.id ?? 0) +
    (orderStats.find((s) => s.status === 'processing')?._count.id ?? 0)
  const points = loyaltyPoints._sum.points ?? 0

  const cards = [
    {
      href: '/minha-conta/pedidos',
      label: 'Meus Pedidos',
      stat: totalOrders,
      hint: totalOrders === 1 ? 'pedido feito' : 'pedidos feitos',
      Icon: Package,
      accent: false,
    },
    {
      href: '/minha-conta/rastreio',
      label: 'Rastrear Envio',
      stat: inTransit,
      hint: inTransit === 1 ? 'pedido a caminho' : 'pedidos a caminho',
      Icon: Truck,
      accent: inTransit > 0,
    },
    {
      href: '/minha-conta/carrinho-abandonado',
      label: 'Carrinho',
      stat: abandonedCount,
      hint: abandonedCount > 0 ? 'recuperar' : 'tudo finalizado',
      Icon: ShoppingBag,
      accent: abandonedCount > 0,
    },
    {
      href: '/minha-conta/lista-desejos',
      label: 'Lista de Desejos',
      stat: wishlistCount,
      hint: wishlistCount === 1 ? 'camisa salva' : 'camisas salvas',
      Icon: Heart,
      accent: false,
    },
    {
      href: '/minha-conta/fidelidade',
      label: 'Pontos',
      stat: points,
      hint: 'pontos acumulados',
      Icon: Sparkles,
      accent: points > 0,
    },
    {
      href: '/minha-conta/enderecos',
      label: 'Endereços',
      stat: null,
      hint: 'gerenciar entregas',
      Icon: MapPin,
      accent: false,
    },
  ]

  return (
    <div>
      {/* Perfil compacto */}
      <div className="border border-border p-5 mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <p className="text-[10px] text-muted-foreground uppercase tracking-[0.2em] mb-1">
            Bem-vindo de volta
          </p>
          <h2 className="text-lg font-bold uppercase tracking-tight">
            {user?.name ?? 'Cliente'}
          </h2>
          <p className="text-xs text-muted-foreground normal-case">{user?.email}</p>
        </div>
        {user?.isVip && (
          <span className="text-[10px] font-bold uppercase tracking-[0.25em] bg-primary text-primary-foreground px-3 py-1 self-start">
            ★ Membro VIP
          </span>
        )}
      </div>

      {/* Grid de cards */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-px bg-[#1a1a1a]">
        {cards.map(({ href, label, stat, hint, Icon, accent }) => (
          <Link
            key={href}
            href={href}
            className={`group p-5 flex flex-col gap-3 transition-colors ${
              accent
                ? 'bg-[#0a0a0a] hover:bg-[#121212]'
                : 'bg-[#0a0a0a] hover:bg-[#121212]'
            }`}
          >
            <div className="flex items-center justify-between">
              <Icon
                className={`w-4 h-4 ${accent ? 'text-primary' : 'text-muted-foreground group-hover:text-primary'} transition-colors`}
              />
              <ArrowRight className="w-3 h-3 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all" />
            </div>
            {stat !== null && (
              <div className={`text-3xl font-bold leading-none ${accent ? 'text-primary' : 'text-white'}`}>
                {stat}
              </div>
            )}
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-white">{label}</p>
              <p className="text-[10px] text-muted-foreground uppercase tracking-widest normal-case">
                {hint}
              </p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}
