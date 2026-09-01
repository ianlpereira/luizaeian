import { Suspense, lazy } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'

import { Layout } from '@/components/Layout'
import { HomePage } from '@/pages/Home'
import { NotFoundPage } from '@/pages/NotFound'

// /admin fica fora do <Layout /> do casamento e em chunk próprio: o Ant Design
// só é baixado por quem abre o painel.
const AdminPage = lazy(() =>
  import('@/pages/Admin').then((m) => ({ default: m.AdminPage })),
)

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route
          path="/admin"
          element={
            <Suspense fallback={null}>
              <AdminPage />
            </Suspense>
          }
        />
        <Route element={<Layout />}>
          <Route path="/" element={<HomePage />} />
          <Route path="*" element={<NotFoundPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}

export default App
