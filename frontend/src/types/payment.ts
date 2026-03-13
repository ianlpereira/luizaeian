export type PaymentMethod = 'pix' | 'credit_card'

export type PaymentStatus =
  | 'pending'
  | 'approved'
  | 'rejected'
  | 'cancelled'
  | 'expired'
  | 'in_process'

// ── Payloads de request ───────────────────────────────────────────────────────

export interface CreatePaymentPayload {
  gift_id: string
  buyer_name: string
  message?: string
  method: PaymentMethod
  // Dados do pagador — obrigatório pelo MP em produção
  payer_email?: string
  payer_last_name?: string
  payer_cpf?: string
  // Apenas cartão de crédito
  card_token?: string
  installments?: number
  payment_method_id?: string
  issuer_id?: string
}

// ── Responses da API ──────────────────────────────────────────────────────────

export interface CreatePaymentResponse {
  payment_id: string
  mp_payment_id: number | null
  status: PaymentStatus
  method: PaymentMethod
  // Pix
  qr_code?: string | null
  qr_code_base64?: string | null
  expires_at?: string | null
  // Cartão / erros
  detail?: string | null
}

export interface PaymentStatusResponse {
  payment_id: string
  status: PaymentStatus
  paid: boolean
}

export interface PublicKeyResponse {
  public_key: string
}
