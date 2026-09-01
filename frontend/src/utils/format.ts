/** Formatadores pt-BR compartilhados. */

const brl = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' })

export const formatBRL = (value: number) => brl.format(value)

export const formatDateTime = (iso: string) =>
  new Date(iso).toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })

/**
 * Forma comparável de um texto: minúsculo e sem acento.
 *
 * Buscar por nome numa lista em português só funciona assim — quem digita
 * "najila" espera achar "Nájila". NFD separa a letra do acento e o segundo
 * `replace` descarta os acentos soltos.
 */
export const normalizeText = (value: string) =>
  value
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase()
    .trim()
