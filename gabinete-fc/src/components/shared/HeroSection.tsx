import Link from 'next/link'
import Image from 'next/image'

export function HeroSection() {
  return (
    <header className="grid grid-cols-1 lg:grid-cols-2 border-b border-[#1a1a1a]">
      {/* Left — Copy */}
      <div className="px-8 lg:px-12 py-10 lg:py-14 flex flex-col justify-between min-h-[65vh] lg:min-h-[80vh] border-b lg:border-b-0 lg:border-r border-[#1a1a1a] bg-black">
        {/* Top labels — verde igual ao Lovable */}
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
            className="hero-title text-[clamp(5rem,12vw,9.5rem)] uppercase mb-8 text-white"
            style={{
              fontFamily: "'Barlow Condensed', 'Space Grotesk', sans-serif",
              fontWeight: 900,
              letterSpacing: '-0.03em',
              lineHeight: 0.88,
            }}
          >
            A BELEZA<br />DO CAOS.
          </h1>
          <p className="text-white/60 max-w-[42ch] text-sm leading-relaxed lowercase font-normal">
            as camisas das maiores seleções do mundo. edições
            limitadas, estoque reduzido. sem reposição. garanta a sua
            antes que acabe.
          </p>
        </div>

        {/* CTA — igual ao Lovable: bordas brancas, fundo transparente */}
        <Link
          href="/loja"
          className="group inline-flex justify-between items-center w-full sm:w-max px-8 py-4 border border-white text-white font-bold text-[11px] uppercase tracking-widest hover:bg-white hover:text-black transition-all duration-300"
        >
          <span>VER CAMISAS</span>
          <span className="ml-10 group-hover:translate-x-2 transition-transform duration-300">-&gt;</span>
        </Link>
      </div>

      {/* Right — Stadium Image */}
      <div className="relative min-h-[45vh] lg:min-h-full bg-black overflow-hidden">
        <Image
          src="/images/campo-futebol.jpg"
          alt="Estádio Gabinete FC"
          fill
          className="object-cover opacity-80"
          priority
          sizes="(max-width: 1024px) 100vw, 50vw"
        />
        {/* Gradient fade esquerda — funde com o lado preto do texto */}
        <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-transparent to-transparent" />
        {/* Overlay sutil */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />

        {/* "01" em verde + CAMPAIGN / RIO — igual ao Lovable */}
        <div className="absolute bottom-6 right-6 text-right z-10">
          <div
            className="text-6xl font-black leading-none text-primary"
            style={{
              fontFamily: "'Barlow Condensed', sans-serif",
              fontWeight: 900,
            }}
          >
            01
          </div>
          <div className="text-[10px] uppercase tracking-widest text-white/50 mt-1">
            Campaign / Rio
          </div>
        </div>
      </div>
    </header>
  )
}
