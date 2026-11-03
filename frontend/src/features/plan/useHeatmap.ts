import { useQuery } from '@tanstack/react-query'

import { fetchHeatmap } from '../../lib/api.ts'

export function useHeatmap(planId: string | undefined) {
  return useQuery({
    queryKey: ['heatmap', planId],
    queryFn: ({ signal }) => fetchHeatmap(planId ?? '', signal),
    enabled: Boolean(planId),
    staleTime: 30 * 60_000,
    retry: 1,
  })
}
