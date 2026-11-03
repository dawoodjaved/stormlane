import { lazy, Suspense } from 'react'

import { Panel } from './components/Panel.tsx'
import { PlanResult } from './features/plan/PlanResult.tsx'
import { TripForm } from './features/plan/TripForm.tsx'
import { usePlan } from './features/plan/usePlan.ts'

const MapView = lazy(() => import('./features/map/MapView.tsx'))

export default function App() {
  const plan = usePlan()

  return (
    <div className="relative h-full md:flex">
      <Panel title="Trip planner">
        <TripForm
          pending={plan.isPending}
          onSubmit={(request) => {
            plan.mutate(request)
          }}
        />
        <PlanResult plan={plan.data} pending={plan.isPending} error={plan.error} />
      </Panel>
      <main className="absolute inset-0 md:static md:flex-1">
        <Suspense fallback={<div className="bg-surface h-full w-full" aria-hidden="true" />}>
          <MapView />
        </Suspense>
      </main>
    </div>
  )
}
