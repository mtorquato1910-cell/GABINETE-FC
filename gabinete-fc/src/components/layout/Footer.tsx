import Link from 'next/link'
import { Logo } from './Logo'

export function Footer() {
  return (
    <footer className="border-t border-border mt-auto">
      {/* Main footer */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-0 border-b border-border">
        {/* Brand */}
        <div className="p-6 md:p-8 border-b md:border-b-0 md:border-r border-border">
          <Logo variant="text" />
          <p className="text-[10px] text-muted-foreground uppercase tracking-widest mt-3 leading-relaxed">
            Camisas de futebol premium.<br />
            Autênticas, importadas, entregues.
          </p>
        </div>

        {/* Loja */}
        <div className="p-6 md:p-8 border-b md:border-b-0 md:border-r border-border">
          <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-4">Loja</p>
          <div className="flex flex-col gap-2">
            {[
              { href: '/loja', label: 'Todas as Camisas' },
              { href: '/loja/selecoes', label: 'Seleções' },
              { href: '/loja/clubes-europeus', label: 'Clubes Europeus' },
              { href: '/loja/clubes-brasileiros', label: 'Clubes Brasileiros' },
              { href: '/loja/retro', label: 'Retrô' },
              { href: '/lancamentos', label: 'Lançamentos' },
              { href: '/promocoes', label: 'Promoções' },
            ].map(({ href, label }) => (
              <Link key={href} href={href} className="text-xs text-muted-foreground hover:text-primary transition-colors uppercase tracking-widest">
                {label}
              </Link>
            ))}
          </div>
        </div>

        {/* Ajuda */}
        <div className="p-6 md:p-8 border-b md:border-b-0 md:border-r border-border">
          <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-4">Ajuda</p>
          <div className="flex flex-col gap-2">
            {[
              { href: '/faq', label: 'FAQ' },
              { href: '/politicas', label: 'Políticas' },
              { href: '/sobre', label: 'Sobre Nós' },
              { href: '/minha-conta/pedidos', label: 'Meus Pedidos' },
            ].map(({ href, label }) => (
              <Link key={href} href={href} className="text-xs text-muted-foreground hover:text-primary transition-colors uppercase tracking-widest">
                {label}
              </Link>
            ))}
          </div>
        </div>

        {/* Contato */}
        <div className="p-6 md:p-8">
          <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-4">Contato</p>
          <div className="flex flex-col gap-2">
            <a href="mailto:contato@gabinetefc.com.br" className="text-xs text-muted-foreground hover:text-primary transition-colors normal-case">
              contato@gabinetefc.com.br
            </a>
            <a href="https://wa.me/5511999999999" target="_blank" rel="noopener noreferrer" className="text-xs text-muted-foreground hover:text-primary transition-colors uppercase tracking-widest">
              WhatsApp
            </a>
            <a href="https://instagram.com/gabinetefc" target="_blank" rel="noopener noreferrer" className="text-xs text-muted-foreground hover:text-primary transition-colors uppercase tracking-widest">
              Instagram
            </a>
          </div>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="flex flex-col sm:flex-row justify-between items-center px-6 py-4 gap-2">
        <p className="text-[10px] text-muted-foreground uppercase tracking-widest">
          © {new Date().getFullYear()} Gabinete FC. Todos os direitos reservados.
        </p>
        <p className="text-[10px] text-muted-foreground uppercase tracking-widest">
          CNPJ 00.000.000/0001-00
        </p>
      </div>
    </footer>
  )
}
