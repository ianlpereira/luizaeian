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

// ── Compras e pagamentos ─────────────────────────────────────────────────────

/** Os status do Mercado Pago mais a compra registrada sem pagamento por trás. */
export type LedgerStatus = PaymentStatus | 'no_payment'

export interface GiftLedgerSummary {
  /** Financeiro: só de `payments`. Linhas 'no_payment' não entram aqui. */
  approved_amount: number
  approved_count: number
  pending_count: number
  rejected_count: number
  other_count: number
  total_payments: number
  /** Vínculo com a lista de convidados: só existe para linhas com purchase_id. */
  purchases_total: number
  linked: number
  unlinked: number
}

export interface AdminGiftLedgerRow {
  /** rowKey da tabela — 'c:<uuid>' para compra, 'p:<uuid>' para pagamento órfão. */
  key: string
  purchase_id: string | null
  payment_id: string | null
  gift_id: string
  gift_title: string | null
  buyer_name: string
  message: string | null
  status: LedgerStatus
  method: PaymentMethod | null
  amount: number | null
  mp_payment_id: number | null
  guest_id: string | null
  guest_full_name: string | null
  created_at: string
}

export interface AdminGiftLedgerReport {
  summary: GiftLedgerSummary
  items: AdminGiftLedgerRow[]
}

/** Linha isolada devolvida pelo PATCH de vínculo. */
export interface AdminGiftPurchaseRow {
  id: string
  gift_id: string
  gift_title: string | null
  buyer_name: string
  message: string | null
  guest_id: string | null
  guest_full_name: string | null
  created_at: string
}

/** Único campo possível de mudar: o vínculo com um convidado. `null` desfaz. */
export interface AdminGiftPurchaseUpdate {
  guest_id: string | null
}

// ── Lista de convidados ───────────────────────────────────────────────────────

export type InviteType = 'physical' | 'digital'
export type GuestSide = 'bride' | 'groom'
export type AgeGroup = 'adult' | 'child'
export type Attendance = 'confirmed' | 'uncertain' | 'declined'
export type SentStatus = 'sent' | 'pending'
export type RsvpRole = 'primary' | 'companion'

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
  /** Quem ainda não respondeu não entra em nenhum dos três */
  declined: number
  uncertain: number
  confirmed: number
  linked_to_rsvp: number
  /** Confirmações que nenhum convidado reivindica — gente fora da lista */
  rsvps_without_guest: number
}

export interface AdminGuestRow {
  id: string
  sort_order: number
  full_name: string
  group_index: number
  /** Derivados na leitura a partir do grupo — não são colunas da tabela */
  group_label: string
  group_size: number
  is_group_head: boolean
  invite_type: InviteType
  side: GuestSide
  age_group: AgeGroup
  attendance: Attendance | null
  save_the_date_status: SentStatus | null
  invite_sent_status: SentStatus
  rsvp_id: string | null
  rsvp_role: RsvpRole | null
  rsvp_full_name: string | null
  rsvp_email: string | null
  rsvp_status: string | null
  edited_at: string | null
}

export interface AdminGuestsReport {
  summary: GuestSummary
  items: AdminGuestRow[]
}

export interface AdminGuestCreate {
  full_name: string
  side: GuestSide
  invite_type: InviteType
  age_group?: AgeGroup
  /** Grupo existente, ou null para abrir um grupo novo */
  group_index: number | null
  attendance?: Attendance | null
  save_the_date_status?: SentStatus | null
  invite_sent_status?: SentStatus
}

/** Atualização parcial: só as chaves presentes são alteradas. */
export interface AdminGuestUpdate {
  full_name?: string
  side?: GuestSide
  invite_type?: InviteType
  age_group?: AgeGroup
  attendance?: Attendance | null
  save_the_date_status?: SentStatus | null
  invite_sent_status?: SentStatus
  rsvp_id?: string | null
  rsvp_role?: RsvpRole | null
}

// ── Casamento entre lista e confirmações ──────────────────────────────────────

export type MatchState = 'linked' | 'unique_match' | 'ambiguous' | 'no_match'

export interface RsvpMatchCandidate {
  guest_id: string
  full_name: string
  group_label: string
  /** Já aponta para outro RSVP: confirmar aqui sobrescreve o vínculo atual */
  linked_to_other_rsvp: boolean
}

/** Uma pessoa dentro de um RSVP: o titular ou um dos acompanhantes. */
export interface AdminRsvpMatchEntry {
  rsvp_id: string
  rsvp_full_name: string
  rsvp_email: string
  rsvp_status: string
  entry_name: string
  entry_role: RsvpRole
  state: MatchState
  linked_guest_id: string | null
  candidates: RsvpMatchCandidate[]
}

export interface RsvpMatchSummary {
  rsvps_total: number
  entries_total: number
  linked: number
  unique_match: number
  ambiguous: number
  no_match: number
}

export interface AdminRsvpMatchesReport {
  summary: RsvpMatchSummary
  items: AdminRsvpMatchEntry[]
}

// ── Casamento entre compras de presentes e convidados ──────────────────────────

export interface GiftPurchaseMatchCandidate {
  guest_id: string
  full_name: string
  group_label: string
}

export interface AdminGiftPurchaseMatchEntry {
  purchase_id: string
  gift_id: string
  gift_title: string | null
  buyer_name: string
  message: string | null
  created_at: string
  state: MatchState
  linked_guest_id: string | null
  candidates: GiftPurchaseMatchCandidate[]
}

export interface GiftPurchaseMatchSummary {
  purchases_total: number
  linked: number
  unique_match: number
  ambiguous: number
  no_match: number
}

export interface AdminGiftPurchaseMatchesReport {
  summary: GiftPurchaseMatchSummary
  items: AdminGiftPurchaseMatchEntry[]
}
