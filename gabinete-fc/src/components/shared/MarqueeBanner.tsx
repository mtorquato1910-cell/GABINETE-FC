export function MarqueeBanner() {
  const items = [
    'ESTOQUE LIMITADO',
    'SEM REPOSIÇÃO',
    'COMPRE AGORA',
    'VENDAS FINAIS',
    'PIX COM 5% OFF',
    'FRETE GRÁTIS ACIMA DE R$500',
    'EDIÇÕES EXCLUSIVAS',
    'AUTÊNTICAS E IMPORTADAS',
  ]

  return (
    <div className="w-full overflow-hidden border-b border-[#1a1a1a] bg-primary text-primary-foreground py-2.5 flex items-center whitespace-nowrap select-none">
      <div className="animate-marquee flex items-center gap-0">
        {[...items, ...items].map((item, i) => (
          <span key={i} className="flex items-center">
            <span className="text-[11px] font-black uppercase tracking-[0.2em] px-6">{item}</span>
            <span className="text-primary-foreground/40 text-[8px]">◆</span>
          </span>
        ))}
      </div>
    </div>
  )
}
