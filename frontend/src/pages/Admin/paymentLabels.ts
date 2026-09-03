/**
 * Rótulos pt-BR dos enums financeiros, no mesmo espírito de `guestLabels`.
 *
 * O banco guarda os status em inglês, iguais aos do Mercado Pago. `no_payment`
 * é o único que não vem de lá: marca a compra registrada pelo endpoint público,
 * sem dinheiro por trás.
 *
 * A ordem das chaves define a ordem dos filtros de coluna.
 */

import type { LedgerStatus } from '@/types/admin'
import type { PaymentMethod } from '@/types/payment'

export const METHOD_LABEL: Record<PaymentMethod, string> = {
  pix: 'Pix',
  credit_card: 'Cartão de crédito',
}

export const LEDGER_STATUS_LABEL: Record<LedgerStatus, string> = {
  approved: 'Aprovado',
  pending: 'Pendente',
  in_process: 'Em análise',
  rejected: 'Recusado',
  cancelled: 'Cancelado',
  expired: 'Expirado',
  no_payment: 'Sem pagamento',
}

export const LEDGER_STATUS_COLOR: Record<LedgerStatus, string> = {
  approved: 'success',
  pending: 'processing',
  in_process: 'processing',
  rejected: 'error',
  cancelled: 'default',
  expired: 'warning',
  no_payment: 'default',
}
