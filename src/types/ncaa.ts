export interface NcaaTeamNames {
  char6: string
  short: string
  seo: string
  full: string
}

export interface NcaaConference {
  conferenceName: string
  conferenceSeo: string
}

export interface NcaaTeam {
  names: NcaaTeamNames
  score: string
  description: string
  rank: string
  winner: boolean
  conferences: NcaaConference[]
}

export interface NcaaPeriod {
  periodNumber: string
  home: string
  away: string
}

export interface NcaaGame {
  gameID: string
  startDate: string
  startTime: string
  startTimeEpoch: number
  gameState: 'pre' | 'live' | 'final'
  currentPeriod: string
  contestClock: string
  finalMessage: string
  home: NcaaTeam
  away: NcaaTeam
  network: string
  url: string
  periodsEnabled: boolean
  periods: NcaaPeriod[]
}

export interface NcaaScoreboardResponse {
  games: Array<{ game: NcaaGame }>
}

export interface NcaaRankedTeam {
  rank: number
  school: {
    name: string
    conference: string
  }
  record: string
  previousRank: number
  change: number
}

export interface NcaaRankingsResponse {
  rankings: NcaaRankedTeam[]
  title: string
  updatedAt: string
}
