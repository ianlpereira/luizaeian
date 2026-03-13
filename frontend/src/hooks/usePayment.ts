import { useMutation, useQuery } from '@tanstack/react-query'
import { createPayment, getPaymentStatus } from '@/lib/api'
import type { CreatePaymentPayload, PaymentStatus } from '@/types/payment'

/**
 * Mutation para criar um pagamento (Pix ou Cartão).
 * Chama POST /api/payments/create e retorna o CreatePaymentResponse.
 */
export function useCreatePayment() {
  return useMutation({
    mutationFn: (payload: CreatePaymentPayload) => createPayment(payload),
  })
}

/**
 * Query com polling para verificar o status de um pagamento.
 *
 * - enabled: false → não inicia o polling (usar antes de ter o payment_id)
 * - Polling a cada 5 s, encerra automaticamente ao receber paid=true
 *   ou status em ['cancelled', 'expired', 'rejected']
 */
const TERMINAL_STATUSES: PaymentStatus[] = ['approved', 'cancelled', 'expired', 'rejected']

export function usePaymentStatus(paymentId: string | null, enabled: boolean) {
  return useQuery({
    queryKey: ['payment-status', paymentId],
    queryFn: () => getPaymentStatus(paymentId!),
    enabled: !!paymentId && enabled,
    refetchInterval: (query) => {
      const data = query.state.data
      if (!data) return 5_000
      if (data.paid || TERMINAL_STATUSES.includes(data.status)) return false
      return 5_000
    },
    staleTime: 0,
    gcTime: 0,
  })
}
