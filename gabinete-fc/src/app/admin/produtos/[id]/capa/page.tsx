import { redirect, notFound } from 'next/navigation'
import { prisma } from '@/lib/db'
import { auth } from '@/lib/auth'
import { parseJsonField } from '@/lib/db-helpers'
import { CapaForm } from './CapaForm'

interface Props {
  params: Promise<{ id: string }>
}

export default async function CapaPage({ params }: Props) {
  const session = await auth()
  if (!session) redirect('/auth/login?callbackUrl=/admin/produtos')
  if (session.user.role !== 'admin') redirect('/')

  const { id } = await params
  const product = await prisma.product.findUnique({ where: { id } })
  if (!product) notFound()

  const baseSlug = product.slug.replace(/-torcedor$/, '')
  const pair = await prisma.product.findMany({
    where: { slug: { in: [baseSlug, `${baseSlug}-torcedor`] } },
    select: { id: true, slug: true, name: true, version: true },
  })

  const initialImages = parseJsonField<string[]>(product.images, [])
  const hasCover =
    initialImages.length >= 2 &&
    initialImages[0]?.includes('/covers/') &&
    initialImages[1]?.includes('/covers/')

  return (
    <div>
      <div className="px-6 py-6 border-b border-border">
        <h1 className="text-xl font-bold uppercase tracking-widest">
          Capa AI — {product.team} {product.type === 'reserva' ? 'II' : product.type === 'terceiro' ? 'III' : 'I'}
        </h1>
        <p className="text-xs text-muted-foreground mt-1">
          Slug base: <code>{baseSlug}</code> · Compartilhado entre{' '}
          {pair.map((p) => p.version).join(' + ')}
        </p>
        {hasCover && (
          <p className="text-xs text-primary mt-2">
            ⚡ Já existe capa salva — gerar novamente substituirá.
          </p>
        )}
      </div>
      <div className="p-6">
        <CapaForm
          productId={product.id}
          slug={product.slug}
          team={product.team}
          variant={product.type === 'reserva' ? 'II' : product.type === 'terceiro' ? 'III' : 'I'}
          existingGray={hasCover ? initialImages[0] : null}
          existingColor={hasCover ? initialImages[1] : null}
        />
      </div>
    </div>
  )
}
