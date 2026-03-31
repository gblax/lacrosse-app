import { useQuery } from '@tanstack/react-query'
import { fetchRankings } from '../services/api'

export function useRankings() {
  const query = useQuery({
    queryKey: ['rankings'],
    queryFn: fetchRankings,
    staleTime: 5 * 60_000,
  })

  return {
    rankings: query.data
      ? {
          teams: query.data.teams,
          title: query.data.title,
          updatedAt: query.data.updated,
        }
      : null,
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
  }
}
