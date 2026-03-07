export interface GalleryImage {
  id: string
  src: string
  alt: string
  /** URL WebP pré-processada (via Supabase Storage transform ou CDN) */
  webpSrc?: string
}

/**
 * Dados da galeria do pré-wedding.
 * Fotos reais em /public/images/ — servidas pelo Vite como assets estáticos.
 */
export const galleryImages: GalleryImage[] = [
  {
    id: 'g1',
    src: '/images/Ian y Luiza-1.webp',
    alt: 'Luiza e Ian — foto 1',
  },
  {
    id: 'g2',
    src: '/images/Ian y Luiza-2.webp',
    alt: 'Luiza e Ian — foto 2',
  },
  {
    id: 'g3',
    src: '/images/Ian y Luiza-3.webp',
    alt: 'Luiza e Ian — foto 3',
  },
  {
    id: 'g4',
    src: '/images/Ian y Luiza-4.webp',
    alt: 'Luiza e Ian — foto 4',
  },
  {
    id: 'g5',
    src: '/images/Ian y Luiza-5.webp',
    alt: 'Luiza e Ian — foto 5',
  },
  {
    id: 'g6',
    src: '/images/Ian y Luiza-6.webp',
    alt: 'Luiza e Ian — foto 6',
  },
  {
    id: 'g7',
    src: '/images/Ian y Luiza-7.webp',
    alt: 'Luiza e Ian — foto 7',
  },
  {
    id: 'g8',
    src: '/images/Ian y Luiza-8.webp',
    alt: 'Luiza e Ian — foto 8',
  }
]
