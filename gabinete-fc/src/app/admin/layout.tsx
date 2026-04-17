import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Logo } from '@/components/layout/Logo'
import {
  LayoutDashboard, Package, ShoppingBag, Tag,
  Settings, Star, TrendingUp, Boxes, LogOut,
  Megaphone, LayoutGrid, BarChart2, Flame,
} from 'lucide-react'

const navItems = [
  { href: '/admin/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { href: '/admin/vitrine', icon: LayoutGrid, label: 'Vitrine' },
  { href: '/admin/produtos', icon: Package, label: 'Produtos' },
  { href: '/admin/pedidos', icon: ShoppingBag, label: 'Pedidos' },
  { href: '/admin/cupons', icon: Tag, label: 'Cupons' },
  { href: '/admin/avaliacoes', icon: Star, label: 'Avaliações' },
  { href: '/admin/estoque', icon: Boxes, label: 'Estoque' },
  { href: '/admin/financeiro', icon: TrendingUp, label: 'Financeiro' },
  { href: '/admin/marketing', icon: Megaphone, label: 'Campanhas' },
  { href: '/admin/analytics', icon: BarChart2, label: 'Analytics' },
  { href: '/admin/heatmap', icon: Flame, label: 'Heatmap' },
  { href: '/admin/configuracoes', icon: Settings, label: 'Configurações' },
]

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await auth()
  const user = session?.user as { role?: string; name?: string | null } | undefined
  if (user?.role !== 'admin') redirect('/auth/login')

  return (
    <div className="flex min-h-screen bg-[#050505]">
      {/* Sidebar */}
      <aside className="w-52 bg-[#070707] border-r border-[#1a1a1a] flex flex-col shrink-0 sticky top-0 h-screen overflow-y-auto">
        {/* Logo area */}
        <div className="px-5 py-5 border-b border-[#1a1a1a]">
          <Logo variant="text" />
          <div className="flex items-center gap-2 mt-2">
            <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
            <p className="text-[9px] text-primary uppercase tracking-[0.25em] font-bold">Painel Admin</p>
          </div>
        </div>

        <nav className="flex-1 py-3 overflow-y-auto">
          {navItems.map(({ href, icon: Icon, label }) => (
            <Link
              key={href}
              href={href}
              className="group flex items-center gap-3 px-5 py-2.5 text-[10px] font-bold uppercase tracking-widest text-muted-foreground hover:text-foreground hover:bg-white/[0.03] transition-all duration-150 border-l-2 border-transparent hover:border-primary/50"
            >
              <Icon className="w-3.5 h-3.5 shrink-0 group-hover:text-primary transition-colors" />
              {label}
            </Link>
          ))}
        </nav>

        <div className="p-5 border-t border-[#1a1a1a]">
          <p className="text-[9px] text-muted-foreground uppercase tracking-widest mb-3 font-bold">
            {user?.name ?? 'Admin'}
          </p>
          <Link
            href="/api/auth/signout"
            className="flex items-center gap-2 text-[9px] text-muted-foreground hover:text-destructive transition-colors uppercase tracking-widest font-bold"
          >
            <LogOut className="w-3 h-3" />
            Encerrar sessão
          </Link>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 min-w-0">{children}</main>
    </div>
  )
}
