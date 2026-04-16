import Navbar from "@/components/Navbar";
import HeroSection from "@/components/HeroSection";
import MarqueeBanner from "@/components/MarqueeBanner";
import ProductGrid from "@/components/ProductGrid";
import NewsletterSection from "@/components/NewsletterSection";
import Footer from "@/components/Footer";

const Index = () => {
  return (
    <div className="min-h-screen flex flex-col uppercase tracking-widest">
      <Navbar />
      <HeroSection />
      <MarqueeBanner />
      <ProductGrid />
      <NewsletterSection />
      <Footer />
    </div>
  );
};

export default Index;
