import { useMutation } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { sanitizeInput } from '@/utils/sanitize'
import type { RsvpFormValues } from '@/components/RsvpForm/schema'
import type { RsvpEntry } from '@/types/rsvp'

/**
 * Envia a confirmação de presença para POST /api/rsvp.
 * SEC-01: inputs sanitizados antes do envio.
 * Trata erro 409 (e-mail duplicado) com mensagem amigável.
 */
export function useSubmitRsvp() {
  return useMutation({
    mutationFn: async (values: RsvpFormValues): Promise<RsvpEntry> => {
      const payload = {
        full_name: sanitizeInput(values.full_name),
        email: values.email.toLowerCase().trim(),
        status: values.status,
        companions: values.companions.map(c => ({
          name: sanitizeInput(c.name),
        })),
      }
      return api.post<RsvpEntry>('/api/rsvp', payload)
    },
  })
}
