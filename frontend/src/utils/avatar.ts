const AVATAR_COLORS = [
  '#7aab8e', // verde salvia
  '#d4a0a7', // rosa blush
  '#a8c5d6', // azul céu
  '#c9c196', // dourado folha seca
  '#8eb8a0', // verde menta
  '#c4b3c8', // lavanda suave
  '#b5cec0', // verde água
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
