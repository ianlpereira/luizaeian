import { create } from 'zustand'

import { clearToken, getToken, setToken, setUnauthorizedHandler } from '@/lib/adminApi'

/**
 * Estado de autenticação da área administrativa.
 *
 * O token vive em sessionStorage (não localStorage): fecha a aba, acaba a
 * sessão. O store inicia lendo o que estiver guardado para que um F5 na mesma
 * aba não derrube o admin.
 */
interface AdminAuthState {
  token: string | null
  isAuthenticated: boolean
  login: (token: string) => void
  logout: () => void
}

export const useAdminAuthStore = create<AdminAuthState>((set) => {
  const stored = getToken()

  return {
    token: stored,
    isAuthenticated: Boolean(stored),
    login: (token: string) => {
      setToken(token)
      set({ token, isAuthenticated: true })
    },
    logout: () => {
      clearToken()
      set({ token: null, isAuthenticated: false })
    },
  }
})

// Qualquer 401 vindo do adminApi derruba a sessão e devolve a tela de login.
setUnauthorizedHandler(() => useAdminAuthStore.getState().logout())
