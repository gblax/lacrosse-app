import type { NcaaScoreboardResponse, NcaaRankingsResponse } from '../types/ncaa'
import type { EspnScoreboardResponse } from '../types/espn'
import type { Game, Team, PeriodScore, Rankings, RankedTeam } from '../types'

// Proxy through our own server to avoid CORS issues.
// Vite dev server proxy and Vercel rewrites both handle /api/* paths.
const NCAA_API_BASE = '/api/ncaa'
const ESPN_API_BASE = '/api/espn'

// NCAA team logos via the ncaa-api logo endpoint
function ncaaLogoUrl(seo: string): string {
  return `${NCAA_API_BASE}/logo/${seo}.svg`
}

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

// Try multiple ranking polls in order — Inside Lacrosse is sometimes empty on ncaa.com
const RANKING_POLLS = [
  'inside-lacrosse',
  'usila-coaches',
  'ncaa-mens-lacrosse-rpi',
]

export async function fetchNcaaRankings(): Promise<NcaaRankingsResponse> {
  for (const poll of RANKING_POLLS) {
    const url = `${NCAA_API_BASE}/rankings/lacrosse-men/d1/${poll}`
    const res = await fetch(url)
    if (!res.ok) continue
    const data = await res.json()
    console.log(`[Rankings] Tried "${poll}":`, data.data?.length ?? 0, 'rows')
    if (data.data?.length) {
      console.log('[Rankings] First row keys:', Object.keys(data.data[0]))
      console.log('[Rankings] First row:', data.data[0])
      return data
    }
  }
  throw new Error('No rankings data available from any poll')
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
  // Use NCAA API logo as primary (reliable), ESPN as fallback for color
  const logo = ncaaTeam.names.seo
    ? ncaaLogoUrl(ncaaTeam.names.seo)
    : espnLogo ?? null

  return {
    name: ncaaTeam.names.full,
    shortName: ncaaTeam.names.short,
    abbreviation: ncaaTeam.names.char6,
    score: parseScore(ncaaTeam.score),
    rank: parseRank(ncaaTeam.rank),
    record: extractRecord(ncaaTeam.description),
    conference: ncaaTeam.conferences?.[0]?.conferenceName ?? '',
    logo,
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

// Helper to find a value from a row by trying multiple possible column names
function getField(row: Record<string, string>, ...candidates: string[]): string {
  for (const key of candidates) {
    if (row[key] !== undefined) return row[key]
  }
  // Case-insensitive fallback
  const rowKeysLower = Object.keys(row).map((k) => [k, k.toLowerCase()] as const)
  for (const key of candidates) {
    const match = rowKeysLower.find(([, lower]) => lower === key.toLowerCase())
    if (match) return row[match[0]]
  }
  // Partial match fallback (e.g., key "Overall Record" matches candidate "overall")
  for (const key of candidates) {
    const match = rowKeysLower.find(([, lower]) => lower.includes(key.toLowerCase()))
    if (match) return row[match[0]]
  }
  return ''
}

export function transformRankings(data: NcaaRankingsResponse | null): Rankings | null {
  if (!data) return null

  // The API might return data in different shapes — handle both array and object forms
  const rows = data.data
  if (!rows?.length) {
    console.warn('[Rankings] No data rows found. Response:', data)
    return null
  }

  // Log first row keys in production too, for debugging
  console.log('[Rankings] Row keys:', Object.keys(rows[0]), 'First row:', rows[0])

  const teams: RankedTeam[] = rows.map((row, index) => {
    const rankStr = getField(row, 'RK', 'Rank', '#', 'Rk')
    // If no rank field found, use array position
    const rank = parseInt(rankStr, 10) || (index + 1)
    const name = getField(row, 'SCHOOL', 'School', 'Team', 'TEAM', 'NAME', 'Name')
    const conference = getField(row, 'CONFERENCE', 'Conference', 'Conf', 'CONF')
    const record = getField(row, 'OVERALL', 'Overall', 'Record', 'RECORD', 'W-L', 'W/L')
    const prevStr = getField(row, 'PREV', 'Prev', 'Previous', 'PREVIOUS', 'PRIOR', 'Prior')
    const previousRank = parseInt(prevStr, 10) || 0
    const change = previousRank > 0 && rank > 0 ? previousRank - rank : 0

    return { rank, name, conference, record, previousRank, change }
  }).filter((t) => t.name) // Filter out rows with no team name

  if (!teams.length) {
    console.warn('[Rankings] No teams could be parsed from rows')
    return null
  }

  return {
    teams,
    title: data.title || 'Inside Lacrosse Rankings',
    updatedAt: data.updated || '',
  }
}
