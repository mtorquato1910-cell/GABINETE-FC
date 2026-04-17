export function MarqueeBanner() {
  const items = [
    'Estoque Limitado',
    'Sem Reposição',
    'Compre Agora',
    'Pix com 5% Off',
    'Frete Grátis acima de R$500',
    'Edições Exclusivas',
    'Autênticas e Importadas',
    'Vendas Finais',
  ]

  return (
    <div className="w-full overflow-hidden border-b border-[#1a1a1a] bg-[#0a0a0a] py-2 flex items-center whitespace-nowrap select-none">
      <div className="animate-marquee flex items-center gap-0">
        {[...items, ...items].map((item, i) => (
          <span key={i} className="flex items-center">
            <span className="text-[9px] font-bold uppercase tracking-[0.25em] text-white/25 px-8">{item}</span>
            <span className="text-primary/40 text-[6px]">◆</span>
          </span>
        ))}
      </div>
    </div>
  )
}
