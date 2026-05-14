import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { Navbar } from '@/components/layout/Navbar'
import { Footer } from '@/components/layout/Footer'
import { ProductDetailClient } from '@/components/product/ProductDetailClient'
import { ReviewSection } from '@/components/product/ReviewSection'
import { RelatedJerseys } from '@/components/product/RelatedJerseys'
import { getProductBySlug, getAllProductSlugs } from '@/lib/actions/products'
import { getProductReviews } from '@/lib/actions/reviews'
import { auth } from '@/lib/auth'

interface Props {
  params: Promise<{ slug: string }>
}

export async function generateStaticParams() {
  const slugs = await getAllProductSlugs()
  return slugs.map((slug) => ({ slug }))
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const product = await getProductBySlug(slug)
  if (!product) return { title: 'Produto não encontrado | Gabinete FC' }
  return {
    title: `${product.name} | Gabinete FC`,
    description: product.description,
    openGraph: {
      title: `${product.name} | Gabinete FC`,
      description: product.description,
      images: product.images[0] ? [{ url: product.images[0] }] : [],
    },
  }
}

export default async function ProductPage({ params }: Props) {
  const { slug } = await params
  const [product, session] = await Promise.all([
    getProductBySlug(slug),
    auth(),
  ])
  if (!product) notFound()

  const reviews = await getProductReviews(product.id)
  const isLoggedIn = !!session?.user

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1">
        <ProductDetailClient product={product} />
        <RelatedJerseys
          productId={product.id}
          category={product.category}
          team={product.team}
        />
        <ReviewSection
          productId={product.id}
          reviews={reviews}
          isLoggedIn={isLoggedIn}
        />
      </main>
      <Footer />
    </div>
  )
}
