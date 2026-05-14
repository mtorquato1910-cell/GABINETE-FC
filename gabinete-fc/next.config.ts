import type { NextConfig } from 'next'
import path from 'path'

// Headers de segurança aplicados em todas as rotas.
// CSP usa unsafe-inline pra cobrir runtime do Next.js (App Router injeta estilos inline).
const SECURITY_HEADERS = [
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  {
    key: 'Permissions-Policy',
    value: 'camera=(), microphone=(), geolocation=(), interest-cohort=()',
  },
  {
    key: 'Strict-Transport-Security',
    value: 'max-age=63072000; includeSubDomains; preload',
  },
  {
    key: 'Content-Security-Policy',
    value: [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://js.stripe.com https://*.vercel-insights.com https://*.vercel-analytics.com https://connect.facebook.net",
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      "font-src 'self' https://fonts.gstatic.com data:",
      "img-src 'self' data: blob: https://utfs.io https://*.supabase.co https://*.stripe.com https://www.facebook.com",
      "connect-src 'self' https://*.supabase.co wss://*.supabase.co https://api.stripe.com https://*.vercel-insights.com https://*.vercel-analytics.com https://viacep.com.br https://www.facebook.com",
      "frame-src 'self' https://js.stripe.com https://hooks.stripe.com",
      "worker-src 'self' blob:",
      "object-src 'none'",
      "base-uri 'self'",
      "form-action 'self'",
      "frame-ancestors 'none'",
    ].join('; '),
  },
]

const nextConfig: NextConfig = {
  turbopack: {
    root: path.resolve(__dirname),
  },

  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'utfs.io' },
      { protocol: 'http', hostname: 'localhost' },
    ],
  },

  serverExternalPackages: ['@prisma/client', 'prisma'],

  // Headers de segurança em produção
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: SECURITY_HEADERS,
      },
    ]
  },

  // Não expõe `X-Powered-By: Next.js` (fingerprinting)
  poweredByHeader: false,

  // Produção: source maps desligados (ajuda na ofuscação do client)
  productionBrowserSourceMaps: false,
}

export default nextConfig
