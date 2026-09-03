// Métodos do checkout público. Não incluir os manuais: este tipo também
// descreve o corpo de POST /api/payments, aberto a qualquer visitante.
export type PaymentMethod = 'pix' | 'credit_card'

/** Só o painel registra estes — dinheiro que entrou fora do Mercado Pago. */
export type ManualMethod = 'bank_transfer' | 'camicado' | 'cash' | 'other'

/** Tudo que pode aparecer na coluna Método do relatório unificado. */
export type LedgerMethod = PaymentMethod | ManualMethod

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
