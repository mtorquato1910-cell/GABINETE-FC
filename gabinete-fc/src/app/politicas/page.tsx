import type { Metadata } from 'next'
import { Navbar } from '@/components/layout/Navbar'
import { Footer } from '@/components/layout/Footer'

export const metadata: Metadata = { title: 'Políticas | Gabinete FC' }

export default function PoliticasPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 px-4 md:px-6 py-16 max-w-3xl">
        <h1 className="text-4xl font-bold tracking-tighter uppercase mb-12">Políticas</h1>
        <div className="space-y-10 text-sm text-muted-foreground normal-case tracking-normal leading-relaxed">
          <section>
            <h2 className="text-foreground font-bold uppercase tracking-widest text-xs mb-4">Trocas e Devoluções</h2>
            <p>Aceitamos trocas e devoluções em até 30 dias após o recebimento do produto. O item deve estar em perfeitas condições, sem uso e com etiqueta. Entre em contato pelo email contato@gabinetefc.com.br.</p>
          </section>
          <section>
            <h2 className="text-foreground font-bold uppercase tracking-widest text-xs mb-4">Envio e Prazo</h2>
            <p>Enviamos para todo o Brasil pelos Correios (PAC e SEDEX). Frete grátis para pedidos acima de R$ 500. O prazo de entrega varia de 3 a 15 dias úteis dependendo da região.</p>
          </section>
          <section>
            <h2 className="text-foreground font-bold uppercase tracking-widest text-xs mb-4">Privacidade (LGPD)</h2>
            <p>Coletamos apenas os dados necessários para processar seus pedidos. Não compartilhamos suas informações com terceiros para fins comerciais. Você pode solicitar a exclusão de seus dados a qualquer momento.</p>
          </section>
          <section>
            <h2 className="text-foreground font-bold uppercase tracking-widest text-xs mb-4">Pagamento</h2>
            <p>Aceitamos cartão de crédito, débito e Pix. Pagamentos com Pix têm 5% de desconto. Parcelamos em até 12x no cartão de crédito sem juros para compras acima de R$ 300.</p>
          </section>
        </div>
      </main>
      <Footer />
    </div>
  )
}
