import type { UseQueryResult } from '@tanstack/react-query'

import type { Heatmap, Plan } from '../../lib/api.ts'
import { Legend } from '../map/Legend.tsx'
import { TimeSlider } from '../map/TimeSlider.tsx'
import { useMapStore } from '../map/store.ts'
import { CheckpointList } from './CheckpointList.tsx'
import { RouteSummaryCard } from './RouteSummaryCard.tsx'

interface Props {
  plan: Plan | undefined
  pending: boolean
  error: Error | null
  heatmap: UseQueryResult<Heatmap>
}

export function PlanResult({ plan, pending, error, heatmap }: Props) {
  const selectedRouteId = useMapStore((state) => state.selectedRouteId)
  const focused = useMapStore((state) => state.focused)
  const selectRoute = useMapStore((state) => state.selectRoute)
  const focusCheckpoint = useMapStore((state) => state.focusCheckpoint)

  if (pending) {
    return (
      <div className="space-y-3" aria-busy="true" aria-live="polite">
        <p className="text-sm text-slate-400">Checking routes and forecasts…</p>
        <div className="h-20 animate-pulse rounded-lg bg-white/5 motion-reduce:animate-none" />
        <div className="h-16 animate-pulse rounded-lg bg-white/5 motion-reduce:animate-none" />
        <div className="h-16 animate-pulse rounded-lg bg-white/5 motion-reduce:animate-none" />
      </div>
    )
  }

  if (error && error.name !== 'AbortError') {
    return (
      <p
        role="alert"
        className="border-risk-severe/40 text-risk-severe rounded-lg border p-3 text-sm"
      >
        {error.message}
      </p>
    )
  }

  if (!plan) {
    return (
      <p className="text-sm text-slate-500">
        Pick an origin, destination, and departure to compare weather along the truck routes.
      </p>
    )
  }

  const { recommendation } = plan
  const selectedId = selectedRouteId ?? recommendation.route_id
  const selected = plan.routes.find((route) => route.id === selectedId) ?? plan.routes[0]
  const forecastHours = heatmap.data?.hours ?? 49
  const forecastStart = heatmap.data?.start ?? plan.departure

  return (
    <section aria-label="Results" className="space-y-4">
      <div
        className={`rounded-lg border p-3 ${
          recommendation.no_safe_route ? 'border-risk-no-travel/60' : 'border-accent/40'
        }`}
      >
        <p className="text-xs font-medium tracking-wide text-slate-400 uppercase">
          {recommendation.no_safe_route ? 'No safe route' : 'Recommended'}
        </p>
        <p className="mt-1 text-sm text-slate-200">{recommendation.reason}</p>
      </div>

      <ul className="space-y-2">
        {recommendation.order.map((id) => {
          const route = plan.routes.find((item) => item.id === id)
          if (!route) return null
          return (
            <RouteSummaryCard
              key={id}
              route={route}
              recommended={id === recommendation.route_id}
              selected={id === selectedId}
              onSelect={() => {
                selectRoute(id)
              }}
            />
          )
        })}
      </ul>

      {heatmap.isPending && (
        <p className="text-xs text-slate-500" aria-live="polite">
          Loading corridor forecast…
        </p>
      )}
      {heatmap.isError && (
        <p role="alert" className="text-risk-high text-xs">
          Corridor forecast could not be loaded. Routes are still usable.
        </p>
      )}

      <div className="space-y-3 md:hidden">
        <Legend />
        <TimeSlider start={forecastStart} hours={forecastHours} />
      </div>

      {selected && (
        <CheckpointList
          route={selected}
          focusedIndex={focused?.routeId === selected.id ? focused.index : null}
          onFocus={(index) => {
            focusCheckpoint({ routeId: selected.id, index })
          }}
        />
      )}
    </section>
  )
}
