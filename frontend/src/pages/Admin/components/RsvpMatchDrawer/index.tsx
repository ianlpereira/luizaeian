/**
 * Conciliação entre a lista de convidados e as confirmações recebidas no site.
 *
 * O backend sugere; aqui a pessoa confirma. Nada é vinculado sozinho porque a
 * lista tem nomes repetidos de verdade ("Esposa" aparece 4 vezes), e um palpite
 * errado ficaria gravado sem ninguém notar.
 *
 * Cada confirmação é um PATCH em `guest` gravando `rsvp_id` + `rsvp_role`.
 */

import { useMemo, useState } from 'react'
import { App, Alert, Button, Collapse, Drawer, Select, Spin, Tag } from 'antd'

import { useAdminGuests, useAdminRsvpMatches, useAdminRsvps } from '@/hooks/useAdminReports'
import { guestErrorMessage, useUpdateGuest } from '@/hooks/useAdminGuestMutations'
import type { AdminRsvpMatchEntry } from '@/types/admin'
import { RSVP_ROLE_LABEL, RSVP_STATUS_LABEL } from '../../guestLabels'
import { GuestDrawer } from '../GuestDrawer'
import { GuestPicker } from '../GuestPicker'
import * as S from './styles'

interface RsvpMatchDrawerProps {
  open: boolean
  onClose: () => void
  /** Quando presente, restringe o drawer às pessoas deste RSVP — usado ao abrir
   *  a partir da aba Confirmações, em vez da conciliação geral. */
  rsvpId?: string
}

/** Chave estável de uma entrada: um RSVP tem várias pessoas com papéis distintos. */
const entryKey = (entry: AdminRsvpMatchEntry) =>
  `${entry.rsvp_id}:${entry.entry_role}:${entry.entry_name}`

function EntryHeader({ entry }: { entry: AdminRsvpMatchEntry }) {
  return (
    <S.EntryName>
      {entry.entry_name}
      <S.EntryMeta>
        {RSVP_ROLE_LABEL[entry.entry_role]} em “{entry.rsvp_full_name}” ·{' '}
        {RSVP_STATUS_LABEL[entry.rsvp_status] ?? entry.rsvp_status}
      </S.EntryMeta>
    </S.EntryName>
  )
}

