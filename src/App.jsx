import { BrowserRouter, Route, Routes } from 'react-router-dom'
import { TeamsProvider } from './context/TeamsContext'
import TeamListPage from './pages/TeamListPage'
import TeamDetailPage from './pages/TeamDetailPage'

export default function App() {
  return (
    <BrowserRouter>
      <TeamsProvider>
        <Routes>
          <Route path="/" element={<TeamListPage />} />
          <Route path="/team/:id" element={<TeamDetailPage />} />
        </Routes>
      </TeamsProvider>
    </BrowserRouter>
  )
}
