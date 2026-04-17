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
  { href: '/admin/vitrine',   icon: LayoutGrid,      label: 'Vitrine' },
  { href: '/admin/produtos',  icon: Package,          label: 'Produtos' },
  { href: '/admin/pedidos',   icon: ShoppingBag,      label: 'Pedidos' },
  { href: '/admin/cupons',    icon: Tag,              label: 'Cupons' },
  { href: '/admin/avaliacoes',icon: Star,             label: 'Avaliações' },
  { href: '/admin/estoque',   icon: Boxes,            label: 'Estoque' },
  { href: '/admin/financeiro',icon: TrendingUp,       label: 'Financeiro' },
  { href: '/admin/marketing', icon: Megaphone,        label: 'Campanhas' },
  { href: '/admin/analytics', icon: BarChart2,        label: 'Analytics' },
  { href: '/admin/heatmap',   icon: Flame,            label: 'Heatmap' },
  { href: '/admin/configuracoes', icon: Settings,     label: 'Config.' },
]

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await auth()
  const user = session?.user as { role?: string; name?: string | null } | undefined
  if (user?.role !== 'admin') redirect('/auth/login')

  return (
    <div className="flex min-h-screen bg-black">
      {/* Sidebar */}
      <aside className="w-48 bg-[#050505] border-r border-[#1a1a1a] flex flex-col shrink-0 sticky top-0 h-screen overflow-y-auto">
        {/* Logo + status */}
        <div className="px-5 py-5 border-b border-[#1a1a1a]">
          <Logo variant="text" />
          <div className="flex items-center gap-1.5 mt-2.5">
            <span className="w-1 h-1 rounded-full bg-primary dot-pulse shrink-0" />
            <p className="text-[8px] text-white/30 uppercase tracking-[0.2em] font-bold">
              Admin Panel
            </p>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 py-2 overflow-y-auto">
          {navItems.map(({ href, icon: Icon, label }) => (
            <Link
              key={href}
              href={href}
              className="flex items-center gap-3 px-5 py-2.5 text-[9px] font-bold uppercase tracking-[0.15em] text-white/30 hover:text-white/80 hover:bg-white/[0.02] border-l-2 border-transparent hover:border-white/10 transition-all duration-150"
            >
              <Icon className="w-3.5 h-3.5 shrink-0" />
              <span>{label}</span>
            </Link>
          ))}
        </nav>

        {/* User footer */}
        <div className="px-5 py-4 border-t border-[#1a1a1a]">
          <p className="text-[8px] text-white/30 uppercase tracking-[0.15em] font-bold mb-1 truncate">
            {user?.name ?? 'Admin'}
          </p>
          <Link
            href="/api/auth/signout"
            className="flex items-center gap-1.5 text-[8px] text-white/20 hover:text-red-400 transition-colors uppercase tracking-[0.15em] font-bold mt-2"
          >
            <LogOut className="w-2.5 h-2.5" />
            Sair
          </Link>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 min-w-0">{children}</main>
    </div>
  )
}
