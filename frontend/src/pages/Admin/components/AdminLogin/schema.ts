import { z } from 'zod'

export const adminLoginSchema = z.object({
  username: z.string().min(1, 'Informe o usuário'),
  // O bcrypt ignora o que passar de 72 bytes — o limite espelha o do backend.
  password: z
    .string()
    .min(8, 'A senha tem no mínimo 8 caracteres')
    .max(72, 'A senha tem no máximo 72 caracteres'),
})

export type AdminLoginValues = z.infer<typeof adminLoginSchema>
