import { useQuery, useQueryClient } from '@tanstack/react-query'

import { getAdminGifts, getAdminPayments, getAdminRsvps } from '@/lib/adminApi'
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

export function useAdminPayments() {
  const isAuthenticated = useAdminAuthStore((state) => state.isAuthenticated)

  return useQuery({
    queryKey: ['admin', 'payments'],
    queryFn: getAdminPayments,
    enabled: isAuthenticated,
    ...commonOptions,
  })
}

/** Botão "Atualizar": refaz os três relatórios de uma vez. */
export function useRefreshAdminReports() {
  const queryClient = useQueryClient()

  return () => queryClient.invalidateQueries({ queryKey: ['admin'] })
}
