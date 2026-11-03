import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useRef } from 'react'

import { createPlan, fetchPlan, type PlanRequest } from '../../lib/api.ts'
import { planIdFromSearch, replacePlanQuery } from '../../lib/share.ts'
import { useMapStore } from '../map/store.ts'

export function usePlan() {
  const queryClient = useQueryClient()
  const inFlight = useRef<AbortController | null>(null)

  return useMutation({
    mutationKey: ['plan'],
    mutationFn: (request: PlanRequest) => {
      inFlight.current?.abort()
      const controller = new AbortController()
      inFlight.current = controller
      return createPlan(request, controller.signal)
    },
    onSuccess: (plan) => {
      queryClient.setQueryData(['plan', plan.plan_id], plan)
      replacePlanQuery(plan.plan_id)
      useMapStore.getState().reset(plan.recommendation.route_id)
    },
  })
}

export function useSharedPlan() {
  const id = planIdFromSearch()
  return useQuery({
    queryKey: ['plan', id],
    queryFn: ({ signal }) => fetchPlan(id ?? '', signal),
    enabled: Boolean(id),
    staleTime: 5 * 60_000,
    retry: 1,
  })
}
