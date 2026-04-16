export function MarqueeBanner() {
  const items = [
    '/// ESTOQUE LIMITADO',
    '/// SEM REPOSIÇÃO',
    '/// COMPRE AGORA',
    '/// VENDAS FINAIS',
    '/// PIX COM 5% OFF',
    '/// FRETE GRÁTIS ACIMA DE R$500',
  ]

  return (
    <div className="w-full overflow-hidden border-b border-border bg-primary text-primary-foreground py-3 flex items-center whitespace-nowrap">
      <div className="animate-marquee flex gap-8 text-xs font-bold uppercase tracking-widest">
        {[...items, ...items].map((item, i) => (
          <span key={i}>{item}</span>
        ))}
      </div>
    </div>
  )
}
