import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'

export default async function PerfilPage() {
  const session = await auth()
  const user = session?.user
    ? await prisma.user.findUnique({
        where: { id: (session.user as { id?: string }).id },
        select: { name: true, email: true, phone: true, createdAt: true },
      })
    : null

  return (
    <div className="max-w-lg">
      <h2 className="text-xs font-bold uppercase tracking-widest mb-6 border-b border-border pb-4">
        Meu Perfil
      </h2>
      <div className="grid grid-cols-2 gap-4 text-xs uppercase tracking-wider">
        <div>
          <span className="text-muted-foreground block mb-1">Nome</span>
          <span className="font-bold">{user?.name ?? '—'}</span>
        </div>
        <div>
          <span className="text-muted-foreground block mb-1">Email</span>
          <span className="font-bold normal-case">{user?.email ?? '—'}</span>
        </div>
        <div>
          <span className="text-muted-foreground block mb-1">Telefone</span>
          <span className="font-bold">{user?.phone ?? '—'}</span>
        </div>
        <div>
          <span className="text-muted-foreground block mb-1">Membro desde</span>
          <span className="font-bold">
            {user?.createdAt
              ? new Intl.DateTimeFormat('pt-BR', { month: 'long', year: 'numeric' }).format(user.createdAt)
              : '—'}
          </span>
        </div>
      </div>
      <p className="text-[10px] text-muted-foreground mt-8 uppercase tracking-widest">
        Edição de perfil — em breve.
      </p>
    </div>
  )
}
