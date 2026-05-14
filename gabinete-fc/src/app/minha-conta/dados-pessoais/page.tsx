import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { DadosPessoaisForm } from './DadosPessoaisForm'

export default async function DadosPessoaisPage() {
  const session = await auth()
  if (!session) redirect('/auth/login')

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { name: true, email: true, phone: true, cpf: true, createdAt: true },
  })

  return (
    <div>
      <div className="border-b border-border pb-4 mb-6">
        <h2 className="text-xs font-bold uppercase tracking-widest">Dados Pessoais</h2>
        <p className="text-[10px] text-muted-foreground uppercase tracking-widest mt-1 normal-case">
          Mantenha seus dados atualizados pra entregas e atendimento
        </p>
      </div>
      <DadosPessoaisForm
        initial={{
          name: user?.name ?? '',
          email: user?.email ?? '',
          phone: user?.phone ?? '',
          cpf: user?.cpf ?? '',
        }}
      />
      {user?.createdAt && (
        <p className="text-[10px] text-muted-foreground uppercase tracking-widest mt-6 normal-case">
          Membro desde{' '}
          {new Intl.DateTimeFormat('pt-BR', { month: 'long', year: 'numeric' }).format(
            user.createdAt
          )}
        </p>
      )}
    </div>
  )
}
