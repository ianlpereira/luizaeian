import { z } from 'zod'

const companionSchema = z.object({
  name: z.string().min(2, 'Nome do acompanhante obrigatório'),
})

export const rsvpSchema = z.object({
  full_name: z.string().min(2, 'Nome completo obrigatório'),
  email: z.string().email('E-mail inválido'),
  status: z.enum(['confirmed', 'declined'], {
    required_error: 'Selecione uma opção',
  }),
  companions: z.array(companionSchema).default([]),
})

export type RsvpFormValues = z.infer<typeof rsvpSchema>
