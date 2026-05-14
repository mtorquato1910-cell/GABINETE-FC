export function MarqueeBanner() {
  const items = [
    '/// ESTOQUE LIMITADO',
    '/// SEM REPOSIÇÃO',
    '/// COMPRE AGORA',
    '/// VENDAS FINAIS',
    '/// PIX COM 5% OFF',
    '/// FRETE GRÁTIS',
    '/// EDIÇÕES EXCLUSIVAS',
    '/// IMPORTADAS',
  ]

  return (
    <div className="w-full overflow-hidden bg-primary py-3 flex items-center whitespace-nowrap select-none">
      <div className="animate-marquee flex items-center gap-0">
        {[...items, ...items].map((item, i) => (
          <span
            key={i}
            className="text-[11px] font-black uppercase tracking-widest text-primary-foreground px-8"
          >
            {item}
          </span>
        ))}
      </div>
    </div>
  )
}
