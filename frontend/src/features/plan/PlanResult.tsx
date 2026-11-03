import { useEffect } from 'react'

import type { Heatmap, Plan } from '../../lib/api.ts'
import { worstCheckpoint } from '../../lib/insight.ts'
import { TimeSlider } from '../map/TimeSlider.tsx'
import { useMapStore } from '../map/store.ts'
import { CheckpointList } from './CheckpointList.tsx'
import { CopyLinkButton } from './CopyLinkButton.tsx'
import { DelayHint } from './DelayHint.tsx'
import { RouteSummaryCard } from './RouteSummaryCard.tsx'

interface HeatmapStatus {
  data?: Heatmap
  isPending: boolean
  isError: boolean
}

interface Props {
  plan: Plan | undefined
  pending: boolean
  error: Error | null
  heatmap: HeatmapStatus
  onNewTrip: () => void
}

export function PlanResult({ plan, pending, error, heatmap, onNewTrip }: Props) {
  if (pending) {
    return (
      <div className="space-y-3" aria-busy="true" aria-live="polite">
        <p className="text-muted text-sm">Checking routes and forecasts…</p>
        <div className="bg-hover h-20 animate-pulse rounded-lg motion-reduce:animate-none" />
        <div className="bg-hover h-16 animate-pulse rounded-lg motion-reduce:animate-none" />
        <div className="bg-hover h-16 animate-pulse rounded-lg motion-reduce:animate-none" />
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
      <p className="text-subtle text-sm">
        Pick an origin, destination, and departure to compare weather along the truck routes.
      </p>
    )
  }

  return <Results plan={plan} heatmap={heatmap} onNewTrip={onNewTrip} />
}

function Results({
  plan,
  heatmap,
  onNewTrip,
}: {
  plan: Plan
  heatmap: HeatmapStatus
  onNewTrip: () => void
}) {
  const selectedRouteId = useMapStore((state) => state.selectedRouteId)
  const focused = useMapStore((state) => state.focused)
  const selectRoute = useMapStore((state) => state.selectRoute)
  const focusCheckpoint = useMapStore((state) => state.focusCheckpoint)

  useEffect(() => {
    document.getElementById('results')?.scrollIntoView({ block: 'nearest' })
  }, [plan.plan_id])

  const { recommendation } = plan
  const selectedId = selectedRouteId ?? recommendation.route_id
  const selected = plan.routes.find((route) => route.id === selectedId) ?? plan.routes[0]
  const forecastHours = heatmap.data?.hours ?? 49
  const forecastStart = heatmap.data?.start ?? plan.departure

  return (
    <section id="results" aria-label="Results" className="space-y-4">
      <div
        className={`rounded-lg border p-3 ${
          recommendation.no_safe_route ? 'border-risk-no-travel/60' : 'border-accent/40'
        }`}
      >
        <div className="flex items-start justify-between gap-3">
          <p className="text-muted text-xs font-medium tracking-wide uppercase">
            {recommendation.no_safe_route ? 'No safe route' : 'Recommended'}
          </p>
          <span className="flex shrink-0 items-center gap-3">
            <CopyLinkButton planId={plan.plan_id} />
            <button
              type="button"
              onClick={onNewTrip}
              className="focus-visible:outline-accent text-muted hover:text-ink text-xs focus-visible:outline-2"
            >
              New trip
            </button>
          </span>
        </div>
        <p className="text-ink mt-1 text-sm">{recommendation.reason}</p>
      </div>

      <DelayHint plan={plan} heatmap={heatmap.data} />

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
        <p className="text-subtle text-xs" aria-live="polite">
          Loading corridor forecast…
        </p>
      )}
      {heatmap.isError && (
        <p role="alert" className="text-risk-high text-xs">
          Corridor forecast could not be loaded. Routes are still usable.
        </p>
      )}

      <div className="md:hidden">
        <TimeSlider start={forecastStart} hours={forecastHours} />
      </div>

      {selected && (
        <CheckpointList
          route={selected}
          focusedIndex={focused?.routeId === selected.id ? focused.index : null}
          onFocus={(index) => {
            focusCheckpoint({ routeId: selected.id, index })
          }}
          action={worstAction(selected, (index) => {
            focusCheckpoint({ routeId: selected.id, index })
          })}
        />
      )}
    </section>
  )
}

function worstAction(route: Plan['routes'][number], onJump: (index: number) => void) {
  const worst = worstCheckpoint(route)
  if (!worst) return null
  return (
    <button
      type="button"
      className="text-accent focus-visible:outline-accent rounded-sm text-xs font-medium hover:text-sky-300 focus-visible:outline-2"
      onClick={() => {
        onJump(worst.index)
      }}
    >
      Worst stretch
    </button>
  )
}
