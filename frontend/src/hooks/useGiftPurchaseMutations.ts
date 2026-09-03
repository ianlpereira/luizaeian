/**
 * Escritas do vínculo entre compras de presente e convidados.
 *
 * Espelha useAdminGuestMutations.ts: `useAdminReports` guarda as queries, as
 * mutations ficam aqui. Toda alteração invalida a listagem e as sugestões —
 * salvar um vínculo muda os dois lados da conciliação.
 */

import { useMutation, useQueryClient } from '@tanstack/react-query'

import { ApiError } from '@/lib/api'
import { updateGiftPurchase } from '@/lib/adminApi'
import type { AdminGiftPurchaseUpdate } from '@/types/admin'

export function giftPurchaseErrorMessage(error: unknown): string {
  if (error instanceof ApiError) {
    if (error.status === 404) return 'Compra ou convidado não encontrado. Atualize a lista.'
    if (error.status === 503) return 'Servidor indisponível. Tente de novo em instantes.'
  }
  return 'Não foi possível salvar. Tente de novo.'
}

export function useUpdateGiftPurchase() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: AdminGiftPurchaseUpdate }) =>
      updateGiftPurchase(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'gift-purchases'] })
    },
  })
}
