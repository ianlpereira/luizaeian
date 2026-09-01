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

// ── Lista de convidados ───────────────────────────────────────────────────────

export type InviteType = 'physical' | 'digital'
export type GuestSide = 'bride' | 'groom'
export type AgeGroup = 'adult' | 'child'
export type Attendance = 'uncertain' | 'declined'
export type SentStatus = 'sent' | 'pending'

export interface GuestSummary {
  total: number
  /** Famílias/casais: cada grupo recebeu um convite */
  total_groups: number
  physical_invites: number
  digital_invites: number
  bride_side: number
  groom_side: number
  invites_sent: number
  invites_pending: number
  /** Quem ainda não respondeu não entra em declined nem em uncertain */
  declined: number
  uncertain: number
}

export interface AdminGuestRow {
  id: string
  sort_order: number
  full_name: string
  group_index: number
  /** Nome do titular do convite, usado como rótulo do grupo */
  group_label: string
  group_size: number
  is_group_head: boolean
  invite_type: InviteType
  side: GuestSide
  age_group: AgeGroup
  attendance: Attendance | null
  save_the_date_status: SentStatus | null
  invite_sent_status: SentStatus
}

export interface AdminGuestsReport {
  summary: GuestSummary
  items: AdminGuestRow[]
}
