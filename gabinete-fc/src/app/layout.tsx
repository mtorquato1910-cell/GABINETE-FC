import type { Metadata, Viewport } from 'next'
import { Geist_Mono } from 'next/font/google'
import { Toaster } from '@/components/ui/sonner'
import { SupportChat } from '@/components/shared/SupportChat'
import { BackToTop } from '@/components/shared/BackToTop'
import { AnalyticsTracker } from '@/components/shared/AnalyticsTracker'
import { PromoBar } from '@/components/shared/PromoBar'
import { AuthListener } from '@/components/shared/AuthListener'
import './globals.css'

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
})

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'),
  title: {
    default: 'Gabinete FC — Camisas de Futebol Premium',
    template: '%s | Gabinete FC',
  },
  description: 'Camisas de futebol autênticas de seleções e clubes do mundo todo. Entrega para todo o Brasil.',
  keywords: ['camisas de futebol', 'jersey importada', 'camisas seleções', 'camisa Brasil', 'camisa Argentina', 'futebol'],
  authors: [{ name: 'Gabinete FC' }],
  creator: 'Gabinete FC',
  openGraph: {
    type: 'website',
    locale: 'pt_BR',
    url: '/',
    siteName: 'Gabinete FC',
    title: 'Gabinete FC — Camisas de Futebol Premium',
    description: 'Camisas autênticas das maiores seleções e clubes do mundo. Entrega para todo o Brasil.',
    images: [{ url: '/logo/gabinete-fc-logo.png', width: 1200, height: 630, alt: 'Gabinete FC' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Gabinete FC — Camisas de Futebol Premium',
    description: 'Camisas autênticas de futebol.',
    images: ['/logo/gabinete-fc-logo.png'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, 'max-image-preview': 'large' },
  },
  icons: {
    icon: [{ url: '/logo/gabinete-fc-icon.png' }],
    apple: [{ url: '/logo/gabinete-fc-icon.png' }],
  },
}

export const viewport: Viewport = {
  themeColor: '#050505',
  width: 'device-width',
  initialScale: 1,
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="pt-BR" className="dark">
      <body className={`${geistMono.variable} antialiased`}>
        <AuthListener />
        <PromoBar />
        {children}
        <Toaster position="bottom-right" theme="dark" />
        <SupportChat />
        <BackToTop />
        <AnalyticsTracker />
      </body>
    </html>
  )
}
