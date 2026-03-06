/**
 * PERF-01 — Utilitários de imagem para otimização de performance.
 */

/**
 * Converte uma URL de imagem do Supabase Storage para WebP com redimensionamento.
 * Supabase Storage suporta transformações via query params.
 *
 * @example
 * getWebPUrl('https://xxx.supabase.co/storage/v1/object/public/images/foto.jpg', 800)
 * // → 'https://...?width=800&format=webp&quality=80'
 */
export function getWebPUrl(url: string, width?: number, quality = 80): string {
  if (!url) return ''

  // Apenas aplica transformação em URLs do Supabase Storage
  if (!url.includes('supabase.co/storage')) return url

  const params = new URLSearchParams()
  if (width) params.set('width', String(width))
  params.set('format', 'webp')
  params.set('quality', String(quality))

  const separator = url.includes('?') ? '&' : '?'
  return `${url}${separator}${params.toString()}`
}

/**
 * Gera um srcset WebP para múltiplos tamanhos (responsive images).
 *
 * @example
 * getWebPSrcSet(url, [400, 800, 1200])
 * // → 'url?width=400&format=webp 400w, url?width=800... 800w, ...'
 */
export function getWebPSrcSet(url: string, widths: number[]): string {
  return widths.map(w => `${getWebPUrl(url, w)} ${w}w`).join(', ')
}
