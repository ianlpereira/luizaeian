import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { sanitizeInput } from '@/utils/sanitize'
import type { Message } from '@/types/message'
import type { MessageFormValues } from '@/components/MessageForm/schema'

/**
 * Busca todas as mensagens do mural via GET /api/messages.
 *
 * Polling strategy:
 *  • Tab visible  → poll every 10 s (good UX for a wedding day).
 *  • Tab hidden   → polling is suspended via `refetchIntervalInBackground: false`
 *    combined with `refetchOnWindowFocus: true`. This means we stop burning
 *    bandwidth and battery when the guest switches to another tab, and we
 *    refresh immediately when they come back.
 */
export function useMessages() {
  return useQuery({
    queryKey: ['messages'],
    queryFn: () => api.get<Message[]>('/api/messages'),
    staleTime: 0,
    refetchInterval: 10_000,
    refetchIntervalInBackground: false, // PERF: pause polling when tab is hidden
    refetchOnWindowFocus: true,
  })
}

/**
 * Publica nova mensagem via POST /api/messages.
 * SEC-01: inputs sanitizados antes do envio.
 * Invalida cache de ['messages'] para reexibir o feed imediatamente.
 */
export function usePostMessage() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (values: MessageFormValues): Promise<Message> => {
      const payload = {
        author_name: sanitizeInput(values.author_name),
        content: sanitizeInput(values.content),
      }
      return api.post<Message>('/api/messages', payload)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['messages'] })
    },
  })
}
