/**
 * Utilitários de deep link para apps de navegação.
 *
 * iOS e Android detectam o schema e abrem o app nativo se instalado;
 * caso contrário, caem para a versão web.
 */

/**
 * Gera URL para Google Maps a partir de lat/lng.
 * Abre o app nativo no mobile (schema comaps://) com fallback para web.
 */
export function getGoogleMapsUrl(lat: number, lng: number): string {
  return `https://maps.google.com/?q=${lat},${lng}`
}

/**
 * Gera deep link para Waze com lat/lng e modo navegação ativado.
 * Abre o app Waze se instalado, fallback para waze.com.
 */
export function getWazeUrl(lat: number, lng: number): string {
  return `https://waze.com/ul?ll=${lat},${lng}&navigate=yes`
}
