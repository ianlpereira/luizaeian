/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** URL base da API FastAPI. Ex.: http://localhost:8000 */
  readonly VITE_API_URL: string
  /** True during `vite dev`, false in `vite build` output. */
  readonly DEV: boolean
  /** True in `vite build` output, false during `vite dev`. */
  readonly PROD: boolean
  /** Vite mode string, e.g. "development" or "production". */
  readonly MODE: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
