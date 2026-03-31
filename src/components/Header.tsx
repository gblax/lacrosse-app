import { NavLink } from 'react-router-dom'

export default function Header() {
  return (
    <header className="sticky top-0 z-50 bg-slate-950/95 backdrop-blur-sm border-b border-slate-800">
      <div className="max-w-3xl mx-auto px-4 py-3 flex items-center justify-between">
        <NavLink to="/" className="flex items-center gap-2">
          <span className="text-xl font-bold tracking-tight text-white">
            D1 Lacrosse
          </span>
        </NavLink>
        <nav className="flex gap-1">
          <NavLink
            to="/"
            end
            className={({ isActive }) =>
              `px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-brand-600 text-white'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`
            }
          >
            Scores
          </NavLink>
          <NavLink
            to="/rankings"
            className={({ isActive }) =>
              `px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-brand-600 text-white'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`
            }
          >
            Rankings
          </NavLink>
        </nav>
      </div>
    </header>
  )
}
