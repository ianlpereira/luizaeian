import { useState } from 'react'
import { Badge, Button, Table, Tag, Tooltip } from 'antd'
import type { ColumnsType } from 'antd/es/table'

import type { AdminGiftLedgerRow, LedgerStatus } from '@/types/admin'
import type { PaymentMethod } from '@/types/payment'
import { formatAmountCsv, formatBRL, formatDateTime } from '@/utils/format'
import type { CsvColumn } from '@/utils/toCsv'
import { EMPTY, filtersFrom } from '../../guestLabels'
import { LEDGER_STATUS_COLOR, LEDGER_STATUS_LABEL, METHOD_LABEL } from '../../paymentLabels'
import { ExportCsvButton } from '../ExportCsvButton'
import { GiftPurchaseMatchDrawer } from '../GiftPurchaseMatchDrawer'
import * as S from './styles'

interface GiftLedgerTableProps {
  rows: AdminGiftLedgerRow[]
  loading: boolean
}

const columns: ColumnsType<AdminGiftLedgerRow> = [
  {
    title: 'Data',
    dataIndex: 'created_at',
    defaultSortOrder: 'descend',
    sorter: (a, b) => a.created_at.localeCompare(b.created_at),
    render: (value: string) => formatDateTime(value),
  },
  {
    title: 'Presente',
    dataIndex: 'gift_title',
    render: (title: string | null) => title ?? EMPTY,
  },
  { title: 'Comprador', dataIndex: 'buyer_name' },
  {
    title: 'Status',
    dataIndex: 'status',
    filters: filtersFrom(LEDGER_STATUS_LABEL),
    onFilter: (value, row) => row.status === value,
    render: (status: LedgerStatus) => (
      <Tag color={LEDGER_STATUS_COLOR[status]}>{LEDGER_STATUS_LABEL[status]}</Tag>
    ),
  },
  {
    title: 'Valor',
    dataIndex: 'amount',
    // Linhas sem pagamento não têm valor: -1 as joga para o fim da ordem crescente.
    sorter: (a, b) => (a.amount ?? -1) - (b.amount ?? -1),
    render: (value: number | null) => (value === null ? EMPTY : formatBRL(value)),
  },
  {
    title: 'Método',
    dataIndex: 'method',
    filters: filtersFrom(METHOD_LABEL),
    onFilter: (value, row) => row.method === value,
    render: (method: PaymentMethod | null) => (method ? METHOD_LABEL[method] : EMPTY),
  },
  {
    title: 'Convidado vinculado',
    dataIndex: 'guest_full_name',
    filters: [
      { text: 'Vinculado', value: 'linked' },
      { text: 'Sem vínculo', value: 'none' },
    ],
    onFilter: (value, row) =>
      value === 'linked' ? row.guest_id !== null : row.guest_id === null,
    render: (name: string | null) => (name ? <Tag color="success">{name}</Tag> : EMPTY),
  },
  {
    title: 'ID no Mercado Pago',
    dataIndex: 'mp_payment_id',
    render: (id: number | null) => id ?? EMPTY,
  },
  {
    title: 'Mensagem',
    dataIndex: 'message',
    ellipsis: true,
    render: (message: string | null) =>
      message ? <Tooltip title={message}>{message}</Tooltip> : EMPTY,
  },
]

const csvColumns: CsvColumn<AdminGiftLedgerRow>[] = [
  { header: 'Data', value: (row) => formatDateTime(row.created_at) },
  { header: 'Presente', value: (row) => row.gift_title ?? '' },
  { header: 'Comprador', value: (row) => row.buyer_name },
  { header: 'Status', value: (row) => LEDGER_STATUS_LABEL[row.status] },
  { header: 'Valor', value: (row) => (row.amount === null ? '' : formatAmountCsv(row.amount)) },
  { header: 'Método', value: (row) => (row.method ? METHOD_LABEL[row.method] : '') },
  { header: 'Convidado vinculado', value: (row) => row.guest_full_name ?? '' },
  { header: 'ID no Mercado Pago', value: (row) => row.mp_payment_id ?? '' },
  { header: 'Mensagem', value: (row) => row.message ?? '' },
]

/**
 * Compras e pagamentos na mesma tabela: uma linha por transação.
 *
 * Antes eram duas abas. Um pagamento aprovado gera uma linha em
 * `gift_purchases`, então o mesmo evento aparecia nas duas sem nada indicando
 * que era um só. Agora a FK `gift_purchases.payment_id` junta os dois lados no
 * backend e aqui chega tudo pronto.
 */
export function GiftLedgerTable({ rows, loading }: GiftLedgerTableProps) {
  const [matchOpen, setMatchOpen] = useState(false)

  // Só compras podem ser vinculadas a um convidado — um pagamento que nunca
  // virou compra (pendente, recusado) não tem o que conciliar.
  const pendingLinks = rows.filter(
    (row) => row.purchase_id !== null && row.guest_id === null,
  ).length

  return (
    <S.Wrapper>
      <S.Toolbar>
        <S.Heading>Compras e pagamentos</S.Heading>

        <S.Tools>
          <Badge count={pendingLinks} size="small">
            <Button onClick={() => setMatchOpen(true)}>Conciliar convidados</Button>
          </Badge>
          <ExportCsvButton filePrefix="compras-pagamentos" columns={csvColumns} rows={rows} />
        </S.Tools>
      </S.Toolbar>

      <Table<AdminGiftLedgerRow>
        // Não é "id": as linhas vêm de duas tabelas e o backend monta a chave.
        rowKey="key"
        columns={columns}
        dataSource={rows}
        loading={loading}
        scroll={{ x: 'max-content' }}
        pagination={{ pageSize: 20, showSizeChanger: true }}
      />

      <GiftPurchaseMatchDrawer open={matchOpen} onClose={() => setMatchOpen(false)} />
    </S.Wrapper>
  )
}
