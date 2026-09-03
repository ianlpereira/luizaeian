import { useQuery, useQueryClient } from '@tanstack/react-query'

import {
  getAdminGiftLedger,
  getAdminGiftPurchaseMatches,
  getAdminGifts,
  getAdminGuests,
  getAdminRsvpMatches,
  getAdminRsvps,
} from '@/lib/adminApi'
import { useAdminAuthStore } from '@/store/adminAuth'

/**
 * Relatórios administrativos.
 *
 * Uma query por relatório: cada tabela tem seu próprio loading e erro, e uma
 * consulta lenta não segura a página inteira.
 *
 * `staleTime` curto (30 s) porque quem abre o painel quer número atual — o
 * padrão global de 5 min é pensado para o site dos convidados. `retry: false`
 * para que um 401 apareça na hora em vez de tentar de novo.
 */
const commonOptions = {
  staleTime: 30_000,
  retry: false,
} as const

export function useAdminGuests() {
  const isAuthenticated = useAdminAuthStore((state) => state.isAuthenticated)

  return useQuery({
    queryKey: ['admin', 'guests'],
    queryFn: getAdminGuests,
    enabled: isAuthenticated,
    ...commonOptions,
  })
}

/** Sugestões de vínculo lista × confirmações, usadas no drawer de conciliação. */
export function useAdminRsvpMatches() {
  const isAuthenticated = useAdminAuthStore((state) => state.isAuthenticated)

  return useQuery({
    queryKey: ['admin', 'rsvp-matches'],
    queryFn: getAdminRsvpMatches,
    enabled: isAuthenticated,
    ...commonOptions,
  })
}

export function useAdminRsvps() {
  const isAuthenticated = useAdminAuthStore((state) => state.isAuthenticated)

  return useQuery({
    queryKey: ['admin', 'rsvps'],
    queryFn: getAdminRsvps,
    enabled: isAuthenticated,
    ...commonOptions,
  })
}

export function useAdminGifts() {
  const isAuthenticated = useAdminAuthStore((state) => state.isAuthenticated)

  return useQuery({
    queryKey: ['admin', 'gifts'],
    queryFn: getAdminGifts,
    enabled: isAuthenticated,
    ...commonOptions,
  })
}

/** Compras e pagamentos numa lista só — uma linha por transação. */
export function useAdminGiftLedger() {
  const isAuthenticated = useAdminAuthStore((state) => state.isAuthenticated)

  return useQuery({
    queryKey: ['admin', 'gift-ledger'],
    queryFn: getAdminGiftLedger,
    enabled: isAuthenticated,
    ...commonOptions,
  })
}

/** Sugestões de vínculo compras × convidados, usadas no drawer de conciliação. */
export function useAdminGiftPurchaseMatches() {
  const isAuthenticated = useAdminAuthStore((state) => state.isAuthenticated)

  return useQuery({
    queryKey: ['admin', 'gift-purchases', 'matches'],
    queryFn: getAdminGiftPurchaseMatches,
    enabled: isAuthenticated,
    ...commonOptions,
  })
}

/** Botão "Atualizar": refaz todos os relatórios de uma vez. */
export function useRefreshAdminReports() {
  const queryClient = useQueryClient()

  return () => queryClient.invalidateQueries({ queryKey: ['admin'] })
}
