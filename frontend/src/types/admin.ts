import type { Companion } from '@/types/rsvp'
import type { PaymentMethod, PaymentStatus } from '@/types/payment'

/** Espelho dos schemas Pydantic em backend/app/schemas/admin.py */

export interface AdminToken {
  access_token: string
  token_type: 'bearer'
  expires_in: number
}

export interface AdminMe {
  username: string
}

// ── RSVP ──────────────────────────────────────────────────────────────────────

export interface RsvpSummary {
  total_responses: number
  confirmed: number
  declined: number
  /** Soma apenas das respostas confirmadas (titular + acompanhantes) */
  total_guests: number
  companions_count: number
}

export interface AdminRsvpRow {
  id: string
  full_name: string
  email: string
  status: 'confirmed' | 'declined'
  companions: Companion[]
  companions_count: number
  headcount: number
  created_at: string
}

export interface AdminRsvpsReport {
  summary: RsvpSummary
  items: AdminRsvpRow[]
}

// ── Presentes ─────────────────────────────────────────────────────────────────

export interface GiftSummary {
  total_gifts: number
  visible_gifts: number
  hidden_gifts: number
  gifts_with_purchases: number
  purchase_records: number
}

export interface AdminGiftRow {
  id: string
  title: string
  price: number
  category: string
  image_url: string | null
  hidden: boolean
  /** Linhas em gift_purchases — se sobrepõem a approved_payments, nunca somar */
  purchase_records: number
  approved_payments: number
  approved_amount: number
  created_at: string
}

export interface AdminGiftsReport {
  summary: GiftSummary
  items: AdminGiftRow[]
}

// ── Pagamentos ────────────────────────────────────────────────────────────────

export interface PaymentSummary {
  approved_amount: number
  approved_count: number
  pending_count: number
  rejected_count: number
  other_count: number
  total_count: number
}

export interface AdminPaymentRow {
  id: string
  gift_id: string
  gift_title: string | null
  mp_payment_id: number | null
  method: PaymentMethod
  status: PaymentStatus
  amount: number
  buyer_name: string
  message: string | null
  created_at: string
}

export interface AdminPaymentsReport {
  summary: PaymentSummary
  items: AdminPaymentRow[]
}
