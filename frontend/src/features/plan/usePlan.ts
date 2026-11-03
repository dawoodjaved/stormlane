import { useMutation } from '@tanstack/react-query'
import { useRef } from 'react'

import { createPlan, type PlanRequest } from '../../lib/api.ts'
import { useMapStore } from '../map/store.ts'

export function usePlan() {
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
      useMapStore.getState().reset(plan.recommendation.route_id)
    },
  })
}
