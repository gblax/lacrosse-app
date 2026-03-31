import type { NcaaScoreboardResponse, NcaaRankingsResponse } from '../types/ncaa'
import type { EspnScoreboardResponse } from '../types/espn'
import type { Game, Team, PeriodScore, Rankings, RankedTeam } from '../types'

const NCAA_API_BASE = 'https://ncaa-api.henrygd.me'
const ESPN_API_BASE = 'https://site.api.espn.com/apis/site/v2/sports/lacrosse/mens-college-lacrosse'

// --- NCAA API ---

export async function fetchNcaaScoreboard(date: Date): Promise<NcaaScoreboardResponse> {
  const yyyy = date.getFullYear()
  const mm = String(date.getMonth() + 1).padStart(2, '0')
  const dd = String(date.getDate()).padStart(2, '0')
  const url = `${NCAA_API_BASE}/scoreboard/lacrosse-men/d1/${yyyy}/${mm}/${dd}/all-conf`
  const res = await fetch(url)
  if (!res.ok) throw new Error(`NCAA API error: ${res.status}`)
  return res.json()
}

export async function fetchNcaaRankings(): Promise<NcaaRankingsResponse> {
  const url = `${NCAA_API_BASE}/rankings/lacrosse-men/d1/inside-lacrosse`
  const res = await fetch(url)
  if (!res.ok) throw new Error(`NCAA Rankings API error: ${res.status}`)
  return res.json()
}

// --- ESPN API ---

export async function fetchEspnScoreboard(date?: Date): Promise<EspnScoreboardResponse> {
  const params = new URLSearchParams()
  if (date) {
    const dateStr = `${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, '0')}${String(date.getDate()).padStart(2, '0')}`
    params.set('dates', dateStr)
  }
  const url = `${ESPN_API_BASE}/scoreboard?${params.toString()}`
  const res = await fetch(url)
  if (!res.ok) throw new Error(`ESPN API error: ${res.status}`)
  return res.json()
}

// --- Data Transformers ---

function parseRank(rank: string | undefined): number | null {
  if (!rank || rank === '' || rank === '0') return null
  const n = parseInt(rank, 10)
  return isNaN(n) ? null : n
}

function parseScore(score: string | undefined): number | null {
  if (!score || score === '') return null
  const n = parseInt(score, 10)
  return isNaN(n) ? null : n
}

function extractRecord(description: string): string {
  if (!description) return ''
  const match = description.match(/\(([^)]+)\)/)
  return match ? match[1] : ''
}

function buildTeam(
  ncaaTeam: NcaaScoreboardResponse['games'][0]['game']['home'],
  isHome: boolean,
  espnLogo?: string | null,
  espnColor?: string | null,
): Team {
  return {
    name: ncaaTeam.names.full,
    shortName: ncaaTeam.names.short,
    abbreviation: ncaaTeam.names.char6,
    score: parseScore(ncaaTeam.score),
    rank: parseRank(ncaaTeam.rank),
    record: extractRecord(ncaaTeam.description),
    conference: ncaaTeam.conferences?.[0]?.conferenceName ?? '',
    logo: espnLogo ?? null,
    color: espnColor ? `#${espnColor}` : null,
    isWinner: ncaaTeam.winner,
    isHome,
  }
}

// Build a lookup from ESPN data for logos/colors by team abbreviation
function buildEspnLookup(espnData: EspnScoreboardResponse | null): Map<string, { logo?: string; color?: string }> {
  const lookup = new Map<string, { logo?: string; color?: string }>()
  if (!espnData?.events) return lookup
  for (const event of espnData.events) {
    for (const comp of event.competitions) {
      for (const competitor of comp.competitors) {
        lookup.set(competitor.team.abbreviation.toUpperCase(), {
          logo: competitor.team.logo,
          color: competitor.team.color,
        })
      }
    }
  }
  return lookup
}

export function transformGames(
  ncaaData: NcaaScoreboardResponse | null,
  espnData: EspnScoreboardResponse | null,
): Game[] {
  if (!ncaaData?.games?.length) return []

  const espnLookup = buildEspnLookup(espnData)

  return ncaaData.games.map(({ game }) => {
    const homeEspn = espnLookup.get(game.home.names.char6.toUpperCase())
    const awayEspn = espnLookup.get(game.away.names.char6.toUpperCase())

    const periods: PeriodScore[] = (game.periods ?? []).map((p) => ({
      period: parseInt(p.periodNumber, 10),
      home: parseInt(p.home, 10) || 0,
      away: parseInt(p.away, 10) || 0,
    }))

    return {
      id: game.gameID,
      state: game.gameState,
      startTime: game.startTime,
      startDate: new Date(game.startDate),
      currentPeriod: game.currentPeriod,
      clock: game.contestClock,
      finalMessage: game.finalMessage || 'Final',
      network: game.network,
      home: buildTeam(game.home, true, homeEspn?.logo, homeEspn?.color),
      away: buildTeam(game.away, false, awayEspn?.logo, awayEspn?.color),
      periods,
    }
  })
}

// Helper to find a value from a row by trying multiple possible column names (case-insensitive)
function getField(row: Record<string, string>, ...candidates: string[]): string {
  for (const key of candidates) {
    // Try exact match first
    if (row[key] !== undefined) return row[key]
    // Case-insensitive match
    const found = Object.keys(row).find((k) => k.toLowerCase() === key.toLowerCase())
    if (found) return row[found]
  }
  return ''
}

export function transformRankings(data: NcaaRankingsResponse | null): Rankings | null {
  if (!data?.data?.length) return null

  const teams: RankedTeam[] = data.data.map((row) => {
    const rankStr = getField(row, 'RK', 'Rank', '#')
    const rank = parseInt(rankStr, 10) || 0
    const name = getField(row, 'SCHOOL', 'School', 'Team', 'TEAM', 'NAME')
    const conference = getField(row, 'CONFERENCE', 'Conference', 'Conf', 'CONF')
    const record = getField(row, 'OVERALL', 'Overall', 'Record', 'RECORD', 'W-L')
    const prevStr = getField(row, 'PREV', 'Prev', 'Previous', 'PREVIOUS', 'PRIOR')
    const previousRank = parseInt(prevStr, 10) || 0
    const change = previousRank > 0 && rank > 0 ? previousRank - rank : 0

    return { rank, name, conference, record, previousRank, change }
  }).filter((t) => t.rank > 0)

  return {
    teams,
    title: data.title || 'Inside Lacrosse Rankings',
    updatedAt: data.updated || '',
  }
}
