import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'

export default async function EnderecosPage() {
  const session = await auth()
  const userId = (session?.user as { id?: string })?.id

  const addresses = userId
    ? await prisma.address.findMany({ where: { userId }, orderBy: { isDefault: 'desc' } })
    : []

  return (
    <div>
      <h2 className="text-xs font-bold uppercase tracking-widest mb-6 border-b border-border pb-4">
        Meus Endereços
      </h2>
      {addresses.length === 0 ? (
        <p className="text-muted-foreground text-xs uppercase tracking-widest">
          Nenhum endereço cadastrado.
        </p>
      ) : (
        <div className="flex flex-col gap-3">
          {addresses.map((addr) => (
            <div key={addr.id} className="border border-border p-4">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider mb-1">
                    {addr.label} {addr.isDefault && <span className="text-primary ml-2">— Padrão</span>}
                  </p>
                  <p className="text-xs text-muted-foreground normal-case leading-relaxed">
                    {addr.street}, {addr.number}{addr.complement ? ` - ${addr.complement}` : ''}<br />
                    {addr.neighborhood} — {addr.city}/{addr.state}<br />
                    CEP {addr.zipCode}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
      <p className="text-[10px] text-muted-foreground mt-6 uppercase tracking-widest">
        Adicionar endereço — disponível no checkout.
      </p>
    </div>
  )
}
