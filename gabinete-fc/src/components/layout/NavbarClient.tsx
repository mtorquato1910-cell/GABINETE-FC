'use client'
import { useState } from 'react'
import Link from 'next/link'
import { Search, Menu, X, ShoppingCart, User, Shield } from 'lucide-react'
import { Logo } from './Logo'
import { useCartStore } from '@/stores/cart-store'

interface Props {
  isLoggedIn?: boolean
  isAdmin?: boolean
  userName?: string
}

export function NavbarClient({ isLoggedIn = false, isAdmin = false, userName }: Props) {
  const [mobileOpen, setMobileOpen] = useState(false)
  const totalItems = useCartStore((s) => s.totalItems())

  return (
    <nav className="flex justify-between items-center px-4 md:px-8 py-0 border-b border-[#1a1a1a] sticky top-0 bg-[#050505]/98 backdrop-blur-md z-50 h-14 md:h-16">
      <Logo variant="text" />

      {/* Desktop nav */}
      <div className="hidden md:flex gap-0 text-[11px] font-bold uppercase tracking-widest h-full">
        {[
          { href: '/lancamentos', label: 'Drops', highlight: true },
          { href: '/loja', label: 'Camisas' },
          { href: '/loja/selecoes', label: 'Seleções' },
          { href: '/loja/clubes-europeus', label: 'Clubes' },
          { href: '/loja/retro', label: 'Retrô' },
        ].map(({ href, label, highlight }) => (
          <Link
            key={href}
            href={href}
            className={`flex items-center px-5 h-full border-l border-[#1a1a1a] transition-colors duration-150 hover:text-primary hover:bg-white/[0.02] ${
              highlight ? 'text-primary' : 'text-muted-foreground'
            }`}
          >
            {label}
          </Link>
        ))}
      </div>

      {/* Actions */}
      <div className="flex gap-0 items-center h-full">
        <Link
          href="/busca"
          className="hidden md:flex items-center justify-center w-12 h-full border-l border-[#1a1a1a] text-muted-foreground hover:text-primary transition-colors duration-150"
          aria-label="Buscar"
        >
          <Search className="w-4 h-4" />
        </Link>

        {isAdmin && (
          <Link
            href="/admin"
            className="hidden md:flex items-center justify-center w-12 h-full border-l border-[#1a1a1a] text-primary hover:bg-primary/10 transition-colors duration-150"
            aria-label="Admin"
          >
            <Shield className="w-4 h-4" />
          </Link>
        )}

        <Link
          href="/minha-conta"
          className="hidden md:flex items-center justify-center gap-1.5 px-4 h-full border-l border-[#1a1a1a] text-muted-foreground hover:text-primary transition-colors duration-150"
        >
          <User className="w-4 h-4 shrink-0" />
          {isLoggedIn && userName && (
            <span className="text-[10px] font-bold uppercase tracking-widest text-primary">
              {userName.split(' ')[0]}
            </span>
          )}
        </Link>

        <Link
          href="/carrinho"
          className="flex items-center justify-center gap-1.5 px-4 h-full border-l border-[#1a1a1a] text-muted-foreground hover:text-primary transition-colors duration-150 text-[11px] font-bold uppercase tracking-widest"
        >
          <ShoppingCart className="w-4 h-4 shrink-0" />
          <span className="tabular-nums">[{String(totalItems).padStart(2, '0')}]</span>
        </Link>

        <button
          className="flex md:hidden items-center justify-center w-12 h-full border-l border-[#1a1a1a] text-muted-foreground hover:text-primary transition-colors"
          onClick={() => setMobileOpen(!mobileOpen)}
          aria-label="Menu"
        >
          {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="absolute top-full left-0 right-0 bg-[#050505] border-b border-[#1a1a1a] flex flex-col text-[11px] font-bold uppercase tracking-widest md:hidden z-50">
          {[
            { href: '/lancamentos', label: 'Drops', highlight: true },
            { href: '/loja', label: 'Camisas' },
            { href: '/loja/selecoes', label: 'Seleções' },
            { href: '/loja/clubes-europeus', label: 'Clubes' },
            { href: '/loja/retro', label: 'Retrô' },
            { href: '/busca', label: 'Buscar' },
            { href: '/minha-conta', label: isLoggedIn ? 'Minha Conta' : 'Login' },
            ...(isAdmin ? [{ href: '/admin', label: 'Painel Admin', highlight: false }] : []),
          ].map(({ href, label, highlight }) => (
            <Link
              key={href}
              href={href}
              onClick={() => setMobileOpen(false)}
              className={`px-6 py-4 border-b border-[#1a1a1a] last:border-0 transition-colors hover:text-primary hover:bg-white/[0.02] ${
                highlight ? 'text-primary' : 'text-muted-foreground'
              }`}
            >
              {label}
            </Link>
          ))}
        </div>
      )}
    </nav>
  )
}
