/**
 * Seleção de um presente do catálogo, no mesmo formato do `GuestPicker`.
 *
 * Sempre opcional: um lançamento manual costuma ser dinheiro solto — uma
 * transferência não corresponde a item nenhum da lista.
 *
 * Mostra também os ocultos, porque `useAdminGifts` os inclui (ao contrário do
 * catálogo público) e um presente escondido continua podendo receber presente.
 */

import { Select } from 'antd'

import type { AdminGiftRow } from '@/types/admin'
import { formatBRL, normalizeText } from '@/utils/format'

interface GiftPickerProps {
  gifts: AdminGiftRow[]
  // Opcionais: dentro de um Form.Item quem injeta os dois é o próprio Form.
  value?: string
  onChange?: (giftId: string | undefined) => void
  placeholder?: string
}

export function GiftPicker({ gifts, value, onChange, placeholder }: GiftPickerProps) {
  return (
    <Select
      showSearch
      allowClear
      placeholder={placeholder ?? 'Nenhum presente específico'}
      value={value}
      onChange={onChange}
      options={gifts.map((gift) => ({
        value: gift.id,
        label: `${gift.title} — ${formatBRL(gift.price)}${gift.hidden ? ' (oculto)' : ''}`,
      }))}
      filterOption={(input, option) =>
        normalizeText(String(option?.label ?? '')).includes(normalizeText(input))
      }
    />
  )
}
