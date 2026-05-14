'use client'
import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import { Search, Menu, X, User, ChevronDown, Package, Truck, Heart, LogOut, ShoppingBag, Shield } from 'lucide-react'
import { Logo } from './Logo'
import { useCartStore } from '@/stores/cart-store'

interface Props {
  isLoggedIn?: boolean
  isAdmin?: boolean
  userName?: string
}

const SHOP_LINKS = [
  { href: '/loja/selecoes', label: 'Seleções', hint: 'Copa 2026' },
  { href: '/loja/clubes', label: 'Clubes', hint: 'Em breve' },
  { href: '/lancamentos', label: 'Drops', hint: 'Edições limitadas' },
  { href: '/loja', label: 'Ver todas', hint: 'Catálogo completo' },
]

export function NavbarClient({ isLoggedIn = false, isAdmin = false, userName }: Props) {
  const [mobileOpen, setMobileOpen] = useState(false)
  const [shopOpen, setShopOpen] = useState(false)
  const [accountOpen, setAccountOpen] = useState(false)
  const shopRef = useRef<HTMLDivElement>(null)
  const accountRef = useRef<HTMLDivElement>(null)
  const totalItems = useCartStore((s) => s.totalItems())

  const initials = userName
    ? userName
        .split(' ')
        .map((p) => p[0])
        .slice(0, 2)
        .join('')
        .toUpperCase()
    : ''

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (shopRef.current && !shopRef.current.contains(e.target as Node)) setShopOpen(false)
      if (accountRef.current && !accountRef.current.contains(e.target as Node)) setAccountOpen(false)
    }
    function handleEscape(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        setShopOpen(false)
        setAccountOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    document.addEventListener('keydown', handleEscape)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('keydown', handleEscape)
    }
  }, [])

  return (
    <nav className="flex justify-between items-center px-6 md:px-8 py-4 border-b border-[#1a1a1a] sticky top-0 bg-black z-50">
      <Logo variant="text" />

      {/* Desktop nav */}
      <div className="hidden md:flex items-center gap-10 text-xs font-bold uppercase tracking-widest text-white">
        <Link href="/lancamentos" className="hover:text-primary transition-colors duration-150">
          Drops
        </Link>

        {/* LOJA dropdown */}
        <div ref={shopRef} className="relative">
          <button
            onClick={() => setShopOpen((v) => !v)}
            onMouseEnter={() => setShopOpen(true)}
            className="flex items-center gap-1.5 hover:text-primary transition-colors duration-150"
            aria-expanded={shopOpen}
            aria-haspopup="true"
          >
            Loja
            <ChevronDown className={`w-3 h-3 transition-transform duration-200 ${shopOpen ? 'rotate-180' : ''}`} />
          </button>
          {shopOpen && (
            <div
              onMouseLeave={() => setShopOpen(false)}
              className="absolute top-full left-1/2 -translate-x-1/2 mt-3 w-72 bg-[#0a0a0a] border border-[#1a1a1a] shadow-xl"
            >
              <div className="px-4 py-3 border-b border-[#1a1a1a] text-[10px] tracking-[0.2em] text-white/40">
                Navegar por categoria
              </div>
              {SHOP_LINKS.map(({ href, label, hint }) => (
                <Link
                  key={href}
                  href={href}
                  onClick={() => setShopOpen(false)}
                  className="flex items-center justify-between px-4 py-3 border-b border-[#1a1a1a] last:border-0 hover:bg-[#121212] hover:text-primary transition-colors group"
                >
                  <span className="text-sm">{label}</span>
                  <span className="text-[10px] text-white/40 group-hover:text-primary/70 tracking-widest">
                    {hint}
                  </span>
                </Link>
              ))}
            </div>
          )}
        </div>

        {isAdmin && (
          <Link href="/admin" className="text-primary hover:text-primary/80 transition-colors duration-150 flex items-center gap-1.5">
            <Shield className="w-3 h-3" />
            Admin
          </Link>
        )}
      </div>

      {/* Right actions */}
      <div className="flex items-center gap-5 md:gap-6">
        <Link
          href="/busca"
          className="hidden md:flex text-white hover:text-primary transition-colors duration-150"
          aria-label="Buscar"
        >
          <Search className="w-4 h-4" />
        </Link>

        <Link
          href="/carrinho"
          className="text-xs font-bold uppercase tracking-widest text-white hover:text-primary transition-colors duration-150 flex items-center gap-1.5"
        >
          Carrinho
          {totalItems > 0 && (
            <span className="bg-primary text-primary-foreground text-[9px] font-bold px-1.5 py-0.5 leading-none">
              {totalItems}
            </span>
          )}
        </Link>

        {/* Account icon (desktop) */}
        <div ref={accountRef} className="hidden md:block relative">
          {isLoggedIn ? (
            <button
              onClick={() => setAccountOpen((v) => !v)}
              className="w-9 h-9 border border-[#1a1a1a] flex items-center justify-center text-[10px] font-bold text-white hover:border-primary hover:text-primary transition-colors"
              aria-label="Minha conta"
              aria-expanded={accountOpen}
            >
              {initials || <User className="w-4 h-4" />}
            </button>
          ) : (
            <Link
              href="/auth/login"
              className="w-9 h-9 border border-[#1a1a1a] flex items-center justify-center text-white hover:border-primary hover:text-primary transition-colors"
              aria-label="Entrar / Cadastrar"
            >
              <User className="w-4 h-4" />
            </Link>
          )}

          {isLoggedIn && accountOpen && (
            <div className="absolute right-0 top-full mt-3 w-64 bg-[#0a0a0a] border border-[#1a1a1a] shadow-xl">
              <div className="px-4 py-3 border-b border-[#1a1a1a]">
                <div className="text-[10px] tracking-[0.2em] text-white/40">Logado como</div>
                <div className="text-sm text-white font-medium truncate">{userName || 'Conta'}</div>
              </div>
              {[
                { href: '/minha-conta', label: 'Minha Conta', Icon: User },
                { href: '/minha-conta/pedidos', label: 'Meus Pedidos', Icon: Package },
                { href: '/minha-conta/rastreio', label: 'Rastrear Pedido', Icon: Truck },
                { href: '/minha-conta/lista-desejos', label: 'Lista de Desejos', Icon: Heart },
                { href: '/carrinho', label: 'Carrinho', Icon: ShoppingBag },
              ].map(({ href, label, Icon }) => (
                <Link
                  key={href}
                  href={href}
                  onClick={() => setAccountOpen(false)}
                  className="flex items-center gap-3 px-4 py-2.5 border-b border-[#1a1a1a] last:border-0 hover:bg-[#121212] hover:text-primary transition-colors text-sm"
                >
                  <Icon className="w-3.5 h-3.5" />
                  {label}
                </Link>
              ))}
              <Link
                href="/api/auth/signout"
                onClick={() => setAccountOpen(false)}
                className="flex items-center gap-3 px-4 py-2.5 border-t border-[#1a1a1a] text-white/60 hover:text-primary hover:bg-[#121212] transition-colors text-sm"
              >
                <LogOut className="w-3.5 h-3.5" />
                Sair
              </Link>
            </div>
          )}
        </div>

        {/* Mobile toggle */}
        <button
          className="flex md:hidden text-white hover:text-primary transition-colors"
          onClick={() => setMobileOpen(!mobileOpen)}
          aria-label="Menu"
        >
          {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="absolute top-full left-0 right-0 bg-black border-b border-[#1a1a1a] flex flex-col text-xs font-bold uppercase tracking-widest md:hidden z-50">
          {/* Account block top */}
          <div className="px-6 py-4 border-b border-[#1a1a1a] bg-[#0a0a0a]">
            {isLoggedIn ? (
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 border border-[#1a1a1a] flex items-center justify-center text-[10px] font-bold text-white">
                  {initials || <User className="w-4 h-4" />}
                </div>
                <div>
                  <div className="text-[10px] text-white/40 tracking-[0.2em]">Logado como</div>
                  <div className="text-sm text-white normal-case font-medium">{userName || 'Conta'}</div>
                </div>
              </div>
            ) : (
              <Link
                href="/auth/login"
                onClick={() => setMobileOpen(false)}
                className="flex items-center gap-3 text-white hover:text-primary"
              >
                <User className="w-4 h-4" />
                Entrar / Cadastrar
              </Link>
            )}
          </div>

          {[
            { href: '/lancamentos', label: 'Drops' },
            { href: '/loja/selecoes', label: 'Seleções' },
            { href: '/loja/clubes', label: 'Clubes (Em breve)' },
            { href: '/loja', label: 'Camisas' },
            { href: '/busca', label: 'Buscar' },
            ...(isLoggedIn
              ? [
                  { href: '/minha-conta', label: 'Minha Conta' },
                  { href: '/minha-conta/pedidos', label: 'Meus Pedidos' },
                  { href: '/minha-conta/rastreio', label: 'Rastrear Pedido' },
                ]
              : []),
            ...(isAdmin ? [{ href: '/admin', label: 'Admin' }] : []),
          ].map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              onClick={() => setMobileOpen(false)}
              className="px-6 py-4 border-b border-[#1a1a1a] last:border-0 text-white hover:text-primary transition-colors"
            >
              {label}
            </Link>
          ))}

          {isLoggedIn && (
            <Link
              href="/api/auth/signout"
              onClick={() => setMobileOpen(false)}
              className="px-6 py-4 border-t border-[#1a1a1a] text-white/60 hover:text-primary transition-colors"
            >
              Sair
            </Link>
          )}
        </div>
      )}
    </nav>
  )
}
