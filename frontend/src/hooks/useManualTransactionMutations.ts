/**
 * Escritas de lançamento manual.
 *
 * Mesmo desenho de useAdminGuestMutations: queries ficam em useAdminReports,
 * escritas aqui, sem atualização otimista, e o 401 já é tratado no adminApi.
 */

import { useMutation, useQueryClient } from '@tanstack/react-query'

import { ApiError } from '@/lib/api'
import {
  createManualTransaction,
  deleteManualTransaction,
  updateManualTransaction,
} from '@/lib/adminApi'
import type { AdminManualTransaction } from '@/types/admin'

export function manualTransactionErrorMessage(error: unknown): string {
  if (error instanceof ApiError) {
    if (error.status === 404) return 'Lançamento, presente ou convidado não encontrado. Atualize a lista.'
    // 422 é a recusa de editar linha do Mercado Pago, ou validação de campo: o
    // backend já responde em pt-BR.
    if (error.status === 422) return error.detail
    if (error.status === 503) return 'Servidor indisponível. Tente de novo em instantes.'
  }
  return 'Não foi possível salvar o lançamento. Tente de novo.'
}

/**
 * Invalida `['admin']` inteiro de propósito: um lançamento muda o relatório
 * unificado, os totais por presente da aba Presentes e as sugestões de
 * conciliação. Invalidar só a chave do ledger deixaria as outras duas velhas.
 */
function useInvalidateAdmin() {
  const queryClient = useQueryClient()
  return () => queryClient.invalidateQueries({ queryKey: ['admin'] })
}

export function useCreateManualTransaction() {
  const invalidate = useInvalidateAdmin()

  return useMutation({
    mutationFn: (payload: AdminManualTransaction) => createManualTransaction(payload),
    onSuccess: invalidate,
  })
}

export function useUpdateManualTransaction() {
  const invalidate = useInvalidateAdmin()

  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: AdminManualTransaction }) =>
      updateManualTransaction(id, payload),
    onSuccess: invalidate,
  })
}

export function useDeleteManualTransaction() {
  const invalidate = useInvalidateAdmin()

  return useMutation({
    mutationFn: (purchaseId: string) => deleteManualTransaction(purchaseId),
    onSuccess: invalidate,
  })
}
