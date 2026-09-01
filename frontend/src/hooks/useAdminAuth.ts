import { useMutation, useQueryClient } from '@tanstack/react-query'

import { ApiError } from '@/lib/api'
import { adminLogin } from '@/lib/adminApi'
import { useAdminAuthStore } from '@/store/adminAuth'

interface LoginPayload {
  username: string
  password: string
}

/** Traduz o erro da API para uma mensagem curta em pt-BR. */
function loginErrorMessage(error: unknown): string {
  if (!(error instanceof ApiError)) {
    return 'Não foi possível conectar ao servidor. Tente novamente.'
  }

  switch (error.status) {
    case 401:
      return 'Usuário ou senha inválidos.'
    case 429:
      return 'Muitas tentativas. Aguarde alguns minutos e tente de novo.'
    case 503:
      return 'Área administrativa não configurada no servidor.'
    default:
      return error.detail
  }
}

export function useAdminLogin() {
  const login = useAdminAuthStore((state) => state.login)

  const mutation = useMutation({
    mutationFn: ({ username, password }: LoginPayload) => adminLogin(username, password),
    onSuccess: (data) => login(data.access_token),
  })

  return {
    ...mutation,
    errorMessage: mutation.error ? loginErrorMessage(mutation.error) : null,
  }
}

export function useAdminLogout() {
  const queryClient = useQueryClient()
  const logout = useAdminAuthStore((state) => state.logout)

  return () => {
    logout()
    // Os relatórios em cache não podem sobreviver ao logout.
    queryClient.removeQueries({ queryKey: ['admin'] })
  }
}
