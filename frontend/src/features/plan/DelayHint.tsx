import { useMemo } from 'react'

import { IconGate } from '../../components/Icons.tsx'
import type { Heatmap, Plan } from '../../lib/api.ts'
import { betterDeparture } from '../../lib/insight.ts'
import { useMapStore } from '../map/store.ts'

export function DelayHint({ plan, heatmap }: { plan: Plan; heatmap?: Heatmap }) {
  const hint = useMemo(() => betterDeparture(plan, heatmap), [plan, heatmap])
  if (!hint) return null

  return (
    <div className="border-accent/40 bg-accent/8 rounded-sm border p-3">
      <p className="text-accent brand flex items-center gap-1.5 text-xs">
        <IconGate className="size-3.5" />
        Hold the gate
      </p>
      <p className="text-ink mt-1 text-sm">{hint.summary}</p>
      <button
        type="button"
        className="text-accent focus-visible:outline-accent mt-2 rounded-sm text-xs font-medium hover:opacity-80 focus-visible:outline-2"
        onClick={() => {
          const map = useMapStore.getState()
          map.setPlaying(false)
          map.setHour(hint.delay)
          map.selectRoute(hint.routeId)
        }}
      >
        See {hint.clock} on the map
      </button>
    </div>
  )
}
