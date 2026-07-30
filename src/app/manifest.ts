import type { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Mezzo - Cálculos de Obra',
    short_name: 'Mezzo',
    description: 'Calculadora e gestor de obras e orçamentos para a construção civil em Portugal.',
    start_url: '/dashboard',
    display: 'standalone',
    background_color: '#0C0A09',
    theme_color: '#F97316',
    orientation: 'portrait',
    categories: ['business', 'productivity', 'utilities'],
    icons: [
      {
        src: '/icon-192x192.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'maskable',
      },
      {
        src: '/icon-512x512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'any',
      },
    ],
  }
}
