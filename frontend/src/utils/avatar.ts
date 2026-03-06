const AVATAR_COLORS = [
  '#c9a96e', // dourado
  '#e8b4b8', // rosê
  '#a8c5da', // azul suave
  '#b5ccb8', // verde suave
  '#d4a5a5', // vermelho suave
  '#9b8ea8', // lilás
  '#c4b7a6', // bege
]

/**
 * Extrai as iniciais de um nome (máx. 2 letras).
 * @example getInitials('Luiza Souza') → 'LS'
 */
export function getInitials(name: string): string {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map(n => n[0].toUpperCase())
    .join('')
}

/**
 * Retorna uma cor determinística para o avatar baseada no nome.
 */
export function getAvatarColor(name: string): string {
  const index = name.charCodeAt(0) % AVATAR_COLORS.length
  return AVATAR_COLORS[index]
}
