import type { ReactNode } from 'react'
import { App as AntdApp, ConfigProvider } from 'antd'
import ptBR from 'antd/locale/pt_BR'

import { adminTheme } from './theme'

interface AdminThemeProviderProps {
  children: ReactNode
}

/**
 * Escopo do Ant Design.
 *
 * O reset global do AntD não é importado de propósito: ele reestilizaria o site
 * dos convidados. O AntD 5 é CSS-in-JS e renderiza bem sem ele.
 *
 * `locale={ptBR}` deixa paginação, ordenação e estado vazio das tabelas em
 * português.
 */
export function AdminThemeProvider({ children }: AdminThemeProviderProps) {
  return (
    <ConfigProvider theme={adminTheme} locale={ptBR}>
      <AntdApp>{children}</AntdApp>
    </ConfigProvider>
  )
}
