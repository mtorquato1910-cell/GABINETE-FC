import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { EnderecosClient } from './EnderecosClient'

export default async function EnderecosPage() {
  const session = await auth()
  if (!session) redirect('/auth/login')

  const addresses = await prisma.address.findMany({
    where: { userId: session.user.id },
    orderBy: [{ isDefault: 'desc' }, { id: 'asc' }],
  })

  return (
    <div>
      <div className="border-b border-border pb-4 mb-6">
        <h2 className="text-xs font-bold uppercase tracking-widest">Meus Endereços</h2>
        <p className="text-[10px] text-muted-foreground uppercase tracking-widest mt-1 normal-case">
          Adicione, edite ou remova endereços de entrega
        </p>
      </div>
      <EnderecosClient
        addresses={addresses.map((a) => ({
          id: a.id,
          label: a.label,
          recipientName: a.recipientName,
          recipientCpf: a.recipientCpf,
          recipientPhone: a.recipientPhone,
          zipCode: a.zipCode,
          street: a.street,
          number: a.number,
          complement: a.complement ?? '',
          neighborhood: a.neighborhood,
          city: a.city,
          state: a.state,
          isDefault: a.isDefault,
        }))}
      />
    </div>
  )
}
