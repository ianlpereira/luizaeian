import { useMemo, useState } from 'react'
import { Card, Col, Input, Row, Statistic, Table, Tag } from 'antd'
import type { ColumnsType } from 'antd/es/table'

import type {
  AdminGuestRow,
  Attendance,
  GuestSide,
  GuestSummary,
  InviteType,
  SentStatus,
} from '@/types/admin'
import { normalizeText } from '@/utils/format'
import type { CsvColumn } from '@/utils/toCsv'
import { ExportCsvButton } from '../ExportCsvButton'
import * as S from './styles'

interface GuestsTableProps {
  rows: AdminGuestRow[]
  summary?: GuestSummary
  loading: boolean
}

const INVITE_TYPE_LABEL: Record<InviteType, string> = {
  physical: 'Físico',
  digital: 'Digital',
}

const SIDE_LABEL: Record<GuestSide, string> = {
  bride: 'Noiva',
  groom: 'Noivo',
}

const SENT_LABEL: Record<SentStatus, string> = {
  sent: 'Enviado',
  pending: 'Pendente',
}

const ATTENDANCE_LABEL: Record<Attendance, string> = {
  uncertain: 'Incerteza',
  declined: 'Não vai',
}

const ATTENDANCE_COLOR: Record<Attendance, string> = {
  uncertain: 'warning',
  declined: 'error',
}

const EMPTY = '—'

const renderSent = (value: SentStatus | null) =>
  value === null ? (
    EMPTY
  ) : (
    <Tag color={value === 'sent' ? 'success' : 'default'}>{SENT_LABEL[value]}</Tag>
  )

/** Filtros de coluna a partir de um mapa de rótulos — a ordem das chaves manda. */
const filtersFrom = <T extends string>(labels: Record<T, string>) =>
  (Object.keys(labels) as T[]).map((value) => ({ text: labels[value], value }))

const columns: ColumnsType<AdminGuestRow> = [
  {
    title: 'Nome',
    dataIndex: 'full_name',
    sorter: (a, b) => a.full_name.localeCompare(b.full_name, 'pt-BR'),
  },
  {
    title: 'Grupo',
    dataIndex: 'group_label',
    // Ordena pelo índice, não pelo rótulo: mantém as famílias na ordem da planilha.
    sorter: (a, b) => a.group_index - b.group_index || a.sort_order - b.sort_order,
    render: (label: string, row) => (
      <>
        {label}
        {row.group_size > 1 && <S.GroupSize>+{row.group_size - 1}</S.GroupSize>}
      </>
    ),
  },
  {
    title: 'Convite',
    dataIndex: 'invite_type',
    filters: filtersFrom(INVITE_TYPE_LABEL),
    onFilter: (value, row) => row.invite_type === value,
    render: (value: InviteType) => INVITE_TYPE_LABEL[value],
  },
  {
    title: 'Origem',
    dataIndex: 'side',
    filters: filtersFrom(SIDE_LABEL),
    onFilter: (value, row) => row.side === value,
    render: (value: GuestSide) => SIDE_LABEL[value],
  },
  {
    title: 'Comparecimento',
    dataIndex: 'attendance',
    filters: [...filtersFrom(ATTENDANCE_LABEL), { text: 'Sem resposta', value: 'none' }],
    onFilter: (value, row) => (value === 'none' ? row.attendance === null : row.attendance === value),
    render: (value: Attendance | null) =>
      value === null ? EMPTY : <Tag color={ATTENDANCE_COLOR[value]}>{ATTENDANCE_LABEL[value]}</Tag>,
  },
  {
    title: 'Save the Date',
    dataIndex: 'save_the_date_status',
    filters: [...filtersFrom(SENT_LABEL), { text: 'Sem registro', value: 'none' }],
    onFilter: (value, row) =>
      value === 'none' ? row.save_the_date_status === null : row.save_the_date_status === value,
    render: renderSent,
  },
  {
    title: 'Convite enviado',
    dataIndex: 'invite_sent_status',
    filters: filtersFrom(SENT_LABEL),
    onFilter: (value, row) => row.invite_sent_status === value,
    render: renderSent,
  },
]

const csvColumns: CsvColumn<AdminGuestRow>[] = [
  { header: 'Nome', value: (row) => row.full_name },
  { header: 'Grupo', value: (row) => row.group_label },
  { header: 'Pessoas no grupo', value: (row) => row.group_size },
  { header: 'Convite', value: (row) => INVITE_TYPE_LABEL[row.invite_type] },
  { header: 'Origem', value: (row) => SIDE_LABEL[row.side] },
  {
    header: 'Comparecimento',
    value: (row) => (row.attendance ? ATTENDANCE_LABEL[row.attendance] : ''),
  },
  {
    header: 'Save the Date',
    value: (row) => (row.save_the_date_status ? SENT_LABEL[row.save_the_date_status] : ''),
  },
  { header: 'Convite enviado', value: (row) => SENT_LABEL[row.invite_sent_status] },
]

export function GuestsTable({ rows, summary, loading }: GuestsTableProps) {
  const [search, setSearch] = useState('')

  // A lista inteira já vem numa única resposta, então a busca é local. Casar
  // também com o rótulo do grupo faz o nome do titular trazer a família toda.
  const filteredRows = useMemo(() => {
    const term = normalizeText(search)
    if (!term) return rows

    return rows.filter(
      (row) =>
        normalizeText(row.full_name).includes(term) ||
        normalizeText(row.group_label).includes(term),
    )
  }, [rows, search])

  const cards = [
    { title: 'Convidados', value: summary?.total ?? 0 },
    { title: 'Convites (grupos)', value: summary?.total_groups ?? 0 },
    { title: 'Convites físicos', value: summary?.physical_invites ?? 0 },
    { title: 'Convites digitais', value: summary?.digital_invites ?? 0 },
    { title: 'Convites enviados', value: summary?.invites_sent ?? 0 },
    { title: 'Convites pendentes', value: summary?.invites_pending ?? 0 },
  ]

  return (
    <S.Wrapper>
      <Row gutter={[16, 16]}>
        {cards.map((card) => (
          <Col key={card.title} xs={12} md={8} xl={4}>
            <Card size="small">
              <Statistic title={card.title} value={card.value} loading={loading} />
            </Card>
          </Col>
        ))}
      </Row>

      <S.Toolbar>
        <S.Heading>Lista de convidados</S.Heading>

        <S.Tools>
          <Input.Search
            allowClear
            placeholder="Buscar por nome"
            style={{ width: 240 }}
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
          <ExportCsvButton filePrefix="convidados" columns={csvColumns} rows={filteredRows} />
        </S.Tools>
      </S.Toolbar>

      <Table<AdminGuestRow>
        rowKey="id"
        columns={columns}
        dataSource={filteredRows}
        loading={loading}
        scroll={{ x: 'max-content' }}
        pagination={{ pageSize: 20, showSizeChanger: true, showTotal: (total) => `${total} convidados` }}
      />
    </S.Wrapper>
  )
}
