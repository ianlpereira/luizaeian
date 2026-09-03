import { Card, Col, Row, Statistic } from 'antd'

import type { GiftLedgerSummary, RsvpSummary } from '@/types/admin'
import { formatBRL } from '@/utils/format'

interface SummaryCardsProps {
  rsvp?: RsvpSummary
  ledger?: GiftLedgerSummary
  loading: boolean
}

/** Números do topo do painel. Um card por métrica, dois por linha no mobile. */
export function SummaryCards({ rsvp, ledger, loading }: SummaryCardsProps) {
  const cards = [
    { title: 'Confirmados', value: rsvp?.confirmed ?? 0 },
    { title: 'Convidados confirmados', value: rsvp?.total_guests ?? 0 },
    { title: 'Recusas', value: rsvp?.declined ?? 0 },
    {
      title: 'Valor aprovado',
      value: formatBRL(ledger?.approved_amount ?? 0),
    },
    { title: 'Pagamentos pendentes', value: ledger?.pending_count ?? 0 },
    { title: 'Pagamentos recusados', value: ledger?.rejected_count ?? 0 },
  ]

  return (
    <Row gutter={[16, 16]}>
      {cards.map((card) => (
        <Col key={card.title} xs={12} md={8} xl={4}>
          <Card size="small">
            <Statistic title={card.title} value={card.value} loading={loading} />
          </Card>
        </Col>
      ))}
    </Row>
  )
}
