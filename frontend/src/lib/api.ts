/**
 * Cliente HTTP centralizado para a API FastAPI.
 *
 * Usa fetch nativo — sem dependências externas.
 * A URL base vem de VITE_API_URL (ex.: http://localhost:8000 em dev,
 * https://luizaeian-backend.onrender.com em produção).
 *
 * Retry automático com backoff exponencial para lidar com o cold start do
 * Render Free (o backend hiberna após 15 min de inatividade e pode redirecionar
 * ou retornar 502/503 enquanto está acordando).
 */

const BASE_URL = (import.meta.env.VITE_API_URL as string | undefined ?? '').replace(/\/$/, '')

if (!BASE_URL) {
  throw new Error('Missing env var: VITE_API_URL. Add it to frontend/.env')
}

/** Número máximo de tentativas antes de desistir. */
const MAX_RETRIES = 4

/** Delay base em ms — dobra a cada tentativa (1s, 2s, 4s, 8s). */
const RETRY_BASE_DELAY_MS = 1000

/** Códigos HTTP que indicam backend acordando / sobrecarga temporária. */
const RETRYABLE_STATUSES = new Set([502, 503, 504])

const sleep = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms))

class ApiError extends Error {
  constructor(
    public status: number,
    public detail: string,
  ) {
    super(`API ${status}: ${detail}`)
    this.name = 'ApiError'
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  let lastError: unknown

  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    if (attempt > 0) {
      await sleep(RETRY_BASE_DELAY_MS * 2 ** (attempt - 1))
    }

    let res: Response
    try {
      res = await fetch(`${BASE_URL}${path}`, {
        headers: { 'Content-Type': 'application/json', ...init?.headers },
        ...init,
      })
    } catch (networkErr) {
      // Erro de rede (CORS durante cold start, timeout, etc.) — tenta de novo
      lastError = networkErr
      continue
    }

    // Resposta temporariamente indisponível — tenta de novo
    if (RETRYABLE_STATUSES.has(res.status)) {
      lastError = new ApiError(res.status, res.statusText)
      continue
    }

    if (!res.ok) {
      let detail = res.statusText
      try {
        const body = await res.json()
        detail = body?.detail ?? detail
      } catch {
        // ignora erro de parse
      }
      throw new ApiError(res.status, detail)
    }

    // 204 No Content → retorna null
    if (res.status === 204) return null as T
    return res.json() as Promise<T>
  }

  throw lastError
}

export const api = {
  get: <T>(path: string) => request<T>(path),
  post: <T>(path: string, body: unknown) =>
    request<T>(path, { method: 'POST', body: JSON.stringify(body) }),
}

export { ApiError }

// ── Payments ──────────────────────────────────────────────────────────────────

import type {
  CreatePaymentPayload,
  CreatePaymentResponse,
  PaymentStatusResponse,
  PublicKeyResponse,
} from '@/types/payment'

export const createPayment = (payload: CreatePaymentPayload) =>
  api.post<CreatePaymentResponse>('/api/payments/create', payload)

export const getPaymentStatus = (paymentId: string) =>
  api.get<PaymentStatusResponse>(`/api/payments/${paymentId}/status`)

export const getMpPublicKey = () =>
  api.get<PublicKeyResponse>('/api/payments/public-key')

