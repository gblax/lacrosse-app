import type { NcaaScoreboardResponse, NcaaRankingsResponse } from '../types/ncaa'
import type { EspnScoreboardResponse } from '../types/espn'
import type { Game, Team, PeriodScore, RankedTeam } from '../types'

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

// --- Rankings ---

// Try NCAA polls first, then fall back to ESPN rankings
const RANKING_POLLS = [
  'inside-lacrosse',
  'usila-coaches',
  'ncaa-mens-lacrosse-rpi',
]

// Unified rankings response type that both NCAA and ESPN parsers produce
export interface RankingsApiResult {
  source: 'ncaa' | 'espn'
  title: string
  updated: string
  teams: RankedTeam[]
}

async function tryNcaaRankings(): Promise<RankingsApiResult | null> {
  for (const poll of RANKING_POLLS) {
    try {
      const url = `${NCAA_API_BASE}/rankings/lacrosse-men/d1/${poll}`
      const res = await fetch(url)
      if (!res.ok) continue
      const data: NcaaRankingsResponse = await res.json()
      console.log(`[Rankings] NCAA "${poll}":`, data.data?.length ?? 0, 'rows')
      if (data.data?.length) {
        console.log('[Rankings] First row keys:', Object.keys(data.data[0]))
        console.log('[Rankings] First row:', data.data[0])
        const teams = transformNcaaRankingRows(data.data)
        if (teams.length) {
          return {
            source: 'ncaa',
            title: data.title || `Rankings (${poll})`,
            updated: data.updated || '',
            teams,
          }
        }
      }
    } catch (e) {
      console.warn(`[Rankings] NCAA "${poll}" failed:`, e)
    }
  }
  return null
}

async function tryEspnRankings(): Promise<RankingsApiResult | null> {
  try {
    const res = await fetch(`${ESPN_API_BASE}/rankings`)
    if (!res.ok) {
      console.log('[Rankings] ESPN returned', res.status)
      return null
    }
    const data = await res.json()
    console.log('[Rankings] ESPN response keys:', Object.keys(data))
    return transformEspnRankings(data)
  } catch (e) {
    console.warn('[Rankings] ESPN failed:', e)
    return null
  }
}

export async function fetchRankings(): Promise<RankingsApiResult> {
  // Try NCAA first
  const ncaa = await tryNcaaRankings()
  if (ncaa) return ncaa

  // Fall back to ESPN
  const espn = await tryEspnRankings()
  if (espn) return espn

  throw new Error('No rankings data available from any source')
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

    // Derive display time from startDate ISO string when startTime is missing/TBA
    const startDate = new Date(game.startDate)
    let displayTime = game.startTime
    if (!displayTime || /tba/i.test(displayTime)) {
      if (!isNaN(startDate.getTime()) && startDate.getHours() + startDate.getMinutes() > 0) {
        displayTime = startDate.toLocaleTimeString('en-US', {
          hour: 'numeric',
          minute: '2-digit',
          timeZoneName: 'short',
        })
      } else {
        displayTime = 'TBA'
      }
    }

    return {
      id: game.gameID,
      state: game.gameState,
      startTime: displayTime,
      startDate,
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

function transformNcaaRankingRows(rows: Record<string, string>[]): RankedTeam[] {
  return rows.map((row, index) => {
    const rankStr = getField(row, 'RK', 'Rank', '#', 'Rk')
    const rank = parseInt(rankStr, 10) || (index + 1)
    const name = getField(row, 'SCHOOL', 'School', 'Team', 'TEAM', 'NAME', 'Name')
    const conference = getField(row, 'CONFERENCE', 'Conference', 'Conf', 'CONF')
    const record = getField(row, 'OVERALL', 'Overall', 'Record', 'RECORD', 'W-L', 'W/L')
    const prevStr = getField(row, 'PREV', 'Prev', 'Previous', 'PREVIOUS', 'PRIOR', 'Prior')
    const previousRank = parseInt(prevStr, 10) || 0
    const change = previousRank > 0 && rank > 0 ? previousRank - rank : 0

    return { rank, name, conference, record, previousRank, change }
  }).filter((t) => t.name)
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function transformEspnRankings(data: any): RankingsApiResult | null {
  // ESPN rankings response: { rankings: [{ name, ranks: [{ current, team, recordSummary, ... }] }] }
  const rankingsArr = data?.rankings
  if (!Array.isArray(rankingsArr) || !rankingsArr.length) return null

  // Use the first available ranking
  const ranking = rankingsArr[0]
  const ranks = ranking?.ranks
  if (!Array.isArray(ranks) || !ranks.length) return null

  console.log('[Rankings] ESPN first rank entry:', ranks[0])

  const teams: RankedTeam[] = ranks.map((entry: any, index: number) => {
    const rank = entry.current ?? (index + 1)
    const name = entry.team?.displayName ?? entry.team?.name ?? entry.team?.shortDisplayName ?? ''
    const conference = entry.team?.groups?.name ?? ''
    const record = entry.recordSummary ?? ''
    const previousRank = entry.previous ?? 0
    const change = previousRank > 0 && rank > 0 ? previousRank - rank : 0

    return { rank, name, conference, record, previousRank, change }
  }).filter((t: RankedTeam) => t.name)

  if (!teams.length) return null

  return {
    source: 'espn',
    title: ranking.name ?? ranking.headline ?? 'Rankings',
    updated: ranking.date ?? '',
    teams,
  }
}
