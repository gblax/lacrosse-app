import { useRankings } from '../hooks/useRankings'
import LoadingSpinner from '../components/LoadingSpinner'
import ErrorMessage from '../components/ErrorMessage'

function RankChange({ change }: { change: number }) {
  if (change === 0) return <span className="text-xs text-slate-600">—</span>
  if (change > 0) {
    return (
      <span className="text-xs font-medium text-up flex items-center gap-0.5">
        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M14.707 12.707a1 1 0 01-1.414 0L10 9.414l-3.293 3.293a1 1 0 01-1.414-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 010 1.414z" clipRule="evenodd" />
        </svg>
        {change}
      </span>
    )
  }
  return (
    <span className="text-xs font-medium text-down flex items-center gap-0.5">
      <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
        <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
      </svg>
      {Math.abs(change)}
    </span>
  )
}

export default function RankingsPage() {
  const { rankings, isLoading, isError } = useRankings()

  if (isLoading) return <LoadingSpinner message="Loading rankings..." />
  if (isError) {
    return (
      <ErrorMessage
        title="Couldn't load rankings"
        message="The Inside Lacrosse rankings are unavailable right now."
      />
    )
  }
  if (!rankings) return null

  return (
    <div className="px-4 py-4 max-w-2xl mx-auto">
      <div className="mb-4">
        <h2 className="text-lg font-bold text-white">{rankings.title}</h2>
        <p className="text-xs text-slate-500 mt-0.5">Updated {rankings.updatedAt}</p>
      </div>

      <div className="bg-slate-900 rounded-xl border border-slate-800 overflow-hidden">
        {/* Header */}
        <div className="grid grid-cols-[2.5rem_1fr_4rem_3.5rem] sm:grid-cols-[2.5rem_1fr_5rem_5rem_3.5rem] gap-2 px-4 py-2 border-b border-slate-800 text-xs font-medium text-slate-500">
          <span>#</span>
          <span>Team</span>
          <span className="hidden sm:block">Conf</span>
          <span className="text-right">Record</span>
          <span className="text-center">Chg</span>
        </div>

        {/* Rows */}
        {rankings.teams.map((team) => (
          <div
            key={team.rank}
            className="grid grid-cols-[2.5rem_1fr_4rem_3.5rem] sm:grid-cols-[2.5rem_1fr_5rem_5rem_3.5rem] gap-2 px-4 py-3 border-b border-slate-800/50 last:border-b-0 hover:bg-slate-800/30 transition-colors items-center"
          >
            <span className="text-sm font-bold text-white tabular-nums">{team.rank}</span>
            <span className="text-sm font-medium text-white truncate">{team.name}</span>
            <span className="text-xs text-slate-400 hidden sm:block">{team.conference}</span>
            <span className="text-xs text-slate-300 text-right tabular-nums">{team.record}</span>
            <div className="flex justify-center">
              <RankChange change={team.change} />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
