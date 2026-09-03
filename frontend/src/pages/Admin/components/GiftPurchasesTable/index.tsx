import { useState } from 'react'
import { Badge, Button, Table, Tag, Tooltip } from 'antd'
import type { ColumnsType } from 'antd/es/table'

import type { AdminGiftPurchaseRow } from '@/types/admin'
import { formatDateTime } from '@/utils/format'
import type { CsvColumn } from '@/utils/toCsv'
import { EMPTY } from '../../guestLabels'
import { ExportCsvButton } from '../ExportCsvButton'
import { GiftPurchaseMatchDrawer } from '../GiftPurchaseMatchDrawer'
import * as S from './styles'

interface GiftPurchasesTableProps {
  rows: AdminGiftPurchaseRow[]
  loading: boolean
}

const columns: ColumnsType<AdminGiftPurchaseRow> = [
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
    title: 'Convidado vinculado',
    dataIndex: 'guest_full_name',
    filters: [
      { text: 'Vinculado', value: 'linked' },
      { text: 'Sem vínculo', value: 'none' },
    ],
    onFilter: (value, row) =>
      value === 'linked' ? row.guest_id !== null : row.guest_id === null,
    render: (name: string | null) =>
      name ? <Tag color="success">{name}</Tag> : EMPTY,
  },
  {
    title: 'Mensagem',
    dataIndex: 'message',
    ellipsis: true,
    render: (message: string | null) =>
      message ? <Tooltip title={message}>{message}</Tooltip> : EMPTY,
  },
]

const csvColumns: CsvColumn<AdminGiftPurchaseRow>[] = [
  { header: 'Data', value: (row) => formatDateTime(row.created_at) },
  { header: 'Presente', value: (row) => row.gift_title ?? '' },
  { header: 'Comprador', value: (row) => row.buyer_name },
  { header: 'Convidado vinculado', value: (row) => row.guest_full_name ?? '' },
  { header: 'Mensagem', value: (row) => row.message ?? '' },
]

export function GiftPurchasesTable({ rows, loading }: GiftPurchasesTableProps) {
  const [matchOpen, setMatchOpen] = useState(false)
  const pendingLinks = rows.filter((row) => row.guest_id === null).length

  return (
    <S.Wrapper>
      <S.Toolbar>
        <S.Heading>Compras de presentes</S.Heading>

        <S.Tools>
          <Badge count={pendingLinks} size="small">
            <Button onClick={() => setMatchOpen(true)}>Conciliar convidados</Button>
          </Badge>
          <ExportCsvButton filePrefix="compras" columns={csvColumns} rows={rows} />
        </S.Tools>
      </S.Toolbar>

      <Table<AdminGiftPurchaseRow>
        rowKey="id"
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
