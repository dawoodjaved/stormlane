import { useQueryClient } from '@tanstack/react-query'
import { lazy, Suspense, useEffect } from 'react'

import { Panel } from './components/Panel.tsx'
import { Legend } from './features/map/Legend.tsx'
import { TimeSlider } from './features/map/TimeSlider.tsx'
import { useMapStore } from './features/map/store.ts'
import { useForecastPlayback } from './features/map/usePlayback.ts'
import { PlanResult } from './features/plan/PlanResult.tsx'
import { TripForm } from './features/plan/TripForm.tsx'
import { useHeatmap } from './features/plan/useHeatmap.ts'
import { usePlan, useSharedPlan } from './features/plan/usePlan.ts'
import { useTripStore } from './features/plan/store.ts'
import { worstCheckpoint } from './lib/insight.ts'
import { RISK_LABEL } from './lib/risk.ts'
import { replacePlanQuery } from './lib/share.ts'

const MapView = lazy(() => import('./features/map/MapView.tsx'))

const chip =
  'border-border bg-surface-raised/90 focus-visible:outline-accent hover:bg-hover text-ink rounded-lg border px-2.5 py-1.5 text-xs shadow-lg backdrop-blur focus-visible:outline-2'

export default function App() {
  const created = usePlan()
  const shared = useSharedPlan()
  const plan = created.data ?? shared.data
  const pending = created.isPending || shared.isLoading
  const error = created.error ?? (!plan ? (shared.error ?? null) : null)
  const heatmap = useHeatmap(plan?.plan_id)
  const queryClient = useQueryClient()
  const requestFit = useMapStore((state) => state.requestFit)
  const selectedRouteId = useMapStore((state) => state.selectedRouteId)
  const focusCheckpoint = useMapStore((state) => state.focusCheckpoint)
  useForecastPlayback(heatmap.data?.hours ?? 49)

  const selected =
    plan?.routes.find((route) => route.id === (selectedRouteId ?? plan.recommendation.route_id)) ??
    plan?.routes[0]
  const worst = selected ? worstCheckpoint(selected) : null

  useEffect(() => {
    if (shared.data && !created.data) useTripStore.getState().hydrate(shared.data)
  }, [shared.data, created.data])

  function newTrip() {
    created.reset()
    queryClient.removeQueries({ queryKey: ['heatmap'] })
    queryClient.removeQueries({ queryKey: ['plan'] })
    replacePlanQuery(null)
    useMapStore.getState().reset('')
    useTripStore.getState().reset()
    document.getElementById('planner-body')?.scrollTo({ top: 0 })
  }

  return (
    <div className="relative h-full md:flex">
      <a
        href="#planner"
        className="bg-accent text-surface sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-50 focus:rounded-md focus:px-3 focus:py-2"
      >
        Skip to planner
      </a>
      <a
        href="#map"
        className="bg-accent text-surface sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-36 focus:z-50 focus:rounded-md focus:px-3 focus:py-2"
      >
        Skip to map
      </a>
      <p className="sr-only" aria-live="polite" aria-atomic="true">
        {pending
          ? 'Checking routes and forecasts'
          : selected
            ? `${selected.name} selected, ${RISK_LABEL[selected.summary.max_level]} peak risk`
            : ''}
      </p>
      <Panel title="Trip planner">
        <TripForm
          pending={pending}
          onSubmit={(request) => {
            created.mutate(request)
          }}
        />
        <PlanResult
          plan={plan}
          pending={pending}
          error={error}
          heatmap={heatmap}
          onNewTrip={newTrip}
        />
      </Panel>
      <main className="absolute inset-0 md:relative md:min-w-0 md:flex-1">
        <Suspense fallback={<div className="bg-surface h-full w-full" aria-hidden="true" />}>
          <MapView plan={plan} heatmap={heatmap.data} pending={pending} />
        </Suspense>
        <div className="pointer-events-none absolute inset-0 z-[1]">
          {plan && (
            <>
              <div className="pointer-events-auto absolute top-3 left-3 max-w-[min(16rem,calc(100%-5.5rem))]">
                <Legend />
                <div className="mt-2 flex flex-wrap gap-2">
                  <button type="button" onClick={requestFit} className={chip}>
                    Fit routes
                  </button>
                  {worst && selected && (
                    <button
                      type="button"
                      className={chip}
                      onClick={() => {
                        focusCheckpoint({ routeId: selected.id, index: worst.index })
                      }}
                    >
                      Worst stretch
                    </button>
                  )}
                </div>
              </div>
              <div className="pointer-events-auto absolute inset-x-3 bottom-[calc(7.5rem+env(safe-area-inset-bottom,0px))] md:inset-x-auto md:right-16 md:bottom-3 md:left-3 md:w-[min(36rem,calc(100%-5.5rem))]">
                <TimeSlider
                  start={heatmap.data?.start ?? plan.departure}
                  hours={heatmap.data?.hours ?? 49}
                />
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  )
}
