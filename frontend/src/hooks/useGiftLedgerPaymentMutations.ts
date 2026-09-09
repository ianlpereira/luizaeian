/**
 * Ações do relatório unificado que valem para pagamento do Mercado Pago:
 * sincronizar com o MP e apagar pendente. Mesmo desenho de
 * useManualTransactionMutations, sem atualização otimista.
 */

import { useMutation, useQueryClient } from '@tanstack/react-query'

import { ApiError } from '@/lib/api'
import { deletePendingPayment, reconcilePayment } from '@/lib/adminApi'

export function giftLedgerPaymentErrorMessage(error: unknown): string {
  if (error instanceof ApiError) {
    if (error.status === 404) return 'Pagamento não encontrado. Atualize a lista.'
    // 422 é a recusa de sincronizar lançamento manual, ou de apagar o que não
    // está pendente: o backend já responde em pt-BR.
    if (error.status === 422) return error.detail
    if (error.status === 503) return 'Servidor indisponível. Tente de novo em instantes.'
  }
  return 'Não foi possível concluir a ação. Tente de novo.'
}

function useInvalidateAdmin() {
  const queryClient = useQueryClient()
  return () => queryClient.invalidateQueries({ queryKey: ['admin'] })
}

export function useReconcilePayment() {
  const invalidate = useInvalidateAdmin()

  return useMutation({
    mutationFn: (paymentId: string) => reconcilePayment(paymentId),
    onSuccess: invalidate,
  })
}

export function useDeletePendingPayment() {
  const invalidate = useInvalidateAdmin()

  return useMutation({
    mutationFn: (paymentId: string) => deletePendingPayment(paymentId),
    onSuccess: invalidate,
  })
}
