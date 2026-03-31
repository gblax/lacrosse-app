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
  startTimeEpoch: string
  gameState: 'pre' | 'live' | 'final'
  currentPeriod: string
  contestClock: string
  finalMessage: string
  home: NcaaTeam
  away: NcaaTeam
  network: string
  url: string
  periods?: NcaaPeriod[]
}

export interface NcaaScoreboardResponse {
  games: Array<{ game: NcaaGame }>
}

// Rankings response is parsed HTML table rows — each row is a Record<string, string>
// with keys matching the table column headers (e.g., "RK", "SCHOOL", "CONFERENCE", "OVERALL", "PTS", "PREV")
export interface NcaaRankingsResponse {
  title: string
  updated: string
  data: Array<Record<string, string>>
}
