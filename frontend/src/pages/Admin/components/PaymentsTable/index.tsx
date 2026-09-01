import { Table, Tag, Tooltip } from 'antd'
import type { ColumnsType } from 'antd/es/table'

import type { AdminPaymentRow } from '@/types/admin'
import type { PaymentMethod, PaymentStatus } from '@/types/payment'
import { formatBRL, formatDateTime } from '@/utils/format'
import type { CsvColumn } from '@/utils/toCsv'
import { ExportCsvButton } from '../ExportCsvButton'
import * as S from './styles'

interface PaymentsTableProps {
  rows: AdminPaymentRow[]
  loading: boolean
}

const METHOD_LABEL: Record<PaymentMethod, string> = {
  pix: 'Pix',
  credit_card: 'Cartão de crédito',
}

const STATUS_LABEL: Record<PaymentStatus, string> = {
  approved: 'Aprovado',
  pending: 'Pendente',
  in_process: 'Em análise',
  rejected: 'Recusado',
  cancelled: 'Cancelado',
  expired: 'Expirado',
}

const STATUS_COLOR: Record<PaymentStatus, string> = {
  approved: 'success',
  pending: 'processing',
  in_process: 'processing',
  rejected: 'error',
  cancelled: 'default',
  expired: 'warning',
}

const columns: ColumnsType<AdminPaymentRow> = [
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
    render: (title: string | null) => title ?? '—',
  },
  { title: 'Comprador', dataIndex: 'buyer_name' },
  {
    title: 'Método',
    dataIndex: 'method',
    filters: (Object.keys(METHOD_LABEL) as PaymentMethod[]).map((method) => ({
      text: METHOD_LABEL[method],
      value: method,
    })),
    onFilter: (value, row) => row.method === value,
    render: (method: PaymentMethod) => METHOD_LABEL[method],
  },
  {
    title: 'Status',
    dataIndex: 'status',
    filters: (Object.keys(STATUS_LABEL) as PaymentStatus[]).map((status) => ({
      text: STATUS_LABEL[status],
      value: status,
    })),
    onFilter: (value, row) => row.status === value,
    render: (status: PaymentStatus) => (
      <Tag color={STATUS_COLOR[status]}>{STATUS_LABEL[status]}</Tag>
    ),
  },
  {
    title: 'Valor',
    dataIndex: 'amount',
    sorter: (a, b) => a.amount - b.amount,
    render: (value: number) => formatBRL(value),
  },
  {
    title: 'ID no Mercado Pago',
    dataIndex: 'mp_payment_id',
    render: (id: number | null) => id ?? '—',
  },
  {
    title: 'Mensagem',
    dataIndex: 'message',
    ellipsis: true,
    render: (message: string | null) =>
      message ? <Tooltip title={message}>{message}</Tooltip> : '—',
  },
]

const csvColumns: CsvColumn<AdminPaymentRow>[] = [
  { header: 'Data', value: (row) => formatDateTime(row.created_at) },
  { header: 'Presente', value: (row) => row.gift_title ?? '' },
  { header: 'Comprador', value: (row) => row.buyer_name },
  { header: 'Método', value: (row) => METHOD_LABEL[row.method] },
  { header: 'Status', value: (row) => STATUS_LABEL[row.status] },
  { header: 'Valor', value: (row) => row.amount.toFixed(2).replace('.', ',') },
  { header: 'ID no Mercado Pago', value: (row) => row.mp_payment_id ?? '' },
  { header: 'Mensagem', value: (row) => row.message ?? '' },
]

export function PaymentsTable({ rows, loading }: PaymentsTableProps) {
  return (
    <S.Wrapper>
      <S.Toolbar>
        <S.Heading>Pagamentos</S.Heading>
        <ExportCsvButton filePrefix="pagamentos" columns={csvColumns} rows={rows} />
      </S.Toolbar>

      <Table<AdminPaymentRow>
        rowKey="id"
        columns={columns}
        dataSource={rows}
        loading={loading}
        scroll={{ x: 'max-content' }}
        pagination={{ pageSize: 20, showSizeChanger: true }}
      />
    </S.Wrapper>
  )
}
