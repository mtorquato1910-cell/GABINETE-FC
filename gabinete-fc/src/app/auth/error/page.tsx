import Link from 'next/link'
import { Logo } from '@/components/layout/Logo'
import { CheckCircle2 } from 'lucide-react'

const REASON_LABELS: Record<string, string> = {
  invalid_code: 'O link de autenticação expirou ou já foi usado.',
  invalid_token: 'O link de confirmação expirou ou já foi usado.',
  missing_params: 'Link de autenticação inválido — abra o email novamente.',
  used: 'Esse link já foi usado. Você provavelmente já está autenticado.',
}

interface Props {
  searchParams: Promise<{ reason?: string; detail?: string }>
}

export default async function AuthErrorPage({ searchParams }: Props) {
  const { reason, detail } = await searchParams
  const message = (reason && REASON_LABELS[reason]) ?? 'Ocorreu um erro na autenticação.'

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm text-center">
        <div className="mb-8 flex justify-center">
          <Logo variant="text" />
        </div>
        <h1 className="text-3xl font-bold uppercase tracking-tighter mb-4">Erro</h1>
        <p className="text-muted-foreground text-xs uppercase tracking-widest mb-2">{message}</p>
        {detail && (
          <p className="text-[10px] text-muted-foreground/70 normal-case tracking-normal mb-6">
            Detalhe técnico: {detail}
          </p>
        )}
        <p className="text-[10px] text-muted-foreground normal-case tracking-normal mb-8">
          Se você já confirmou seu email antes, é só entrar normalmente.
        </p>
        <div className="flex flex-col gap-3">
          <Link
            href="/auth/login"
            className="inline-block px-8 py-4 bg-primary text-primary-foreground font-bold text-xs uppercase tracking-widest hover:bg-foreground hover:text-background transition-colors"
          >
            <CheckCircle2 className="w-3 h-3 inline mr-2" />
            Fazer login
          </Link>
          <Link
            href="/"
            className="inline-block px-8 py-3 border border-border text-xs uppercase tracking-widest hover:border-primary hover:text-primary transition-colors"
          >
            Voltar para a loja
          </Link>
        </div>
      </div>
    </div>
  )
}
