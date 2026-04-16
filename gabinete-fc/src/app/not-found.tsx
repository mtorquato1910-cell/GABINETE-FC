import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-8 bg-background">
      <div className="text-center space-y-4">
        <div className="text-8xl md:text-[160px] font-bold text-border leading-none select-none">
          404
        </div>
        <h1 className="text-2xl font-bold uppercase tracking-widest">Página não encontrada</h1>
        <p className="text-sm text-muted-foreground max-w-sm">
          A página que você está procurando não existe ou foi removida.
        </p>
      </div>
      <Link
        href="/"
        className="px-8 py-4 bg-primary text-primary-foreground font-bold text-xs uppercase tracking-widest hover:bg-foreground hover:text-background transition-colors"
      >
        Voltar ao início
      </Link>
    </div>
  )
}
