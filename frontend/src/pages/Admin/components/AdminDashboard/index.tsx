import { useEffect, useState } from 'react'
import { Alert, Button, Tabs } from 'antd'

import { useAdminLogout } from '@/hooks/useAdminAuth'
import {
  useAdminGifts,
  useAdminGuests,
  useAdminPayments,
  useAdminRsvps,
  useRefreshAdminReports,
} from '@/hooks/useAdminReports'
import { GiftsTable } from '../GiftsTable'
import { GuestsTable } from '../GuestsTable'
import { PaymentsTable } from '../PaymentsTable'
import { RsvpTable } from '../RsvpTable'
import { SummaryCards } from '../SummaryCards'
import * as S from './styles'

/** Depois disso, um carregamento em andamento provavelmente é cold start do Render. */
const COLD_START_HINT_MS = 4000

export function AdminDashboard() {
  const guests = useAdminGuests()
  const rsvps = useAdminRsvps()
  const gifts = useAdminGifts()
  const payments = useAdminPayments()

  const refresh = useRefreshAdminReports()
  const logout = useAdminLogout()

  const isLoading = guests.isLoading || rsvps.isLoading || gifts.isLoading || payments.isLoading
  const [showColdStartHint, setShowColdStartHint] = useState(false)

  useEffect(() => {
    if (!isLoading) {
      setShowColdStartHint(false)
      return
    }

    // O api.ts faz retry com backoff em silêncio (até ~15 s). Sem esse aviso a
    // tela parece travada enquanto o backend do Render sai da hibernação.
    const timer = window.setTimeout(() => setShowColdStartHint(true), COLD_START_HINT_MS)
    return () => window.clearTimeout(timer)
  }, [isLoading])

  const error = guests.error ?? rsvps.error ?? gifts.error ?? payments.error

  return (
    <S.Page>
      <S.Header>
        <S.Titles>
          <S.Title>Painel administrativo</S.Title>
          <S.Subtitle>Luiza &amp; Ian</S.Subtitle>
        </S.Titles>

        <S.Actions>
          <Button onClick={refresh} loading={isLoading}>
            Atualizar
          </Button>
          <Button onClick={logout}>Sair</Button>
        </S.Actions>
      </S.Header>

      {showColdStartHint && (
        <Alert type="info" showIcon message="Acordando o servidor… isso pode levar alguns segundos." />
      )}

      {error && (
        <Alert
          type="error"
          showIcon
          message="Não foi possível carregar os relatórios"
          description={(error as Error).message}
        />
      )}

      <SummaryCards
        rsvp={rsvps.data?.summary}
        payments={payments.data?.summary}
        loading={isLoading}
      />

      <Tabs
        defaultActiveKey="guests"
        items={[
          {
            key: 'guests',
            label: 'Convidados',
            children: (
              <GuestsTable
                rows={guests.data?.items ?? []}
                summary={guests.data?.summary}
                // O drawer precisa da lista de RSVPs para o select de vínculo.
                rsvps={rsvps.data?.items ?? []}
                loading={guests.isLoading}
              />
            ),
          },
          {
            key: 'rsvps',
            label: 'Confirmações',
            children: <RsvpTable rows={rsvps.data?.items ?? []} loading={rsvps.isLoading} />,
          },
          {
            key: 'gifts',
            label: 'Presentes',
            children: <GiftsTable rows={gifts.data?.items ?? []} loading={gifts.isLoading} />,
          },
          {
            key: 'payments',
            label: 'Pagamentos',
            children: (
              <PaymentsTable rows={payments.data?.items ?? []} loading={payments.isLoading} />
            ),
          },
        ]}
      />
    </S.Page>
  )
}