export function RsvpMatchDrawer({ open, onClose, rsvpId }: RsvpMatchDrawerProps) {
  const { message } = App.useApp()
  const matches = useAdminRsvpMatches()
  const guests = useAdminGuests()
  const rsvps = useAdminRsvps()
  const updateGuest = useUpdateGuest()

  // Escolha manual nos casos ambíguos, por entrada.
  const [picked, setPicked] = useState<Record<string, string>>({})
  // Escolha manual em "Fora da lista", quando o nome não bate com ninguém.
  const [manualPicked, setManualPicked] = useState<Record<string, string>>({})
  const [bulkRunning, setBulkRunning] = useState(false)
  // Entrada para a qual o drawer "Adicionar convidado" está aberto.
  const [creatingFor, setCreatingFor] = useState<AdminRsvpMatchEntry | null>(null)

  const allItems = matches.data?.items ?? []
  const items = useMemo(
    () => (rsvpId ? allItems.filter((entry) => entry.rsvp_id === rsvpId) : allItems),
    [allItems, rsvpId],
  )
  const summary = matches.data?.summary
  const guestRows = guests.data?.items ?? []
  const title = rsvpId
    ? `Vincular “${items[0]?.rsvp_full_name ?? ''}”`
    : 'Conciliar confirmações'

  const groups = useMemo(
    () => ({
      suggestions: items.filter((entry) => entry.state === 'unique_match'),
      ambiguous: items.filter((entry) => entry.state === 'ambiguous'),
      missing: items.filter((entry) => entry.state === 'no_match'),
      linked: items.filter((entry) => entry.state === 'linked'),
    }),
    [items],
  )

  const link = async (entry: AdminRsvpMatchEntry, guestId: string) => {
    await updateGuest.mutateAsync({
      id: guestId,
      payload: { rsvp_id: entry.rsvp_id, rsvp_role: entry.entry_role },
    })
  }

  const handleConfirm = async (entry: AdminRsvpMatchEntry, guestId: string) => {
    try {
      await link(entry, guestId)
      message.success('Vínculo criado.')
    } catch (error) {
      message.error(guestErrorMessage(error))
    }
  }

  /**
   * Confirma todas as sugestões inequívocas.
   *
   * Em série, não em paralelo: são poucas dezenas e uma rajada simultânea contra
   * o backend no plano free do Render costuma render 502, que o api.ts tentaria
   * de novo — o serial é mais lento e muito mais previsível.
   */
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

  const handleUnlink = async (entry: AdminRsvpMatchEntry) => {
    if (!entry.linked_guest_id) return
    try {
      await updateGuest.mutateAsync({
        id: entry.linked_guest_id,
        payload: { rsvp_id: null, rsvp_role: null },
      })
      message.success('Vínculo desfeito.')
    } catch (error) {
      message.error(guestErrorMessage(error))
    }
  }

  return (
    <Drawer open={open} onClose={onClose} width={520} title={title}>
      {matches.isLoading && <Spin />}

      {matches.error && (
        <Alert
          type="error"
          showIcon
          message="Não foi possível carregar as sugestões"
          description={(matches.error as Error).message}
        />
      )}

      {!rsvpId && summary && (
        <S.SectionHint>
          {summary.rsvps_total} confirmação(ões) recebida(s), {summary.entries_total} pessoa(s)
          citada(s) · {summary.linked} já vinculada(s)
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
            <S.Entry key={entryKey(entry)}>
              <EntryHeader entry={entry} />
              <div>
                {candidate.full_name}
                {candidate.linked_to_other_rsvp && (
                  <Tag color="warning" style={{ marginLeft: 8 }}>
                    já vinculado a outra
                  </Tag>
                )}
              </div>
              <Button
                size="small"
                onClick={() => handleConfirm(entry, candidate.guest_id)}
                loading={updateGuest.isPending}
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
        {groups.ambiguous.map((entry) => {
          const key = entryKey(entry)
          return (
            <S.Entry key={key}>
              <EntryHeader entry={entry} />
              <Select
                style={{ minWidth: 200 }}
                placeholder="Escolher convidado"
                value={picked[key]}
                onChange={(value) => setPicked((prev) => ({ ...prev, [key]: value }))}
                options={entry.candidates.map((candidate) => ({
                  value: candidate.guest_id,
                  label: `${candidate.full_name} (grupo ${candidate.group_label})${
                    candidate.linked_to_other_rsvp ? ' — já vinculado' : ''
                  }`,
                }))}
              />
              <Button
                size="small"
                disabled={!picked[key]}
                onClick={() => handleConfirm(entry, picked[key])}
              >
                Confirmar
              </Button>
            </S.Entry>
          )
        })}
      </S.Section>

      <S.Section>
        <S.SectionTitle>Fora da lista ({groups.missing.length})</S.SectionTitle>
        <S.SectionHint>
          Confirmaram presença mas não constam na lista de convidados. Adicione pela aba
          Convidados se for o caso.
        </S.SectionHint>

        {groups.missing.length === 0 && <S.Empty>Todo mundo que respondeu está na lista.</S.Empty>}
        {groups.missing.map((entry) => {
          const key = entryKey(entry)
          return (
            <S.Entry key={key}>
              <EntryHeader entry={entry} />
              <GuestPicker
                guests={guestRows}
                value={manualPicked[key]}
                onChange={(guestId) => setManualPicked((prev) => ({ ...prev, [key]: guestId }))}
              />
              <Button
                size="small"
                disabled={!manualPicked[key]}
                onClick={() => handleConfirm(entry, manualPicked[key])}
              >
                Vincular
              </Button>
              <Button size="small" onClick={() => setCreatingFor(entry)}>
                Criar convidado
              </Button>
            </S.Entry>
          )
        })}
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
              groups.linked.map((entry) => {
                const linkedGuest = entry.candidates.find(
                  (candidate) => candidate.guest_id === entry.linked_guest_id,
                )
                return (
                  <S.Entry key={entryKey(entry)}>
                    <EntryHeader entry={entry} />
                    {/* O nome digitado no RSVP nem sempre bate com o do convidado —
                        vínculo manual ou criado na hora costuma divergir. */}
                    {linkedGuest && <div>{linkedGuest.full_name}</div>}
                    <Button size="small" onClick={() => handleUnlink(entry)}>
                      Desfazer
                    </Button>
                  </S.Entry>
                )
              })
            ),
          },
        ]}
      />

      <GuestDrawer
        open={creatingFor !== null}
        guest={null}
        rows={guestRows}
        rsvps={rsvps.data?.items ?? []}
        presetFullName={creatingFor?.entry_name}
        onCreated={async (created) => {
          if (!creatingFor) return
          await link(creatingFor, created.id)
        }}
        onClose={() => setCreatingFor(null)}
      />
    </Drawer>
  )
}
