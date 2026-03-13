import { z } from 'zod'

export const checkoutSchema = z.object({
  buyer_name: z
    .string()
    .min(2, 'Informe seu nome completo (mínimo 2 caracteres)')
    .max(100, 'Nome muito longo'),
  payer_email: z
    .string()
    .email('Informe um e-mail válido')
    .max(254, 'E-mail muito longo'),
  message: z
    .string()
    .max(300, 'Mensagem muito longa (máximo 300 caracteres)')
    .optional()
    .or(z.literal('')),
})

export type CheckoutFormValues = z.infer<typeof checkoutSchema>

export type PaymentMethodChoice = 'pix' | 'credit_card'
