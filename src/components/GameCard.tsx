import type { Game, Team } from '../types'

function TeamLogo({ team }: { team: Team }) {
  if (team.logo) {
    return (
      <img
        src={team.logo}
        alt={team.shortName}
        className="w-8 h-8 object-contain"
        loading="lazy"
      />
    )
  }
  // Fallback: colored circle with abbreviation
  return (
    <div
      className="w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-bold text-white"
      style={{ backgroundColor: team.color ?? '#475569' }}
    >
      {team.abbreviation.slice(0, 2)}
    </div>
  )
}

function TeamRank({ rank }: { rank: number | null }) {
  if (!rank) return null
  return <span className="text-xs text-slate-500 font-medium w-5 text-right">#{rank}</span>
}

function GameStatus({ game }: { game: Game }) {
  if (game.state === 'live') {
    return (
      <div className="flex items-center gap-1.5">
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-live opacity-75" />
          <span className="relative inline-flex rounded-full h-2 w-2 bg-live" />
        </span>
        <span className="text-xs font-semibold text-live">
          {game.currentPeriod} {game.clock}
        </span>
      </div>
    )
  }
  if (game.state === 'final') {
    return <span className="text-xs font-medium text-final">{game.finalMessage}</span>
  }
  // Scheduled
  return (
    <div className="flex flex-col items-center">
      <span className="text-xs text-slate-400">{game.startTime}</span>
      {game.network && (
        <span className="text-[10px] text-slate-500">{game.network}</span>
      )}
    </div>
  )
}

function TeamRow({ team, game, side }: { team: Team; game: Game; side: 'home' | 'away' }) {
  const isWinner = game.state === 'final' && team.isWinner
  return (
    <div className={`flex items-center gap-2 py-1.5 ${isWinner ? 'text-white' : 'text-slate-300'}`}>
      <TeamRank rank={team.rank} />
      <TeamLogo team={team} />
      <span className={`flex-1 text-sm truncate ${isWinner ? 'font-semibold' : 'font-normal'}`}>
        {team.shortName}
      </span>
      {team.record && (
        <span className="text-xs text-slate-500 hidden sm:inline">{team.record}</span>
      )}
      {game.state !== 'pre' ? (
        <span className={`text-lg font-bold tabular-nums w-8 text-right ${isWinner ? 'text-white' : 'text-slate-400'}`}>
          {team.score ?? '-'}
        </span>
      ) : (
        <span className="w-8" />
      )}
    </div>
  )
}

function PeriodScores({ game }: { game: Game }) {
  if (!game.periods.length || game.state === 'pre') return null

  return (
    <div className="mt-2 pt-2 border-t border-slate-800">
      <div className="flex gap-0 text-xs text-slate-500">
        <span className="w-14" />
        {game.periods.map((p) => (
          <span key={p.period} className="w-8 text-center font-medium">
            {p.period <= 4 ? `Q${p.period}` : `OT${p.period - 4 > 1 ? p.period - 4 : ''}`}
          </span>
        ))}
        <span className="w-8 text-center font-medium">T</span>
      </div>
      {(['away', 'home'] as const).map((side) => {
        const team = game[side]
        return (
          <div key={side} className="flex items-center text-xs">
            <span className="w-14 truncate text-slate-400">{team.abbreviation}</span>
            {game.periods.map((p) => (
              <span key={p.period} className="w-8 text-center tabular-nums text-slate-300">
                {p[side === 'home' ? 'home' : 'away']}
              </span>
            ))}
            <span className="w-8 text-center tabular-nums font-semibold text-white">
              {team.score ?? '-'}
            </span>
          </div>
        )
      })}
    </div>
  )
}

interface GameCardProps {
  game: Game
}

export default function GameCard({ game }: GameCardProps) {
  const borderColor = game.state === 'live'
    ? 'border-live/30'
    : 'border-slate-800'

  return (
    <div className={`bg-slate-900 rounded-xl border ${borderColor} p-4 transition-colors hover:border-slate-700`}>
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs text-slate-500">
          {game.home.conference || game.away.conference}
        </span>
        <GameStatus game={game} />
      </div>

      <TeamRow team={game.away} game={game} side="away" />
      <TeamRow team={game.home} game={game} side="home" />

      <PeriodScores game={game} />
    </div>
  )
}
