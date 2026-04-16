import type { Metadata } from 'next'
import { Geist_Mono } from 'next/font/google'
import './globals.css'
import { Toaster } from '@/components/ui/sonner'

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
})

export const metadata: Metadata = {
  title: {
    default: 'Gabinete FC — Camisas de Futebol Premium',
    template: '%s | Gabinete FC',
  },
  description:
    'Camisas de futebol autênticas importadas. Seleções e clubes do mundo todo com entrega para todo o Brasil.',
  keywords: [
    'camisas de futebol',
    'camisa importada',
    'camisa tailandesa',
    'camisa premium',
    'gabinete fc',
  ],
  openGraph: {
    type: 'website',
    locale: 'pt_BR',
    siteName: 'Gabinete FC',
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="pt-BR" className={`${geistMono.variable} h-full`}>
      <body className="min-h-full flex flex-col bg-background text-foreground antialiased">
        {children}
        <Toaster position="bottom-right" theme="dark" />
      </body>
    </html>
  )
}
