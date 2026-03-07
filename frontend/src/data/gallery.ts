export interface GalleryImage {
  id: string
  src: string
  alt: string
  /** URL WebP pré-processada (via Supabase Storage transform ou CDN) */
  webpSrc?: string
}

/**
 * Dados da galeria do pré-wedding.
 *
 * ⚠️  Substitua os src por URLs reais do Supabase Storage após o upload das fotos.
 *     Formato sugerido: getWebPUrl(supabaseUrl, 800) para thumbs e getWebPUrl(url, 1600) para lightbox.
 *
 * Enquanto as fotos reais não estão disponíveis, os placeholders usam
 * https://picsum.photos — remova em produção.
 */
export const galleryImages: GalleryImage[] = [
  {
    id: 'g1',
    src: 'https://picsum.photos/seed/luizaian1/600/800',
    webpSrc: 'https://picsum.photos/seed/luizaian1/600/800',
    alt: 'Luiza e Ian — foto 1',
  },
  {
    id: 'g2',
    src: 'https://picsum.photos/seed/luizaian2/600/800',
    webpSrc: 'https://picsum.photos/seed/luizaian2/600/800',
    alt: 'Luiza e Ian — foto 2',
  },
  {
    id: 'g3',
    src: 'https://picsum.photos/seed/luizaian3/600/800',
    webpSrc: 'https://picsum.photos/seed/luizaian3/600/800',
    alt: 'Luiza e Ian — foto 3',
  },
  {
    id: 'g4',
    src: 'https://picsum.photos/seed/luizaian4/600/800',
    webpSrc: 'https://picsum.photos/seed/luizaian4/600/800',
    alt: 'Luiza e Ian — foto 4',
  },
  {
    id: 'g5',
    src: 'https://picsum.photos/seed/luizaian5/600/800',
    webpSrc: 'https://picsum.photos/seed/luizaian5/600/800',
    alt: 'Luiza e Ian — foto 5',
  },
  {
    id: 'g6',
    src: 'https://picsum.photos/seed/luizaian6/600/800',
    webpSrc: 'https://picsum.photos/seed/luizaian6/600/800',
    alt: 'Luiza e Ian — foto 6',
  },
  {
    id: 'g7',
    src: 'https://picsum.photos/seed/luizaian7/600/800',
    webpSrc: 'https://picsum.photos/seed/luizaian7/600/800',
    alt: 'Luiza e Ian — foto 7',
  },
  {
    id: 'g8',
    src: 'https://picsum.photos/seed/luizaian8/600/800',
    webpSrc: 'https://picsum.photos/seed/luizaian8/600/800',
    alt: 'Luiza e Ian — foto 8',
  },
]
