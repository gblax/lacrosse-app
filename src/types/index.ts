export type GameState = 'pre' | 'live' | 'final'

export interface Team {
  name: string
  shortName: string
  abbreviation: string
  score: number | null
  rank: number | null
  record: string
  conference: string
  logo: string | null
  color: string | null
  isWinner: boolean
  isHome: boolean
}

export interface PeriodScore {
  period: number
  home: number
  away: number
}

export interface Game {
  id: string
  state: GameState
  startTime: string
  startDate: Date
  currentPeriod: string
  clock: string
  finalMessage: string
  network: string
  home: Team
  away: Team
  periods: PeriodScore[]
}

export interface RankedTeam {
  rank: number
  name: string
  conference: string
  record: string
  previousRank: number
  change: number
}

export interface Rankings {
  teams: RankedTeam[]
  title: string
  updatedAt: string
}
