import type { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'ObraCalc PT - Cálculos de Obra',
    short_name: 'ObraCalc',
    description: 'Calculadora profissional para construção civil em Portugal. Calcule materiais, custos e gere orçamentos.',
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
