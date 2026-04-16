import Link from 'next/link'

function FootballField() {
  return (
    <svg
      viewBox="0 0 105 68"
      xmlns="http://www.w3.org/2000/svg"
      className="w-full h-full"
      style={{ maxHeight: '100%' }}
      aria-hidden="true"
    >
      {/* Background */}
      <rect width="105" height="68" fill="#0a0a0a" />

      {/* Subtle grass stripes */}
      {[0,1,2,3,4,5,6].map(i => (
        <rect key={i} x={i * 15} y="0" width="15" height="68"
          fill={i % 2 === 0 ? '#0f0f0f' : '#0a0a0a'} />
      ))}

      {/* Field border */}
      <rect x="2" y="2" width="101" height="64" fill="none" stroke="white" strokeWidth="0.5" opacity="0.8" />

      {/* Center line */}
      <line x1="52.5" y1="2" x2="52.5" y2="66" stroke="white" strokeWidth="0.5" opacity="0.8" />

      {/* Center circle */}
      <circle cx="52.5" cy="34" r="9.15" fill="none" stroke="white" strokeWidth="0.5" opacity="0.8" />

      {/* Center spot */}
      <circle cx="52.5" cy="34" r="0.6" fill="white" opacity="0.9" />

      {/* Left penalty area */}
      <rect x="2" y="13.84" width="16.5" height="40.32" fill="none" stroke="white" strokeWidth="0.5" opacity="0.8" />

      {/* Right penalty area */}
      <rect x="86.5" y="13.84" width="16.5" height="40.32" fill="none" stroke="white" strokeWidth="0.5" opacity="0.8" />

      {/* Left goal area */}
      <rect x="2" y="24.84" width="5.5" height="18.32" fill="none" stroke="white" strokeWidth="0.5" opacity="0.8" />

      {/* Right goal area */}
      <rect x="97.5" y="24.84" width="5.5" height="18.32" fill="none" stroke="white" strokeWidth="0.5" opacity="0.8" />

      {/* Left goal */}
      <rect x="0" y="28.84" width="2" height="10.32" fill="none" stroke="white" strokeWidth="0.5" opacity="0.6" />

      {/* Right goal */}
      <rect x="103" y="28.84" width="2" height="10.32" fill="none" stroke="white" strokeWidth="0.5" opacity="0.6" />

      {/* Left penalty spot */}
      <circle cx="13.5" cy="34" r="0.6" fill="white" opacity="0.9" />

      {/* Right penalty spot */}
      <circle cx="91.5" cy="34" r="0.6" fill="white" opacity="0.9" />

      {/* Left penalty arc */}
      <path d="M 18.5 27.5 A 9.15 9.15 0 0 1 18.5 40.5" fill="none" stroke="white" strokeWidth="0.5" opacity="0.8" />

      {/* Right penalty arc */}
      <path d="M 86.5 27.5 A 9.15 9.15 0 0 0 86.5 40.5" fill="none" stroke="white" strokeWidth="0.5" opacity="0.8" />

      {/* Corner arcs */}
      <path d="M 2 4.5 A 2.5 2.5 0 0 0 4.5 2" fill="none" stroke="white" strokeWidth="0.5" opacity="0.8" />
      <path d="M 100.5 2 A 2.5 2.5 0 0 0 103 4.5" fill="none" stroke="white" strokeWidth="0.5" opacity="0.8" />
      <path d="M 2 63.5 A 2.5 2.5 0 0 1 4.5 66" fill="none" stroke="white" strokeWidth="0.5" opacity="0.8" />
      <path d="M 100.5 66 A 2.5 2.5 0 0 1 103 63.5" fill="none" stroke="white" strokeWidth="0.5" opacity="0.8" />
    </svg>
  )
}

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

      {/* Right — Campo de futebol */}
      <div className="relative min-h-[40vh] lg:min-h-full bg-[#0a0a0a] flex items-center justify-center overflow-hidden p-4 lg:p-8">
        <div className="w-full h-full flex items-center justify-center" style={{ minHeight: '300px' }}>
          <FootballField />
        </div>
        <div className="absolute bottom-6 right-6 text-right">
          <div className="text-4xl font-bold text-primary">01</div>
          <div className="text-[10px] uppercase tracking-widest text-muted-foreground">Campaign / 2026</div>
        </div>
        <div className="absolute top-6 left-6">
          <div className="text-[10px] uppercase tracking-widest text-muted-foreground opacity-50">
            Gabinete FC Stadium
          </div>
        </div>
      </div>
    </header>
  )
}
