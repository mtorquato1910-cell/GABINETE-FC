import Link from 'next/link'
import { Logo } from './Logo'

export function Footer() {
  return (
    <footer className="border-t border-[#1a1a1a] mt-auto bg-[#050505]">
      {/* Main footer */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-0 border-b border-[#1a1a1a]">
        {/* Brand */}
        <div className="p-6 md:p-10 border-b md:border-b-0 md:border-r border-[#1a1a1a] flex flex-col justify-between gap-6">
          <div>
            <Logo variant="text" />
            <p className="text-xs text-muted-foreground uppercase tracking-widest mt-4 leading-relaxed">
              Camisas de futebol premium.<br />
              Importadas, entregues.
            </p>
          </div>
          <div className="text-[9px] text-muted-foreground/40 uppercase tracking-[0.2em] font-bold">
            Est. 2024 — Rio de Janeiro
          </div>
        </div>

        {/* Loja */}
        <div className="p-6 md:p-10 border-b md:border-b-0 md:border-r border-[#1a1a1a]">
          <p className="text-[9px] font-black uppercase tracking-[0.2em] text-primary mb-5">Loja</p>
          <div className="flex flex-col gap-3">
            {[
              { href: '/loja', label: 'Todas as Camisas' },
              { href: '/loja/selecoes', label: 'Seleções' },
              { href: '/loja/clubes-europeus', label: 'Clubes Europeus' },
              { href: '/loja/clubes-brasileiros', label: 'Clubes Brasileiros' },
              { href: '/loja/retro', label: 'Retrô' },
              { href: '/lancamentos', label: 'Drops' },
            ].map(({ href, label }) => (
              <Link key={href} href={href} className="text-xs text-muted-foreground hover:text-primary transition-colors uppercase tracking-widest font-bold">
                {label}
              </Link>
            ))}
          </div>
        </div>

        {/* Ajuda */}
        <div className="p-6 md:p-10 border-b md:border-b-0 md:border-r border-[#1a1a1a]">
          <p className="text-[9px] font-black uppercase tracking-[0.2em] text-primary mb-5">Ajuda</p>
          <div className="flex flex-col gap-3">
            {[
              { href: '/faq', label: 'FAQ' },
              { href: '/politicas', label: 'Políticas' },
              { href: '/sobre', label: 'Sobre Nós' },
              { href: '/minha-conta/pedidos', label: 'Meus Pedidos' },
            ].map(({ href, label }) => (
              <Link key={href} href={href} className="text-xs text-muted-foreground hover:text-primary transition-colors uppercase tracking-widest font-bold">
                {label}
              </Link>
            ))}
          </div>
        </div>

        {/* Contato */}
        <div className="p-6 md:p-10">
          <p className="text-[9px] font-black uppercase tracking-[0.2em] text-primary mb-5">Contato</p>
          <div className="flex flex-col gap-3">
            <a href="mailto:tecnologia@unfoldgrowth.com.br" className="text-xs text-muted-foreground hover:text-primary transition-colors normal-case font-bold tracking-wide">
              tecnologia@unfoldgrowth.com.br
            </a>
            <a href="https://wa.me/5511999999999" target="_blank" rel="noopener noreferrer" className="text-xs text-muted-foreground hover:text-primary transition-colors uppercase tracking-widest font-bold">
              WhatsApp
            </a>
          </div>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="flex flex-col sm:flex-row justify-between items-center px-6 md:px-10 py-4 gap-2">
        <p className="text-[9px] text-muted-foreground/40 uppercase tracking-widest font-bold">
          © {new Date().getFullYear()} Gabinete FC. Todos os direitos reservados.
        </p>
        <p className="text-[9px] text-muted-foreground/40 uppercase tracking-widest font-bold">
          CNPJ 00.000.000/0001-00
        </p>
      </div>
    </footer>
  )
}
