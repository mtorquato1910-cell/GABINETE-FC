import type { Metadata } from 'next'
import { Navbar } from '@/components/layout/Navbar'
import { Footer } from '@/components/layout/Footer'

export const metadata: Metadata = { title: 'FAQ | Gabinete FC' }

const faqs = [
  { q: 'As camisas são originais?', a: 'Sim. Trabalhamos com fornecedores diretos que produzem camisas com o mesmo material e qualidade das versões oficiais.' },
  { q: 'Qual o prazo de entrega?', a: 'De 3 a 15 dias úteis dependendo da sua região. Enviamos via Correios PAC e SEDEX.' },
  { q: 'Tenho frete grátis?', a: 'Sim, para compras acima de R$ 500. Abaixo disso, o frete é calculado pelo CEP no checkout.' },
  { q: 'Posso trocar o tamanho?', a: 'Sim, em até 30 dias após o recebimento. O produto deve estar sem uso e com etiqueta.' },
  { q: 'Como rastrear meu pedido?', a: 'Assim que seu pedido for enviado, você receberá o código de rastreio por email.' },
  { q: 'Vocês têm loja física?', a: 'Não, somos 100% online. Isso nos permite oferecer os melhores preços.' },
  { q: 'Como funciona o desconto no Pix?', a: '5% de desconto no valor total para pagamentos realizados via Pix.' },
]

export default function FaqPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 px-4 md:px-6 py-16 max-w-3xl">
        <h1 className="text-4xl font-bold tracking-tighter uppercase mb-12">Perguntas Frequentes</h1>
        <div className="flex flex-col gap-0">
          {faqs.map((faq, i) => (
            <details key={i} className="border-b border-border group py-4">
              <summary className="text-xs font-bold uppercase tracking-widest cursor-pointer list-none flex justify-between items-center hover:text-primary transition-colors">
                {faq.q}
                <span className="text-primary ml-4 group-open:rotate-45 transition-transform inline-block">+</span>
              </summary>
              <p className="mt-3 text-sm text-muted-foreground normal-case tracking-normal leading-relaxed">
                {faq.a}
              </p>
            </details>
          ))}
        </div>
      </main>
      <Footer />
    </div>
  )
}
