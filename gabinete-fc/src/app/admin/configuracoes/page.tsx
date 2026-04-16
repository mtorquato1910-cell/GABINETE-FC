import { prisma } from '@/lib/db'
import { StoreSettingsForm } from '@/components/admin/StoreSettingsForm'

export default async function ConfiguracoesAdminPage() {
  const settings = await prisma.storeSetting.findMany({ orderBy: [{ category: 'asc' }, { key: 'asc' }] })
  const settingsMap = Object.fromEntries(settings.map(s => [s.key, s.value]))

  return (
    <div>
      <div className="px-6 py-6 border-b border-border">
        <h1 className="text-xl font-bold uppercase tracking-widest">Configurações</h1>
      </div>
      <div className="p-6 max-w-2xl">
        <StoreSettingsForm settings={settingsMap} />
      </div>
    </div>
  )
}
