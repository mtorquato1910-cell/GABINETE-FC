import Link from 'next/link'
import Image from 'next/image'

export function HeroSection() {
  return (
    <header className="grid grid-cols-1 lg:grid-cols-2 border-b border-border">
      {/* Left — Copy */}
      <div className="p-6 lg:p-12 flex flex-col justify-between min-h-[65vh] border-b lg:border-b-0 lg:border-r border-border bg-[#050505]">
        {/* Top labels */}
        <div className="flex justify-between items-center">
          <span className="text-[11px] font-bold uppercase tracking-widest text-primary">
            STATUS: LIVE
          </span>
          <span className="text-[11px] font-bold uppercase tracking-widest text-primary">
            VOL. 04
          </span>
        </div>

        {/* Hero text */}
        <div className="my-10 lg:my-0 lg:flex-1 lg:flex lg:flex-col lg:justify-center">
          <h1
            className="hero-title text-[clamp(4rem,10vw,8rem)] font-black leading-[0.9] tracking-tight uppercase mb-6 text-white"
            style={{ fontFamily: "'Barlow Condensed', 'Space Grotesk', sans-serif", fontWeight: 900 }}
          >
            A BELEZA<br />DO CAOS.
          </h1>
          <p className="text-muted-foreground max-w-[40ch] text-sm leading-relaxed lowercase font-normal tracking-normal">
            as camisas das maiores seleções e clubes do mundo. edições limitadas,
            estoque reduzido. sem reposição. garanta a sua antes que acabe.
          </p>
        </div>

        {/* CTA */}
        <Link
          href="/loja"
          className="group inline-flex justify-between items-center w-full sm:w-max px-8 py-4 border border-foreground text-foreground font-bold text-xs uppercase tracking-widest hover:bg-primary hover:border-primary hover:text-primary-foreground transition-all duration-300"
        >
          <span>VER CAMISAS</span>
          <span className="ml-8 group-hover:translate-x-1.5 transition-transform duration-300">-&gt;</span>
        </Link>
      </div>

      {/* Right — Campo de futebol (imagem real) */}
      <div className="relative min-h-[45vh] lg:min-h-full bg-[#0a0a0a] overflow-hidden">
        <Image
          src="/images/campo-futebol.jpg"
          alt="Estádio Gabinete FC"
          fill
          className="object-cover opacity-75"
          priority
          sizes="(max-width: 1024px) 100vw, 50vw"
        />
        {/* Overlay gradiente sutil */}
        <div className="absolute inset-0 bg-gradient-to-br from-black/40 via-transparent to-black/50" />

        {/* Campaign badge */}
        <div className="absolute bottom-6 right-6 text-right z-10">
          <div
            className="text-5xl font-black leading-none text-primary"
            style={{ fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 900 }}
          >
            01
          </div>
          <div className="text-[10px] uppercase tracking-widest text-white/60 mt-1">
            Campaign / Rio
          </div>
        </div>

        <div className="absolute top-6 left-6 z-10">
          <span className="text-[10px] uppercase tracking-widest text-white/40">
            Gabinete FC Stadium
          </span>
        </div>
      </div>
    </header>
  )
}
