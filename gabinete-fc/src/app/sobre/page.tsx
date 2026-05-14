import type { Metadata } from 'next'
import { Navbar } from '@/components/layout/Navbar'
import { Footer } from '@/components/layout/Footer'

export const metadata: Metadata = {
  title: 'Sobre | Gabinete FC',
  description: 'Conheça o Gabinete FC — a loja de camisas de futebol premium.',
}

export default function SobrePage() {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 px-4 md:px-6 py-16 max-w-3xl">
        <h1 className="text-4xl md:text-6xl font-bold tracking-tighter uppercase mb-12">Sobre</h1>
        <div className="prose prose-invert max-w-none text-sm leading-relaxed text-muted-foreground space-y-6 normal-case tracking-normal">
          <p className="text-foreground text-lg">
            Gabinete FC é a loja para quem leva futebol a sério.
          </p>
          <p>
            Nascemos da paixão pelo esporte mais popular do planeta. Aqui você encontra camisas autênticas
            das maiores seleções e clubes do mundo, com qualidade premium e entrega garantida para todo o Brasil.
          </p>
          <p>
            Trabalhamos com fornecedores diretos para garantir produtos idênticos aos usados pelos jogadores
            — mesmo material, mesmo acabamento, mesmo DNA.
          </p>
          <h2 className="text-foreground font-bold uppercase tracking-widest text-xs mt-8">Nossa missão</h2>
          <p>
            Aproximar os torcedores das suas equipes. Cada camisa é um símbolo de identidade,
            de pertencimento, de história. Vendemos isso.
          </p>
          <h2 className="text-foreground font-bold uppercase tracking-widest text-xs mt-8">Contato</h2>
          <p>tecnologia@unfoldgrowth.com.br</p>
        </div>
      </main>
      <Footer />
    </div>
  )
}
