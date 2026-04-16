const MarqueeBanner = () => {
  return (
    <div className="w-full overflow-hidden border-b border-border bg-primary text-primary-foreground py-3 flex items-center whitespace-nowrap text-sm font-bold uppercase tracking-widest">
      <div className="animate-marquee flex gap-8">
        <span>/// ESTOQUE LIMITADO</span>
        <span>/// SEM REPOSIÇÃO</span>
        <span>/// COMPRE AGORA</span>
        <span>/// VENDAS FINAIS</span>
        <span>/// ESTOQUE LIMITADO</span>
        <span>/// SEM REPOSIÇÃO</span>
        <span>/// COMPRE AGORA</span>
        <span>/// VENDAS FINAIS</span>
      </div>
    </div>
  );
};

export default MarqueeBanner;
