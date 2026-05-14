import type { Metadata } from 'next'
import { Navbar } from '@/components/layout/Navbar'
import { Footer } from '@/components/layout/Footer'
import { ProductGrid } from '@/components/product/ProductGrid'
import { getProductsByCategory } from '@/lib/actions/products'

interface Props {
  params: Promise<{ categoria: string }>
}

const categoryLabels: Record<string, string> = {
  'selecoes': 'Seleções',
  'clubes-europeus': 'Clubes Europeus',
  'clubes-brasileiros': 'Clubes Brasileiros',
  'retro': 'Retrô',
  'especial': 'Especiais',
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { categoria } = await params
  const label = categoryLabels[categoria] ?? categoria
  return {
    title: `${label} | Gabinete FC`,
    description: `Camisas de ${label}. Importadas, entrega para todo o Brasil.`,
  }
}

export default async function CategoriaPage({ params }: Props) {
  const { categoria } = await params
  const products = await getProductsByCategory(categoria)
  const label = categoryLabels[categoria] ?? categoria
  const isSelecoes = categoria === 'selecoes'

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1">
        <div className="px-4 md:px-6 py-8 border-b border-border">
          <h1 className="text-3xl md:text-5xl font-bold tracking-tighter uppercase">{label}</h1>
          <p className="text-muted-foreground text-sm mt-2">
            {products.length} produto{products.length !== 1 ? 's' : ''}
            {isSelecoes && ' · Versão Jogador (R$ 269,90 / R$ 249,90) ou Torcedor (R$ 239,90)'}
          </p>
        </div>
        <ProductGrid
          products={products}
          showFilters={false}
          showVersionFilter={isSelecoes}
        />
      </main>
      <Footer />
    </div>
  )
}
