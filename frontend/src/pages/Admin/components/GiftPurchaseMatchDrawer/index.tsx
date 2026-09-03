/**
 * Conciliação entre compras de presente e a lista de convidados.
 *
 * Porta quase direta de `RsvpMatchDrawer`, mesma postura: o backend sugere,
 * aqui a pessoa confirma — nada vinculado sozinho, pelo mesmo risco de nome
 * repetido. Diferença: uma compra não tem titular/acompanhante, é uma entrada
 * por linha, e o vínculo é feito em `gift_purchases.guest_id` via
 * `useUpdateGiftPurchase`, não em `guest`.
 */

import { useMemo, useState } from 'react'
import { App, Alert, Button, Collapse, Drawer, Select, Spin } from 'antd'

import { useAdminGiftPurchaseMatches, useAdminGuests, useAdminRsvps } from '@/hooks/useAdminReports'
import { giftPurchaseErrorMessage, useUpdateGiftPurchase } from '@/hooks/useGiftPurchaseMutations'
import type { AdminGiftPurchaseMatchEntry } from '@/types/admin'
import { GuestDrawer } from '../GuestDrawer'
import { GuestPicker } from '../GuestPicker'
import * as S from './styles'

interface GiftPurchaseMatchDrawerProps {
  open: boolean
  onClose: () => void
}

function EntryHeader({ entry }: { entry: AdminGiftPurchaseMatchEntry }) {
  return (
    <S.EntryName>
      {entry.buyer_name}
      <S.EntryMeta>{entry.gift_title ?? 'Presente removido'}</S.EntryMeta>
    </S.EntryName>
  )
}

