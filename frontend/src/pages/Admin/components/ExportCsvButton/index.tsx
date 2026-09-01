import { Button } from 'antd'

import { csvFilename, downloadCsv, toCsv, type CsvColumn } from '@/utils/toCsv'

interface ExportCsvButtonProps<T> {
  /** Prefixo do arquivo: vira `presentes-2026-09-01.csv` */
  filePrefix: string
  columns: CsvColumn<T>[]
  rows: T[]
}

/** Exporta as linhas já carregadas — sem endpoint novo no backend. */
export function ExportCsvButton<T>({ filePrefix, columns, rows }: ExportCsvButtonProps<T>) {
  const handleClick = () => downloadCsv(csvFilename(filePrefix), toCsv(columns, rows))

  return (
    <Button onClick={handleClick} disabled={rows.length === 0}>
      Exportar CSV
    </Button>
  )
}
