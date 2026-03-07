/**
 * Cliente HTTP centralizado para a API FastAPI.
 *
 * Usa fetch nativo — sem dependências externas.
 * A URL base vem de VITE_API_URL (ex.: http://localhost:8000 em dev,
 * https://luizaeian-backend.onrender.com em produção).
 */

const BASE_URL = (import.meta.env.VITE_API_URL as string | undefined ?? '').replace(/\/$/, '')

if (!BASE_URL) {
  throw new Error('Missing env var: VITE_API_URL. Add it to frontend/.env')
}

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
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: { 'Content-Type': 'application/json', ...init?.headers },
    ...init,
  })

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

export const api = {
  get: <T>(path: string) => request<T>(path),
  post: <T>(path: string, body: unknown) =>
    request<T>(path, { method: 'POST', body: JSON.stringify(body) }),
}

export { ApiError }
