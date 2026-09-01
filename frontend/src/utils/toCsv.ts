/**
 * Exportação CSV a partir das linhas já carregadas em memória.
 *
 * Separador `;` e BOM UTF-8 na frente: é o que o Excel em pt-BR espera para
 * abrir o arquivo em colunas e mostrar os acentos corretamente.
 */

export interface CsvColumn<T> {
  header: string
  value: (row: T) => string | number | null | undefined
}

const SEPARATOR = ';'
const BOM = '﻿'

function escapeCell(value: string | number | null | undefined): string {
  if (value === null || value === undefined) return ''

  const text = String(value)
  if (text.includes(SEPARATOR) || text.includes('"') || text.includes('\n')) {
    return `"${text.replace(/"/g, '""')}"`
  }
  return text
}

export function toCsv<T>(columns: CsvColumn<T>[], rows: T[]): string {
  const header = columns.map((column) => escapeCell(column.header)).join(SEPARATOR)
  const body = rows.map((row) =>
    columns.map((column) => escapeCell(column.value(row))).join(SEPARATOR),
  )

  return BOM + [header, ...body].join('\r\n')
}

/** Dispara o download no navegador e libera a URL temporária. */
export function downloadCsv(filename: string, content: string): void {
  const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)

  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)

  URL.revokeObjectURL(url)
}

/** Sufixo de data no nome do arquivo: `rsvps-2026-09-01.csv` */
export const csvFilename = (prefix: string) =>
  `${prefix}-${new Date().toISOString().slice(0, 10)}.csv`