export function GiftPurchaseMatchDrawer({ open, onClose }: GiftPurchaseMatchDrawerProps) {
  const { message } = App.useApp()
  const matches = useAdminGiftPurchaseMatches()
  const guests = useAdminGuests()
  const rsvps = useAdminRsvps()
  const updatePurchase = useUpdateGiftPurchase()

  // Escolha manual nos casos ambíguos, por compra.
  const [picked, setPicked] = useState<Record<string, string>>({})
  // Escolha manual em "Fora da lista", quando o nome não bate com ninguém.
  const [manualPicked, setManualPicked] = useState<Record<string, string>>({})
  const [bulkRunning, setBulkRunning] = useState(false)
  // Compra para a qual o drawer "Adicionar convidado" está aberto.
  const [creatingFor, setCreatingFor] = useState<AdminGiftPurchaseMatchEntry | null>(null)

  const items = matches.data?.items ?? []
  const summary = matches.data?.summary
  const guestRows = guests.data?.items ?? []

  const groups = useMemo(
    () => ({
      suggestions: items.filter((entry) => entry.state === 'unique_match'),
      ambiguous: items.filter((entry) => entry.state === 'ambiguous'),
      missing: items.filter((entry) => entry.state === 'no_match'),
      linked: items.filter((entry) => entry.state === 'linked'),
    }),
    [items],
  )

  const link = async (entry: AdminGiftPurchaseMatchEntry, guestId: string | null) => {
    await updatePurchase.mutateAsync({
      id: entry.purchase_id,
      payload: { guest_id: guestId },
    })
  }

  const handleConfirm = async (entry: AdminGiftPurchaseMatchEntry, guestId: string) => {
    try {
      await link(entry, guestId)
      message.success('Vínculo criado.')
    } catch (error) {
      message.error(giftPurchaseErrorMessage(error))
    }
  }

  /** Em série, mesmo motivo do RsvpMatchDrawer: evitar rajada contra o backend. */
  const handleConfirmAll = async () => {
    setBulkRunning(true)
    let done = 0
    let failed = 0

    for (const entry of groups.suggestions) {
      try {
        await link(entry, entry.candidates[0].guest_id)
        done += 1
      } catch {
        failed += 1
      }
    }

    setBulkRunning(false)
    if (failed === 0) message.success(`${done} vínculo(s) criado(s).`)
    else message.warning(`${done} criado(s), ${failed} falhou/falharam.`)
  }

  const handleUnlink = async (entry: AdminGiftPurchaseMatchEntry) => {
    try {
      await link(entry, null)
      message.success('Vínculo desfeito.')
    } catch (error) {
      message.error(giftPurchaseErrorMessage(error))
    }
  }

  return (
    <Drawer open={open} onClose={onClose} width={520} title="Conciliar convidados">
      {matches.isLoading && <Spin />}

      {matches.error && (
        <Alert
          type="error"
          showIcon
          message="Não foi possível carregar as sugestões"
          description={(matches.error as Error).message}
        />
      )}

      {summary && (
        <S.SectionHint>
          {summary.purchases_total} compra(s) recebida(s) · {summary.linked} já vinculada(s)
        </S.SectionHint>
      )}

      <S.Section>
        <S.SectionHeader>
          <S.SectionTitle>Sugestões ({groups.suggestions.length})</S.SectionTitle>
          {groups.suggestions.length > 0 && (
            <Button type="primary" loading={bulkRunning} onClick={handleConfirmAll}>
              Confirmar todas
            </Button>
          )}
        </S.SectionHeader>
        <S.SectionHint>Um único convidado com esse nome. Basta confirmar.</S.SectionHint>

        {groups.suggestions.length === 0 && <S.Empty>Nada pendente aqui.</S.Empty>}
        {groups.suggestions.map((entry) => {
          const candidate = entry.candidates[0]
          return (
            <S.Entry key={entry.purchase_id}>
              <EntryHeader entry={entry} />
              <div>{candidate.full_name}</div>
              <Button
                size="small"
                onClick={() => handleConfirm(entry, candidate.guest_id)}
                loading={updatePurchase.isPending}
              >
                Confirmar
              </Button>
            </S.Entry>
          )
        })}
      </S.Section>

      <S.Section>
        <S.SectionTitle>Ambíguos ({groups.ambiguous.length})</S.SectionTitle>
        <S.SectionHint>
          Mais de um convidado tem esse nome. Escolha de qual pessoa se trata.
        </S.SectionHint>

        {groups.ambiguous.length === 0 && <S.Empty>Nenhum caso ambíguo.</S.Empty>}
        {groups.ambiguous.map((entry) => (
          <S.Entry key={entry.purchase_id}>
            <EntryHeader entry={entry} />
            <Select
              style={{ minWidth: 200 }}
              placeholder="Escolher convidado"
              value={picked[entry.purchase_id]}
              onChange={(value) =>
                setPicked((prev) => ({ ...prev, [entry.purchase_id]: value }))
              }
              options={entry.candidates.map((candidate) => ({
                value: candidate.guest_id,
                label: `${candidate.full_name} (grupo ${candidate.group_label})`,
              }))}
            />
            <Button
              size="small"
              disabled={!picked[entry.purchase_id]}
              onClick={() => handleConfirm(entry, picked[entry.purchase_id])}
            >
              Confirmar
            </Button>
          </S.Entry>
        ))}
      </S.Section>

      <S.Section>
        <S.SectionTitle>Fora da lista ({groups.missing.length})</S.SectionTitle>
        <S.SectionHint>
          Compraram um presente mas o nome não bate com ninguém na lista de convidados.
        </S.SectionHint>

        {groups.missing.length === 0 && <S.Empty>Toda compra tem um nome reconhecido.</S.Empty>}
        {groups.missing.map((entry) => (
          <S.Entry key={entry.purchase_id}>
            <EntryHeader entry={entry} />
            <GuestPicker
              guests={guestRows}
              value={manualPicked[entry.purchase_id]}
              onChange={(guestId) =>
                setManualPicked((prev) => ({ ...prev, [entry.purchase_id]: guestId }))
              }
            />
            <Button
              size="small"
              disabled={!manualPicked[entry.purchase_id]}
              onClick={() => handleConfirm(entry, manualPicked[entry.purchase_id])}
            >
              Vincular
            </Button>
            <Button size="small" onClick={() => setCreatingFor(entry)}>
              Criar convidado
            </Button>
          </S.Entry>
        ))}
      </S.Section>

      <Collapse
        ghost
        items={[
          {
            key: 'linked',
            label: `Já vinculados (${groups.linked.length})`,
            children: groups.linked.length === 0 ? (
              <S.Empty>Nenhum vínculo criado ainda.</S.Empty>
            ) : (
              groups.linked.map((entry) => (
                <S.Entry key={entry.purchase_id}>
                  <EntryHeader entry={entry} />
                  <Button size="small" onClick={() => handleUnlink(entry)}>
                    Desfazer
                  </Button>
                </S.Entry>
              ))
            ),
          },
        ]}
      />

      <GuestDrawer
        open={creatingFor !== null}
        guest={null}
        rows={guestRows}
        rsvps={rsvps.data?.items ?? []}
        presetFullName={creatingFor?.buyer_name}
        onCreated={async (created) => {
          if (!creatingFor) return
          await link(creatingFor, created.id)
        }}
        onClose={() => setCreatingFor(null)}
      />
    </Drawer>
  )
}
