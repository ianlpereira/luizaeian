const AVATAR_COLORS = [
  '#c9a96e', // dourado principal
  '#d4a98a', // terracota suave
  '#b5a89c', // cinza quente
  '#c4b09e', // bege dourado
  '#a89b8c', // taupe
  '#bba89e', // rosê muted
  '#c0a898', // pêssego muted
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
