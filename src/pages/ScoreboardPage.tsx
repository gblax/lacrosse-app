import { useState, useMemo } from 'react'
import { format, isToday } from 'date-fns'
import { useScoreboard } from '../hooks/useScoreboard'
import DatePicker from '../components/DatePicker'
import ConferenceFilter from '../components/ConferenceFilter'
import GameCard from '../components/GameCard'
import LoadingSpinner from '../components/LoadingSpinner'
import ErrorMessage from '../components/ErrorMessage'

export default function ScoreboardPage() {
  const [date, setDate] = useState(new Date())
  const [selectedConference, setSelectedConference] = useState<string | null>(null)
  const { games, conferences, isLoading, isError } = useScoreboard(date)

  const filteredGames = useMemo(() => {
    if (!selectedConference) return games
    return games.filter(
      (g) => g.home.conference === selectedConference || g.away.conference === selectedConference
    )
  }, [games, selectedConference])

  // Group: live first, then scheduled, then final
  const sortedGames = useMemo(() => {
    const stateOrder = { live: 0, pre: 1, final: 2 }
    return [...filteredGames].sort((a, b) => {
      const orderDiff = stateOrder[a.state] - stateOrder[b.state]
      if (orderDiff !== 0) return orderDiff
      return a.startDate.getTime() - b.startDate.getTime()
    })
  }, [filteredGames])

  const dateLabel = isToday(date) ? 'Today' : format(date, 'EEEE, MMMM d')
  const liveCount = games.filter((g) => g.state === 'live').length

  return (
    <div>
      <DatePicker date={date} onChange={(d) => { setDate(d); setSelectedConference(null) }} />

      <div className="px-4 pb-2 flex items-center justify-between">
        <h2 className="text-lg font-bold text-white">{dateLabel}</h2>
        {liveCount > 0 && (
          <span className="text-xs font-medium text-live flex items-center gap-1">
            <span className="relative flex h-1.5 w-1.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-live opacity-75" />
              <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-live" />
            </span>
            {liveCount} live
          </span>
        )}
      </div>

      <ConferenceFilter
        conferences={conferences}
        selected={selectedConference}
        onChange={setSelectedConference}
      />

      {isLoading && <LoadingSpinner message="Loading scores..." />}

      {isError && (
        <ErrorMessage
          title="Couldn't load scores"
          message="The NCAA scoreboard is unavailable right now."
        />
      )}

      {!isLoading && !isError && sortedGames.length === 0 && (
        <div className="text-center py-16">
          <p className="text-slate-500 text-sm">No games scheduled for this date.</p>
        </div>
      )}

      {!isLoading && sortedGames.length > 0 && (
        <div className="grid gap-3 px-4 pb-6 sm:grid-cols-2">
          {sortedGames.map((game) => (
            <GameCard key={game.id} game={game} />
          ))}
        </div>
      )}
    </div>
  )
}
