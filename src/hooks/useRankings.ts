import { useQuery } from '@tanstack/react-query'
import { fetchNcaaRankings, transformRankings } from '../services/api'

export function useRankings() {
  const query = useQuery({
    queryKey: ['rankings'],
    queryFn: fetchNcaaRankings,
    staleTime: 5 * 60_000,
  })

  const rankings = transformRankings(query.data ?? null)

  return {
    rankings,
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
  }
}
