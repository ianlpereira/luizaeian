import { z } from 'zod'

export const messageSchema = z.object({
  author_name: z.string().min(2, 'Informe seu nome'),
  content: z
    .string()
    .min(3, 'Mensagem muito curta')
    .max(500, 'Mensagem muito longa (máx. 500 caracteres)'),
})

export type MessageFormValues = z.infer<typeof messageSchema>
