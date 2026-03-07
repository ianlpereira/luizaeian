import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { sanitizeInput } from '@/utils/sanitize'
import type { Gift, GiftFilters, GiftPurchasePayload } from '@/types/gift'

// ─── Query ────────────────────────────────────────────────────────────────────

/**
 * Busca todos os presentes via FastAPI, ordenados pelo filtro.
 * Cache: 5 minutos. Revalida automaticamente ao re-focar a janela: desativado
 * (evita reloads irritantes enquanto o convidado preenche o formulário).
 */
export function useGifts(filters: GiftFilters) {
  return useQuery({
    queryKey: ['gifts', filters],
    queryFn: async (): Promise<Gift[]> => {
      const params = new URLSearchParams({ sort: filters.sortOrder })
      if (filters.category) params.set('category', filters.category)
      return api.get<Gift[]>(`/api/gifts?${params.toString()}`)
    },
    staleTime: 1000 * 60 * 5,      // 5 min
    refetchOnWindowFocus: false,
  })
}

// ─── Mutation ─────────────────────────────────────────────────────────────────

/**
 * Registra a compra de um presente via FastAPI:
 *  POST /api/gifts/purchase — valida estoque, insere purchase e decrementa
 *  stock atomicamente no backend.
 *
 * Após sucesso, invalida o cache de ['gifts'] para refletir o novo estado.
 */
export function usePurchaseGift() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (payload: GiftPurchasePayload) => {
      // SEC-01: sanitizar inputs antes de enviar ao backend
      const sanitized: GiftPurchasePayload = {
        ...payload,
        buyer_name: sanitizeInput(payload.buyer_name),
        message: payload.message ? sanitizeInput(payload.message) : undefined,
      }
      return api.post('/api/gifts/purchase', sanitized)
    },
    onSuccess: () => {
      // Invalida todas as variações de filtro
      queryClient.invalidateQueries({ queryKey: ['gifts'] })
    },
  })
}

