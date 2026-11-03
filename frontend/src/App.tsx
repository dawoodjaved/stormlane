import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'

import { Landing } from './pages/Landing.tsx'
import Planner from './pages/Planner.tsx'
import { ShareRedirect } from './pages/ShareRedirect.tsx'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route
          path="/"
          element={
            <ShareRedirect>
              <Landing />
            </ShareRedirect>
          }
        />
        <Route path="/app" element={<Planner />} />
        <Route path="/desk" element={<Navigate to="/app" replace />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
