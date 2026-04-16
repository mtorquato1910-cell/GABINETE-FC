import Link from 'next/link'

export function HeroSection() {
  return (
    <header className="grid grid-cols-1 lg:grid-cols-2 border-b border-border">
      {/* Left — Copy */}
      <div className="p-6 lg:p-12 flex flex-col justify-between min-h-[60vh] border-b lg:border-b-0 lg:border-r border-border">
        <div className="text-xs font-bold uppercase tracking-widest flex justify-between text-primary">
          <span>Status: Live</span>
          <span>Vol. 01</span>
        </div>

        <div className="my-12">
          <h1 className="text-5xl lg:text-8xl font-bold tracking-tighter leading-none uppercase mb-6">
            A Beleza<br />Do Caos.
          </h1>
          <p className="text-muted-foreground max-w-[45ch] text-sm leading-relaxed lowercase font-medium tracking-normal">
            as camisas das maiores seleções e clubes do mundo. edições limitadas, estoque reduzido.
            sem reposição. garanta a sua antes que acabe.
          </p>
        </div>

        <Link
          href="/loja"
          className="group flex justify-between items-center w-full sm:w-max px-8 py-4 bg-foreground text-background font-bold text-sm uppercase tracking-widest hover:bg-primary hover:text-primary-foreground transition-colors duration-300"
        >
          <span>Ver Camisas</span>
          <span className="ml-8 group-hover:translate-x-2 transition-transform">→</span>
        </Link>
      </div>

      {/* Right — Visual */}
      <div className="relative min-h-[40vh] lg:min-h-full bg-secondary flex items-center justify-center p-8">
        <div className="text-center space-y-4">
          <div className="text-8xl lg:text-[160px] font-bold text-border leading-none select-none">
            FC
          </div>
          <p className="text-xs uppercase tracking-widest text-muted-foreground">
            Autênticas. Importadas. Premium.
          </p>
        </div>
        <div className="absolute bottom-8 right-8 text-right">
          <div className="text-4xl font-bold text-primary">01</div>
          <div className="text-[10px] uppercase tracking-widest text-muted-foreground">Campaign / 2026</div>
        </div>
      </div>
    </header>
  )
}
