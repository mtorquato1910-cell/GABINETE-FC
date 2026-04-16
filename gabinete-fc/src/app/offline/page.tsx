import Link from 'next/link'

export default function OfflinePage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background px-4 text-center">
      <h1 className="text-4xl font-bold tracking-tighter uppercase mb-4">Sem conexão</h1>
      <p className="text-muted-foreground text-xs uppercase tracking-widest mb-8">
        Verifique sua conexão com a internet.
      </p>
      <Link
        href="/"
        className="px-8 py-4 bg-primary text-primary-foreground font-bold text-xs uppercase tracking-widest hover:bg-foreground hover:text-background transition-colors"
      >
        Tentar Novamente
      </Link>
    </div>
  )
}
