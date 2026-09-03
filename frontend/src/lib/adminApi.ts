/**
 * Cliente HTTP da área administrativa.
 *
 * Envolve `api` (lib/api.ts) acrescentando o header Authorization e um único
 * ponto de tratamento de 401: token expirado ou revogado limpa o storage e
 * avisa o store, que devolve o usuário para a tela de login.
 *
 * O 401 não está em RETRYABLE_STATUSES, então o retry com backoff do api.ts não
 * dispara — a volta para o login é imediata.
 */

import { ApiError, api } from '@/lib/api'
import type {
  AdminGiftLedgerReport,
  AdminGiftLedgerRow,
  AdminGiftPurchaseMatchesReport,
  AdminGiftPurchaseRow,
  AdminGiftPurchaseUpdate,
  AdminGiftsReport,
  AdminGuestCreate,
  AdminGuestRow,
  AdminGuestsReport,
  AdminGuestUpdate,
  AdminManualTransaction,
  AdminMe,
  AdminRsvpMatchesReport,
  AdminRsvpsReport,
  AdminToken,
} from '@/types/admin'

const TOKEN_KEY = 'luizaeian.admin.token'

// sessionStorage lança em modo privado de alguns navegadores — toda leitura e
// escrita fica protegida para a página não quebrar por causa disso.
export function getToken(): string | null {
  try {
    return sessionStorage.getItem(TOKEN_KEY)
  } catch {
    return null
  }
}

export function setToken(token: string): void {
  try {
    sessionStorage.setItem(TOKEN_KEY, token)
  } catch {
    // Sessão continua válida em memória mesmo sem persistir.
  }
}

export function clearToken(): void {
  try {
    sessionStorage.removeItem(TOKEN_KEY)
  } catch {
    // Nada a fazer.
  }
}

type UnauthorizedHandler = () => void

let onUnauthorized: UnauthorizedHandler | null = null

/** Registrado pelo store de autenticação (evita import circular). */
export function setUnauthorizedHandler(handler: UnauthorizedHandler): void {
  onUnauthorized = handler
}

function authHeaders(): Record<string, string> {
  const token = getToken()
  return token ? { Authorization: `Bearer ${token}` } : {}
}

async function withAuthGuard<T>(call: () => Promise<T>): Promise<T> {
  try {
    return await call()
  } catch (error) {
    if (error instanceof ApiError && error.status === 401) {
      clearToken()
      onUnauthorized?.()
    }
    throw error
  }
}

// authHeaders() e withAuthGuard são agnósticos de método, então os quatro
// verbos compartilham o mesmo tratamento de 401.
export const adminApi = {
  get: <T>(path: string) => withAuthGuard(() => api.get<T>(path, { headers: authHeaders() })),
  post: <T>(path: string, body: unknown) =>
    withAuthGuard(() => api.post<T>(path, body, { headers: authHeaders() })),
  patch: <T>(path: string, body: unknown) =>
    withAuthGuard(() => api.patch<T>(path, body, { headers: authHeaders() })),
  del: <T>(path: string) => withAuthGuard(() => api.del<T>(path, { headers: authHeaders() })),
}

// ── Endpoints ─────────────────────────────────────────────────────────────────

/** Login não usa withAuthGuard: um 401 aqui é senha errada, não sessão expirada. */
export const adminLogin = (username: string, password: string) =>
  api.post<AdminToken>('/api/admin/login', { username, password })

export const getAdminMe = () => adminApi.get<AdminMe>('/api/admin/me')

export const getAdminGuests = () => adminApi.get<AdminGuestsReport>('/api/admin/guests')

export const getAdminRsvpMatches = () =>
  adminApi.get<AdminRsvpMatchesReport>('/api/admin/guests/rsvp-matches')

export const createGuest = (payload: AdminGuestCreate) =>
  adminApi.post<AdminGuestRow>('/api/admin/guests', payload)

export const updateGuest = (guestId: string, payload: AdminGuestUpdate) =>
  adminApi.patch<AdminGuestRow>(`/api/admin/guests/${guestId}`, payload)

export const deleteGuest = (guestId: string) =>
  adminApi.del<void>(`/api/admin/guests/${guestId}`)

export const getAdminRsvps = () => adminApi.get<AdminRsvpsReport>('/api/admin/rsvps')

export const getAdminGifts = () => adminApi.get<AdminGiftsReport>('/api/admin/gifts')

export const getAdminGiftLedger = () =>
  adminApi.get<AdminGiftLedgerReport>('/api/admin/gift-ledger')

export const getAdminGiftPurchaseMatches = () =>
  adminApi.get<AdminGiftPurchaseMatchesReport>('/api/admin/gift-purchases/matches')

export const updateGiftPurchase = (purchaseId: string, payload: AdminGiftPurchaseUpdate) =>
  adminApi.patch<AdminGiftPurchaseRow>(`/api/admin/gift-purchases/${purchaseId}`, payload)

export const createManualTransaction = (payload: AdminManualTransaction) =>
  adminApi.post<AdminGiftLedgerRow>('/api/admin/manual-transactions', payload)

export const updateManualTransaction = (purchaseId: string, payload: AdminManualTransaction) =>
  adminApi.patch<AdminGiftLedgerRow>(`/api/admin/manual-transactions/${purchaseId}`, payload)

export const deleteManualTransaction = (purchaseId: string) =>
  adminApi.del<void>(`/api/admin/manual-transactions/${purchaseId}`)
