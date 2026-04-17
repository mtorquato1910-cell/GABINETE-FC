import { Navbar } from '@/components/layout/Navbar'
import { Footer } from '@/components/layout/Footer'
import { HeroSection } from '@/components/shared/HeroSection'
import { MarqueeBanner } from '@/components/shared/MarqueeBanner'
import { ProductGrid } from '@/components/product/ProductGrid'
import { NewsletterSection } from '@/components/shared/NewsletterSection'
import { getFeaturedProducts } from '@/lib/actions/products'
import Link from 'next/link'

export const revalidate = 3600 // Revalida a cada hora

export default async function HomePage() {
  const featured = await getFeaturedProducts()

  return (
    <div className="min-h-screen flex flex-col uppercase tracking-widest">
      <Navbar />
      <main className="flex-1">
        <HeroSection />
        <MarqueeBanner />

        {/* Destaques */}
        <section>
          <div className="flex justify-between items-center px-4 md:px-8 py-4 border-b border-[#1a1a1a] bg-[#050505]">
            <div className="flex items-center gap-4">
              <h2
                className="text-2xl md:text-3xl font-black uppercase leading-none"
                style={{ fontFamily: "'Barlow Condensed', 'Space Grotesk', sans-serif", fontWeight: 900 }}
              >
                Destaques
              </h2>
              <span className="hidden sm:block text-[9px] font-bold uppercase tracking-[0.2em] text-muted-foreground">
                Seleção da semana
              </span>
            </div>
            <Link
              href="/loja"
              className="text-[10px] font-bold text-muted-foreground hover:text-primary transition-colors uppercase tracking-widest group flex items-center gap-2"
            >
              Ver todos
              <span className="group-hover:translate-x-1 transition-transform duration-200">→</span>
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
