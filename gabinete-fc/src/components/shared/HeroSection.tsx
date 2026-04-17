import Link from 'next/link'
import Image from 'next/image'

export function HeroSection() {
  return (
    <header className="grid grid-cols-1 lg:grid-cols-2 border-b border-[#1a1a1a]">
      {/* Left — Copy */}
      <div className="px-8 lg:px-14 py-12 lg:py-16 flex flex-col justify-between min-h-[70vh] lg:min-h-[85vh] border-b lg:border-b-0 lg:border-r border-[#1a1a1a] bg-black">
        {/* Top labels */}
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-primary dot-pulse" />
            <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/60">
              Status: Live
            </span>
          </div>
          <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/40">
            Vol. 04
          </span>
        </div>

        {/* Hero text */}
        <div className="my-12 lg:my-0 lg:flex-1 lg:flex lg:flex-col lg:justify-center">
          <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-white/40 mb-6">
            Gabinete FC — Coleção Oficial
          </p>
          <h1
            className="hero-title text-[clamp(4.5rem,11vw,9rem)] uppercase mb-8 text-white"
            style={{
              fontFamily: "'Barlow Condensed', 'Space Grotesk', sans-serif",
              fontWeight: 800,
              letterSpacing: '-0.05em',
              lineHeight: 0.9,
            }}
          >
            A BELEZA<br />DO CAOS.
          </h1>
          <p className="text-white/60 max-w-[38ch] text-sm leading-relaxed lowercase font-normal">
            as camisas das maiores seleções e clubes do mundo. edições limitadas,
            estoque reduzido. sem reposição. garanta a sua.
          </p>
        </div>

        {/* CTA */}
        <Link
          href="/loja"
          className="group inline-flex justify-between items-center w-full sm:w-max px-8 py-4 border border-white/20 text-white font-bold text-[11px] uppercase tracking-[0.2em] hover:bg-white hover:border-white hover:text-black transition-all duration-400"
        >
          <span>Ver Camisas</span>
          <span className="ml-10 group-hover:translate-x-2 transition-transform duration-300">→</span>
        </Link>
      </div>

      {/* Right — Stadium Image com gradient mask */}
      <div className="relative min-h-[50vh] lg:min-h-full bg-black overflow-hidden">
        <Image
          src="/images/campo-futebol.jpg"
          alt="Estádio Gabinete FC"
          fill
          className="object-cover brightness-110 contrast-110"
          priority
          sizes="(max-width: 1024px) 100vw, 50vw"
        />

        {/* Gradient fade — funde imagem com fundo preto à esquerda */}
        <div className="absolute inset-0 bg-gradient-to-r from-black via-black/20 to-transparent" />

        {/* Overlay sutil geral */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/10" />

        {/* Campaign badge */}
        <div className="absolute bottom-8 right-8 text-right z-10">
          <div
            className="text-6xl font-black leading-none text-white/90"
            style={{
              fontFamily: "'Barlow Condensed', sans-serif",
              fontWeight: 900,
              letterSpacing: '-0.04em',
            }}
          >
            01
          </div>
          <div className="text-[9px] uppercase tracking-[0.25em] text-white/40 mt-1">
            Campaign / Rio
          </div>
        </div>

        <div className="absolute top-8 right-8 z-10">
          <span className="text-[9px] uppercase tracking-[0.2em] text-white/30 font-bold">
            Gabinete FC Stadium
          </span>
        </div>
      </div>
    </header>
  )
}
