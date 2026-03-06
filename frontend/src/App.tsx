import { BrowserRouter, Routes, Route } from 'react-router-dom'

import { HomePage } from '@/pages/Home'
import { NotFoundPage } from '@/pages/NotFound'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
