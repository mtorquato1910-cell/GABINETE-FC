import { Navbar } from '@/components/layout/Navbar'
import { Footer } from '@/components/layout/Footer'
import { HeroSection } from '@/components/shared/HeroSection'
import { MarqueeBanner } from '@/components/shared/MarqueeBanner'
import { ProductGrid } from '@/components/product/ProductGrid'
import { NewsletterSection } from '@/components/shared/NewsletterSection'
import { getFeaturedProducts } from '@/data/products'
import Link from 'next/link'

export default function HomePage() {
  const featured = getFeaturedProducts()

  return (
    <div className="min-h-screen flex flex-col uppercase tracking-widest">
      <Navbar />
      <main className="flex-1">
        <HeroSection />
        <MarqueeBanner />

        {/* Featured products */}
        <section>
          <div className="flex justify-between items-center px-4 md:px-6 py-4 border-b border-border">
            <h2 className="text-xs font-bold uppercase tracking-widest">Destaques</h2>
            <Link
              href="/loja"
              className="text-xs text-muted-foreground hover:text-primary transition-colors uppercase tracking-widest"
            >
              Ver todos →
            </Link>
          </div>
          <ProductGrid products={featured} showFilters={false} />
        </section>

        <NewsletterSection />
      </main>
      <Footer />
    </div>
  )
}
