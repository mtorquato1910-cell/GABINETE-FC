import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      // Uploadthing (Sprint 6)
      {
        protocol: 'https',
        hostname: 'utfs.io',
      },
      // Placeholder/local assets
      {
        protocol: 'http',
        hostname: 'localhost',
      },
    ],
  },
  // Suppress Prisma edge runtime warning
  serverExternalPackages: ['@prisma/client', 'prisma'],
}

export default nextConfig
