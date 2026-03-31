import { Routes, Route } from 'react-router-dom'
import Header from './components/Header'
import ScoreboardPage from './pages/ScoreboardPage'
import RankingsPage from './pages/RankingsPage'

export default function App() {
  return (
    <div className="min-h-dvh flex flex-col">
      <Header />
      <main className="flex-1 max-w-3xl w-full mx-auto">
        <Routes>
          <Route path="/" element={<ScoreboardPage />} />
          <Route path="/rankings" element={<RankingsPage />} />
        </Routes>
      </main>
      <footer className="border-t border-slate-800 py-4 text-center">
        <p className="text-xs text-slate-600">
          NCAA D1 Men's Lacrosse &middot; Data from NCAA &amp; ESPN
        </p>
      </footer>
    </div>
  )
}
