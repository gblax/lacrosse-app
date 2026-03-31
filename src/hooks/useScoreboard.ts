import { useQuery } from '@tanstack/react-query'
import { fetchNcaaScoreboard, fetchEspnScoreboard, transformGames } from '../services/api'
import type { Game } from '../types'

export function useScoreboard(date: Date) {
  const dateKey = `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`

  const ncaaQuery = useQuery({
    queryKey: ['ncaa-scoreboard', dateKey],
    queryFn: () => fetchNcaaScoreboard(date),
    refetchInterval: 60_000,
  })

  const espnQuery = useQuery({
    queryKey: ['espn-scoreboard', dateKey],
    queryFn: () => fetchEspnScoreboard(date),
    refetchInterval: 60_000,
  })

  const games: Game[] = transformGames(ncaaQuery.data ?? null, espnQuery.data ?? null)

  const conferences = [...new Set(
    games.flatMap((g) => [g.home.conference, g.away.conference]).filter(Boolean)
  )].sort()

  return {
    games,
    conferences,
    isLoading: ncaaQuery.isLoading,
    isError: ncaaQuery.isError,
    error: ncaaQuery.error,
    hasEspnData: !espnQuery.isError && !!espnQuery.data,
  }
}
