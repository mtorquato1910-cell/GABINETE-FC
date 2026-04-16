import { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Gabinete FC',
    short_name: 'GFC',
    description: 'Camisas de futebol premium',
    start_url: '/',
    display: 'standalone',
    background_color: '#050505',
    theme_color: '#a3e635',
    icons: [
      { src: '/logo/gabinete-fc-icon.png', sizes: '192x192', type: 'image/png' },
      { src: '/logo/gabinete-fc-logo.png', sizes: '512x512', type: 'image/png' },
    ],
  }
}
