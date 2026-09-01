import { useEffect } from 'react'

import { useAdminAuthStore } from '@/store/adminAuth'
import { AdminThemeProvider } from './AdminThemeProvider'
import { AdminDashboard } from './components/AdminDashboard'
import { AdminLogin } from './components/AdminLogin'

/**
 * Página /admin — relatórios de confirmações, presentes e pagamentos.
 *
 * Fica fora do <Layout /> do site (sem header nem footer do casamento) e é
 * carregada por React.lazy, então o Ant Design só chega ao navegador de quem
 * abre esta rota.
 */
export function AdminPage() {
  const isAuthenticated = useAdminAuthStore((state) => state.isAuthenticated)

  useEffect(() => {
    const previousTitle = document.title
    document.title = 'Painel — Luiza & Ian'

    // A área administrativa não deve aparecer em busca nenhuma.
    const meta = document.createElement('meta')
    meta.name = 'robots'
    meta.content = 'noindex, nofollow'
    document.head.appendChild(meta)

    return () => {
      document.title = previousTitle
      document.head.removeChild(meta)
    }
  }, [])

  return (
    <AdminThemeProvider>
      {isAuthenticated ? <AdminDashboard /> : <AdminLogin />}
    </AdminThemeProvider>
  )
}
