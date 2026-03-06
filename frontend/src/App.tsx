import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'

import { MainLayout } from '@/components/Layout/MainLayout'
import { HomePage } from '@/pages/Home'
import { NotFoundPage } from '@/pages/NotFound'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<MainLayout />}>
          <Route index element={<HomePage />} />
        </Route>
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
