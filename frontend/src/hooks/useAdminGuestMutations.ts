/**
 * Escritas da lista de convidados.
 *
 * `useAdminReports` guarda as queries; as mutations ficam aqui.
 *
 * Toda alteração invalida `['admin','guests']` e `['admin','rsvp-matches']`:
 * salvar um convidado muda os dois lados da conciliação, e as sugestões
 * precisam sumir da lista assim que o vínculo é confirmado.
 *
 * Sem update otimista — não existe nenhum no projeto e a lista recarrega
 * rápido. Um 401 é tratado antes de chegar aqui, pelo withAuthGuard do adminApi.
 */

import { useMutation, useQueryClient } from '@tanstack/react-query'

import { ApiError } from '@/lib/api'
import { createGuest, deleteGuest, updateGuest } from '@/lib/adminApi'
import type { AdminGuestCreate, AdminGuestUpdate } from '@/types/admin'

/** Mensagem em pt-BR por status, no mesmo espírito de `loginErrorMessage`. */
export function guestErrorMessage(error: unknown): string {
  if (error instanceof ApiError) {
    if (error.status === 404) return 'Convidado não encontrado. Atualize a lista.'
    // O backend já responde em pt-BR nos 422 (nome curto, vínculo incompleto).
    if (error.status === 422 || error.status === 409) return error.detail
    if (error.status === 503) return 'Servidor indisponível. Tente de novo em instantes.'
  }
  return 'Não foi possível salvar. Tente de novo.'
}

function useInvalidateGuests() {
  const queryClient = useQueryClient()

  return () => {
    queryClient.invalidateQueries({ queryKey: ['admin', 'guests'] })
    queryClient.invalidateQueries({ queryKey: ['admin', 'rsvp-matches'] })
  }
}

export function useCreateGuest() {
  const invalidate = useInvalidateGuests()

  return useMutation({
    mutationFn: (payload: AdminGuestCreate) => createGuest(payload),
    onSuccess: invalidate,
  })
}

export function useUpdateGuest() {
  const invalidate = useInvalidateGuests()

  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: AdminGuestUpdate }) =>
      updateGuest(id, payload),
    onSuccess: invalidate,
  })
}

export function useDeleteGuest() {
  const invalidate = useInvalidateGuests()

  return useMutation({
    mutationFn: (id: string) => deleteGuest(id),
    onSuccess: invalidate,
  })
}
