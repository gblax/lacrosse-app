export interface EspnTeam {
  id: string
  displayName: string
  abbreviation: string
  color?: string
  alternateColor?: string
  logo?: string
}

export interface EspnCompetitor {
  homeAway: 'home' | 'away'
  team: EspnTeam
  score: string
  curatedRank?: { current: number }
}

export interface EspnStatusType {
  id: string
  name: string
  state: 'pre' | 'in' | 'post'
  completed: boolean
}

export interface EspnStatus {
  clock: number
  displayClock: string
  period: number
  type: EspnStatusType
}

export interface EspnCompetition {
  id: string
  competitors: EspnCompetitor[]
  status: EspnStatus
}

export interface EspnEvent {
  id: string
  date: string
  name: string
  shortName: string
  competitions: EspnCompetition[]
}

export interface EspnScoreboardResponse {
  events: EspnEvent[]
}
