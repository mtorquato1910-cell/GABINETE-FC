import { Navbar } from '@/components/layout/Navbar'
import { Footer } from '@/components/layout/Footer'
import { HeroSection } from '@/components/shared/HeroSection'
import { MarqueeBanner } from '@/components/shared/MarqueeBanner'
import { ProductGrid } from '@/components/product/ProductGrid'
import { NewsletterSection } from '@/components/shared/NewsletterSection'
import { getFeaturedProducts } from '@/lib/actions/products'
import Link from 'next/link'

export const revalidate = 3600

export default async function HomePage() {
  const featured = await getFeaturedProducts()

  return (
    <div className="min-h-screen flex flex-col bg-black">
      <Navbar />
      <main className="flex-1">
        <HeroSection />
        <MarqueeBanner />

        {/* Destaques */}
        <section>
          <div className="flex justify-between items-center px-8 py-5 border-b border-[#1a1a1a] bg-black">
            <div className="flex items-baseline gap-5">
              <h2
                className="text-2xl font-black uppercase text-white leading-none"
                style={{
                  fontFamily: "'Barlow Condensed', sans-serif",
                  fontWeight: 900,
                  letterSpacing: '-0.03em',
                }}
              >
                Destaques
              </h2>
              <span className="text-[9px] text-white/30 uppercase tracking-[0.2em] font-bold hidden sm:block">
                Seleção da semana
              </span>
            </div>
            <Link
              href="/loja"
              className="group text-[9px] font-bold text-white/30 uppercase tracking-[0.2em] hover:text-white transition-colors flex items-center gap-2"
            >
              Ver todos
              <span className="group-hover:translate-x-1.5 transition-transform duration-200">→</span>
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
