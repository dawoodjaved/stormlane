import { useMemo } from 'react'

import type { Heatmap, Plan } from '../../lib/api.ts'
import { betterDeparture } from '../../lib/insight.ts'
import { useMapStore } from '../map/store.ts'

export function DelayHint({ plan, heatmap }: { plan: Plan; heatmap?: Heatmap }) {
  const hint = useMemo(() => betterDeparture(plan, heatmap), [plan, heatmap])
  if (!hint) return null

  return (
    <div className="border-accent/30 bg-accent/5 rounded-lg border p-3">
      <p className="text-accent text-xs font-medium tracking-wide uppercase">Leave later</p>
      <p className="text-ink mt-1 text-sm">{hint.summary}</p>
      <button
        type="button"
        className="text-accent focus-visible:outline-accent mt-2 rounded-sm text-xs font-medium hover:text-sky-300 focus-visible:outline-2"
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
