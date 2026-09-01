/**
 * Rótulos pt-BR dos enums de convidado.
 *
 * O banco guarda os valores em inglês (padrão do repositório: código em inglês,
 * interface em pt-BR). Estes mapas ficam fora do `GuestsTable` porque a tabela,
 * o drawer de edição e o de conciliação precisam exatamente dos mesmos textos —
 * duplicá-los faria "Não vai" virar "Não comparece" em uma das telas.
 *
 * A ordem das chaves importa: é ela que define a ordem dos filtros de coluna e
 * das opções dos selects.
 */

import type { Attendance, GuestSide, InviteType, RsvpRole, SentStatus } from '@/types/admin'

export const INVITE_TYPE_LABEL: Record<InviteType, string> = {
  physical: 'Físico',
  digital: 'Digital',
}

export const SIDE_LABEL: Record<GuestSide, string> = {
  bride: 'Noiva',
  groom: 'Noivo',
}

export const SENT_LABEL: Record<SentStatus, string> = {
  sent: 'Enviado',
  pending: 'Pendente',
}

export const ATTENDANCE_LABEL: Record<Attendance, string> = {
  confirmed: 'Vai comparecer',
  uncertain: 'Incerteza',
  declined: 'Não vai',
}

export const ATTENDANCE_COLOR: Record<Attendance, string> = {
  confirmed: 'success',
  uncertain: 'warning',
  declined: 'error',
}

export const RSVP_ROLE_LABEL: Record<RsvpRole, string> = {
  primary: 'Titular',
  companion: 'Acompanhante',
}

/** Status do RSVP recebido pelo site. Espelha o CHECK de `rsvp.status`. */
export const RSVP_STATUS_LABEL: Record<string, string> = {
  confirmed: 'Confirmado',
  declined: 'Recusado',
}

/** Placeholder de célula vazia, para não deixar a coluna em branco. */
export const EMPTY = '—'

/** Opções de `Select` a partir de um mapa de rótulos. */
export const optionsFrom = <T extends string>(labels: Record<T, string>) =>
  (Object.keys(labels) as T[]).map((value) => ({ value, label: labels[value] }))

/** Filtros de coluna a partir de um mapa de rótulos. */
export const filtersFrom = <T extends string>(labels: Record<T, string>) =>
  (Object.keys(labels) as T[]).map((value) => ({ text: labels[value], value }))
