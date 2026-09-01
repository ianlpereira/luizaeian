import { Alert, Table, Tag } from 'antd'
import type { ColumnsType } from 'antd/es/table'

import type { AdminGiftRow } from '@/types/admin'
import { formatBRL } from '@/utils/format'
import type { CsvColumn } from '@/utils/toCsv'
import { ExportCsvButton } from '../ExportCsvButton'
import * as S from './styles'

interface GiftsTableProps {
  rows: AdminGiftRow[]
  loading: boolean
}

function buildColumns(rows: AdminGiftRow[]): ColumnsType<AdminGiftRow> {
  const categories = Array.from(new Set(rows.map((row) => row.category))).sort()

  return [
    {
      title: 'Presente',
      dataIndex: 'title',
      sorter: (a, b) => a.title.localeCompare(b.title, 'pt-BR'),
    },
    {
      title: 'Categoria',
      dataIndex: 'category',
      filters: categories.map((category) => ({ text: category, value: category })),
      onFilter: (value, row) => row.category === value,
    },
    {
      title: 'Preço',
      dataIndex: 'price',
      sorter: (a, b) => a.price - b.price,
      render: (value: number) => formatBRL(value),
    },
    {
      title: 'Visível',
      dataIndex: 'hidden',
      filters: [
        { text: 'Visível', value: false },
        { text: 'Oculto', value: true },
      ],
      onFilter: (value, row) => row.hidden === value,
      render: (hidden: boolean) =>
        hidden ? <Tag>Oculto</Tag> : <Tag color="success">Visível</Tag>,
    },
    {
      title: 'Registros de presente',
      dataIndex: 'purchase_records',
      sorter: (a, b) => a.purchase_records - b.purchase_records,
    },
    {
      title: 'Pagamentos aprovados',
      dataIndex: 'approved_payments',
      sorter: (a, b) => a.approved_payments - b.approved_payments,
    },
    {
      title: 'Valor aprovado',
      dataIndex: 'approved_amount',
      defaultSortOrder: 'descend',
      sorter: (a, b) => a.approved_amount - b.approved_amount,
      render: (value: number) => formatBRL(value),
    },
  ]
}

const csvColumns: CsvColumn<AdminGiftRow>[] = [
  { header: 'Presente', value: (row) => row.title },
  { header: 'Categoria', value: (row) => row.category },
  { header: 'Preço', value: (row) => row.price.toFixed(2).replace('.', ',') },
  { header: 'Visível', value: (row) => (row.hidden ? 'Oculto' : 'Visível') },
  { header: 'Registros de presente', value: (row) => row.purchase_records },
  { header: 'Pagamentos aprovados', value: (row) => row.approved_payments },
  {
    header: 'Valor aprovado',
    value: (row) => row.approved_amount.toFixed(2).replace('.', ','),
  },
]

export function GiftsTable({ rows, loading }: GiftsTableProps) {
  return (
    <S.Wrapper>
      <S.Toolbar>
        <S.Heading>Presentes</S.Heading>
        <ExportCsvButton filePrefix="presentes" columns={csvColumns} rows={rows} />
      </S.Toolbar>

      <Alert
        type="info"
        showIcon
        message="Registros de presente e pagamentos aprovados se sobrepõem"
        description={
          'Uma linha de “registro de presente” pode ter vindo do botão de presentear ' +
          'ou da aprovação de um pagamento. Some as duas colunas e o número infla. ' +
          'O dinheiro que entrou é sempre a coluna “Valor aprovado”.'
        }
      />

      <Table<AdminGiftRow>
        rowKey="id"
        columns={buildColumns(rows)}
        dataSource={rows}
        loading={loading}
        scroll={{ x: 'max-content' }}
        pagination={{ pageSize: 20, showSizeChanger: true }}
      />
    </S.Wrapper>
  )
}
