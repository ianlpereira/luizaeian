import { useMemo, useState } from 'react'
import { Button, Table, Tag } from 'antd'
import type { ColumnsType } from 'antd/es/table'

import { useAdminRsvpMatches } from '@/hooks/useAdminReports'
import type { AdminRsvpMatchEntry, AdminRsvpRow } from '@/types/admin'
import { formatDateTime } from '@/utils/format'
import type { CsvColumn } from '@/utils/toCsv'
import { ExportCsvButton } from '../ExportCsvButton'
import { RsvpMatchDrawer } from '../RsvpMatchDrawer'
import * as S from './styles'

interface RsvpTableProps {
  rows: AdminRsvpRow[]
  loading: boolean
}

/** `rsvp_id` -> quantas das pessoas citadas nesse RSVP já têm convidado vinculado. */
function countLinks(items: AdminRsvpMatchEntry[]): Record<string, { linked: number; total: number }> {
  const counts: Record<string, { linked: number; total: number }> = {}
  for (const entry of items) {
    const bucket = (counts[entry.rsvp_id] ??= { linked: 0, total: 0 })
    bucket.total += 1
    if (entry.state === 'linked') bucket.linked += 1
  }
  return counts
}

function buildColumns(
  links: Record<string, { linked: number; total: number }>,
  onLink: (rsvpId: string) => void,
): ColumnsType<AdminRsvpRow> {
  return [
  {
    title: 'Nome',
    dataIndex: 'full_name',
    sorter: (a, b) => a.full_name.localeCompare(b.full_name, 'pt-BR'),
  },
  { title: 'E-mail', dataIndex: 'email' },
  {
    title: 'Status',
    dataIndex: 'status',
    filters: [
      { text: 'Confirmado', value: 'confirmed' },
      { text: 'Recusado', value: 'declined' },
    ],
    onFilter: (value, row) => row.status === value,
    render: (status: AdminRsvpRow['status']) =>
      status === 'confirmed' ? (
        <Tag color="success">Confirmado</Tag>
      ) : (
        <Tag color="error">Recusado</Tag>
      ),
  },
  {
    title: 'Acompanhantes',
    dataIndex: 'companions_count',
    sorter: (a, b) => a.companions_count - b.companions_count,
  },
  {
    title: 'Total',
    dataIndex: 'headcount',
    sorter: (a, b) => a.headcount - b.headcount,
  },
  {
    title: 'Data',
    dataIndex: 'created_at',
    defaultSortOrder: 'descend',
    sorter: (a, b) => a.created_at.localeCompare(b.created_at),
    render: (value: string) => formatDateTime(value),
  },
  {
    title: 'Vínculo',
    key: 'link',
    filters: [
      { text: 'Completo', value: 'complete' },
      { text: 'Pendente', value: 'pending' },
    ],
    onFilter: (value, row) => {
      const bucket = links[row.id]
      const complete = bucket !== undefined && bucket.linked === bucket.total
      return value === 'complete' ? complete : !complete
    },
    render: (_: unknown, row: AdminRsvpRow) => {
      const bucket = links[row.id] ?? { linked: 0, total: row.headcount }
      const complete = bucket.linked === bucket.total
      return (
        <S.LinkCell>
          <Tag color={complete ? 'success' : 'warning'}>
            {bucket.linked}/{bucket.total} vinculado(s)
          </Tag>
          <Button size="small" onClick={() => onLink(row.id)}>
            Vincular
          </Button>
        </S.LinkCell>
      )
    },
  },
]
}

const csvColumns: CsvColumn<AdminRsvpRow>[] = [
  { header: 'Nome', value: (row) => row.full_name },
  { header: 'E-mail', value: (row) => row.email },
  { header: 'Status', value: (row) => (row.status === 'confirmed' ? 'Confirmado' : 'Recusado') },
  { header: 'Acompanhantes', value: (row) => row.companions.map((c) => c.name).join(', ') },
  { header: 'Total de pessoas', value: (row) => row.headcount },
  { header: 'Data', value: (row) => formatDateTime(row.created_at) },
]

export function RsvpTable({ rows, loading }: RsvpTableProps) {
  const matches = useAdminRsvpMatches()
  const [linkingRsvpId, setLinkingRsvpId] = useState<string | null>(null)

  const links = useMemo(() => countLinks(matches.data?.items ?? []), [matches.data])
  const columns = useMemo(() => buildColumns(links, setLinkingRsvpId), [links])

  return (
    <S.Wrapper>
      <S.Toolbar>
        <S.Heading>Confirmações de presença</S.Heading>
        <ExportCsvButton filePrefix="rsvps" columns={csvColumns} rows={rows} />
      </S.Toolbar>

      <Table<AdminRsvpRow>
        rowKey="id"
        columns={columns}
        dataSource={rows}
        loading={loading}
        scroll={{ x: 'max-content' }}
        pagination={{ pageSize: 20, showSizeChanger: true }}
        expandable={{
          // Só quem trouxe acompanhante abre — evita linha de expansão vazia.
          rowExpandable: (row) => row.companions.length > 0,
          expandedRowRender: (row) => (
            <S.CompanionList>
              {row.companions.map((companion, index) => (
                <li key={`${row.id}-${index}`}>{companion.name}</li>
              ))}
            </S.CompanionList>
          ),
        }}
      />

      <RsvpMatchDrawer
        open={linkingRsvpId !== null}
        rsvpId={linkingRsvpId ?? undefined}
        onClose={() => setLinkingRsvpId(null)}
      />
    </S.Wrapper>
  )
}
