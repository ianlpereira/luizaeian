import { useMemo, useState } from 'react'
import { Badge, Button, Card, Col, Input, Row, Statistic, Table, Tag, Tooltip } from 'antd'
import type { ColumnsType } from 'antd/es/table'

import type {
  AdminGuestRow,
  AdminRsvpRow,
  Attendance,
  GuestSide,
  GuestSummary,
  InviteType,
  SentStatus,
} from '@/types/admin'
import { normalizeText } from '@/utils/format'
import type { CsvColumn } from '@/utils/toCsv'
import {
  ATTENDANCE_COLOR,
  ATTENDANCE_LABEL,
  EMPTY,
  INVITE_TYPE_LABEL,
  RSVP_ROLE_LABEL,
  RSVP_STATUS_LABEL,
  SENT_LABEL,
  SIDE_LABEL,
  filtersFrom,
} from '../../guestLabels'
import { ExportCsvButton } from '../ExportCsvButton'
import { GuestDrawer } from '../GuestDrawer'
import { RsvpMatchDrawer } from '../RsvpMatchDrawer'
import * as S from './styles'

interface GuestsTableProps {
  rows: AdminGuestRow[]
  summary?: GuestSummary
  rsvps: AdminRsvpRow[]
  loading: boolean
}

const renderSent = (value: SentStatus | null) =>
  value === null ? (
    EMPTY
  ) : (
    <Tag color={value === 'sent' ? 'success' : 'default'}>{SENT_LABEL[value]}</Tag>
  )

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
    title: 'RSVP',
    dataIndex: 'rsvp_status',
    filters: [
      { text: 'Vinculado', value: 'linked' },
      { text: 'Sem vínculo', value: 'none' },
    ],
    onFilter: (value, row) =>
      value === 'linked' ? row.rsvp_id !== null : row.rsvp_id === null,
    render: (status: string | null, row) => {
      if (!row.rsvp_id) return EMPTY

      const tag = (
        <Tag color={status === 'confirmed' ? 'success' : 'error'}>
          {RSVP_STATUS_LABEL[status ?? ''] ?? status}
        </Tag>
      )

      // O nome do RSVP só interessa quando difere — é o sinal de que a
      // confirmação veio no nome de outra pessoa da família.
      return row.rsvp_full_name && row.rsvp_full_name !== row.full_name ? (
        <Tooltip
          title={`${row.rsvp_full_name}${
            row.rsvp_role ? ` · ${RSVP_ROLE_LABEL[row.rsvp_role]}` : ''
          }`}
        >
          {tag}
        </Tooltip>
      ) : (
        tag
      )
    },
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
  {
    header: 'RSVP',
    value: (row) => (row.rsvp_status ? RSVP_STATUS_LABEL[row.rsvp_status] ?? row.rsvp_status : ''),
  },
  { header: 'RSVP no nome de', value: (row) => row.rsvp_full_name ?? '' },
]

export function GuestsTable({ rows, summary, rsvps, loading }: GuestsTableProps) {
  const [search, setSearch] = useState('')
  // `editing` guarda o convidado aberto; `null` com o drawer aberto = criação.
  const [editing, setEditing] = useState<AdminGuestRow | null>(null)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [matchOpen, setMatchOpen] = useState(false)

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

  const openGuest = (guest: AdminGuestRow | null) => {
    setEditing(guest)
    setDrawerOpen(true)
  }

  // O badge chama atenção para as confirmações que ninguém reivindicou ainda.
  const pendingLinks = summary?.rsvps_without_guest ?? 0

  const cards = [
    { title: 'Convidados', value: summary?.total ?? 0 },
    { title: 'Convites (grupos)', value: summary?.total_groups ?? 0 },
    { title: 'Convites enviados', value: summary?.invites_sent ?? 0 },
    { title: 'Convites pendentes', value: summary?.invites_pending ?? 0 },
    { title: 'Vinculados ao RSVP', value: summary?.linked_to_rsvp ?? 0 },
    { title: 'RSVPs fora da lista', value: summary?.rsvps_without_guest ?? 0 },
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
          <Badge count={pendingLinks} size="small">
            <Button onClick={() => setMatchOpen(true)}>Conciliar RSVP</Button>
          </Badge>
          <Button type="primary" onClick={() => openGuest(null)}>
            Adicionar convidado
          </Button>
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
        onRow={(row) => ({
          onClick: () => openGuest(row),
          style: { cursor: 'pointer' },
        })}
      />

      <GuestDrawer
        open={drawerOpen}
        guest={editing}
        rows={rows}
        rsvps={rsvps}
        onClose={() => setDrawerOpen(false)}
      />

      <RsvpMatchDrawer open={matchOpen} onClose={() => setMatchOpen(false)} />
    </S.Wrapper>
  )
}
