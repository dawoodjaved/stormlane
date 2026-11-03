import { lazy, Suspense } from 'react'

import { Panel } from './components/Panel.tsx'
import { Legend } from './features/map/Legend.tsx'
import { TimeSlider } from './features/map/TimeSlider.tsx'
import { useForecastPlayback } from './features/map/usePlayback.ts'
import { PlanResult } from './features/plan/PlanResult.tsx'
import { TripForm } from './features/plan/TripForm.tsx'
import { useHeatmap } from './features/plan/useHeatmap.ts'
import { usePlan } from './features/plan/usePlan.ts'

const MapView = lazy(() => import('./features/map/MapView.tsx'))

export default function App() {
  const plan = usePlan()
  const heatmap = useHeatmap(plan.data?.plan_id)
  useForecastPlayback(heatmap.data?.hours ?? 49)

  return (
    <div className="relative h-full md:flex">
      <a
        href="#planner"
        className="bg-accent text-surface sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-50 focus:rounded-md focus:px-3 focus:py-2"
      >
        Skip to planner
      </a>
      <Panel title="Trip planner">
        <TripForm
          pending={plan.isPending}
          onSubmit={(request) => {
            plan.mutate(request)
          }}
        />
        <PlanResult
          plan={plan.data}
          pending={plan.isPending}
          error={plan.error}
          heatmap={heatmap}
        />
      </Panel>
      <main className="absolute inset-0 md:relative md:flex-1">
        <Suspense fallback={<div className="bg-surface h-full w-full" aria-hidden="true" />}>
          <MapView plan={plan.data} heatmap={heatmap.data} pending={plan.isPending} />
        </Suspense>
        {plan.data && (
          <div className="pointer-events-none absolute inset-0 z-[1] hidden md:block">
            <div className="pointer-events-auto absolute top-3 left-3">
              <Legend />
            </div>
            <div className="pointer-events-auto absolute right-3 bottom-3 left-3 max-w-xl">
              <TimeSlider
                start={heatmap.data?.start ?? plan.data.departure}
                hours={heatmap.data?.hours ?? 49}
              />
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
