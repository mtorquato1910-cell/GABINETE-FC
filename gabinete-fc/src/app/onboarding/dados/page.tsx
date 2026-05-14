import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { Logo } from '@/components/layout/Logo'
import { OnboardingForm } from './OnboardingForm'

interface Props {
  searchParams: Promise<{ next?: string }>
}

export default async function OnboardingDadosPage({ searchParams }: Props) {
  const session = await auth()
  if (!session) redirect('/auth/login')

  const { next } = await searchParams
  const target = next ?? '/minha-conta'

  // Verifica TUDO: CPF, telefone E pelo menos 1 endereço
  const [profile, addressCount] = await Promise.all([
    prisma.user.findUnique({
      where: { id: session.user.id },
      select: { name: true, cpf: true, phone: true },
    }),
    prisma.address.count({ where: { userId: session.user.id } }),
  ])

  if (profile?.cpf && profile.phone && addressCount > 0) {
    redirect(target)
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background px-4 py-12">
      <div className="w-full max-w-xl">
        <div className="mb-8 flex flex-col items-center gap-3">
          <Logo variant="text" />
          <p className="text-[10px] uppercase tracking-[0.25em] text-primary">
            ⚡ Email confirmado
          </p>
        </div>
        <div className="border border-border p-8">
          <h1 className="text-2xl font-bold uppercase tracking-tighter mb-2">
            Bem-vindo, {profile?.name?.split(' ')[0] ?? 'Cliente'}
          </h1>
          <p className="text-xs text-muted-foreground normal-case tracking-normal mb-6">
            Pra finalizar seu cadastro, precisamos do seu CPF, telefone e endereço.
            Esses dados ficam salvos no seu perfil pra agilizar suas próximas compras.
          </p>
          <OnboardingForm nextPath={target} />
        </div>
      </div>
    </div>
  )
}
