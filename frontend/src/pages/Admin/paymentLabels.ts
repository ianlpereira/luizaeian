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
import type { LedgerMethod, ManualMethod } from '@/types/payment'

/**
 * Record exaustivo de propósito: acrescentar um método ao tipo quebra o
 * type-check aqui até o rótulo existir, e a coluna e o CSV derivam deste mapa.
 */
export const METHOD_LABEL: Record<LedgerMethod, string> = {
  pix: 'Pix',
  credit_card: 'Cartão de crédito',
  bank_transfer: 'Transferência bancária',
  camicado: 'Camicado',
  cash: 'Dinheiro',
  other: 'Outro',
}

/** Só estes aparecem no formulário de lançamento manual. */
export const MANUAL_METHOD_LABEL: Record<ManualMethod, string> = {
  bank_transfer: METHOD_LABEL.bank_transfer,
  camicado: METHOD_LABEL.camicado,
  cash: METHOD_LABEL.cash,
  other: METHOD_LABEL.other,
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
