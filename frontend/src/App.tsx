import { BrowserRouter, Routes, Route } from 'react-router-dom'

import { Layout } from '@/components/Layout'
import { HomePage } from '@/pages/Home'
import { NotFoundPage } from '@/pages/NotFound'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<HomePage />} />
          <Route path="*" element={<NotFoundPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}

export default App
