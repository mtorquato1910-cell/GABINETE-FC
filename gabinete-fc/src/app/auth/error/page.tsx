import Link from 'next/link'
import { Logo } from '@/components/layout/Logo'

export default function AuthErrorPage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm text-center">
        <div className="mb-8 flex justify-center">
          <Logo variant="text" />
        </div>
        <h1 className="text-3xl font-bold uppercase tracking-tighter mb-4">Erro</h1>
        <p className="text-muted-foreground text-xs uppercase tracking-widest mb-8">
          Ocorreu um erro na autenticação.
        </p>
        <Link
          href="/auth/login"
          className="inline-block px-8 py-4 bg-primary text-primary-foreground font-bold text-xs uppercase tracking-widest hover:bg-foreground hover:text-background transition-colors"
        >
          Tentar novamente
        </Link>
      </div>
    </div>
  )
}
