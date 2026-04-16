import { prisma } from '@/lib/db'
import { parseJsonField } from '@/lib/db-helpers'
import { notFound } from 'next/navigation'
import { ProductForm } from '@/components/admin/ProductForm'

interface Props { params: Promise<{ id: string }> }

export default async function EditarProdutoPage({ params }: Props) {
  const { id } = await params
  const product = await prisma.product.findUnique({ where: { id } })
  if (!product) notFound()

  const initialData = {
    id: product.id,
    name: product.name,
    slug: product.slug,
    description: product.description ?? '',
    price: product.price,
    costPrice: product.costPrice ?? undefined,
    supplierCode: product.supplierCode ?? '',
    category: product.category,
    team: product.team,
    type: product.type,
    badge: product.badge ?? '',
    sizesAvailable: parseJsonField<string[]>(product.sizesAvailable, []),
    images: parseJsonField<string[]>(product.images, []),
    isActive: product.isActive,
    isFeatured: product.isFeatured,
    metaTitle: product.metaTitle ?? '',
    metaDescription: product.metaDescription ?? '',
  }

  return (
    <div>
      <div className="px-6 py-6 border-b border-border">
        <h1 className="text-xl font-bold uppercase tracking-widest">Editar: {product.name}</h1>
      </div>
      <div className="p-6 max-w-2xl">
        <ProductForm initialData={initialData} />
      </div>
    </div>
  )
}
