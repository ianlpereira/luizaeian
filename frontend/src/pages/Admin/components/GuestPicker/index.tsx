/**
 * Busca manual na lista inteira de convidados.
 *
 * As sugestões (`RsvpMatchDrawer`, `GiftPurchaseMatchDrawer`) só candidatam quem
 * casa por nome normalizado. Quando ninguém casa, o vínculo certo pode existir
 * mesmo assim — nome digitado bem diferente do que está na planilha. Este
 * seletor cobre esse caso: toda a lista, filtrável, sem depender de nome.
 */

import { Select } from 'antd'

import type { AdminGuestRow } from '@/types/admin'
import { normalizeText } from '@/utils/format'

interface GuestPickerProps {
  guests: AdminGuestRow[]
  // value/onChange são opcionais porque dentro de um Form.Item quem os injeta é
  // o próprio Form, não quem escreve o JSX.
  value?: string
  onChange?: (guestId: string) => void
  placeholder?: string
  allowClear?: boolean
}

export function GuestPicker({
  guests,
  value,
  onChange,
  placeholder,
  allowClear,
}: GuestPickerProps) {
  return (
    <Select
      style={{ minWidth: 220 }}
      showSearch
      allowClear={allowClear}
      placeholder={placeholder ?? 'Buscar convidado'}
      value={value}
      onChange={onChange}
      options={guests.map((guest) => ({
        value: guest.id,
        label: `${guest.full_name} (grupo ${guest.group_label})`,
      }))}
      filterOption={(input, option) =>
        normalizeText(String(option?.label ?? '')).includes(normalizeText(input))
      }
    />
  )
}
