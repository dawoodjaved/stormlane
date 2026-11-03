import type { PlannedRoute, RiskLevel } from '../../lib/api.ts'
import { formatClock, formatDuration, formatMiles } from '../../lib/format.ts'

const LEVEL_DOT: Record<RiskLevel, string> = {
  0: 'bg-risk-low',
  1: 'bg-risk-moderate',
  2: 'bg-risk-high',
  3: 'bg-risk-severe',
  4: 'bg-risk-no-travel',
}

interface Props {
  route: PlannedRoute
  recommended: boolean
  selected: boolean
  onSelect: () => void
}

export function RouteSummaryCard({ route, recommended, selected, onSelect }: Props) {
  const { summary } = route

  return (
    <li>
      <button
        type="button"
        aria-pressed={selected}
        onClick={onSelect}
        className={`w-full rounded-lg border p-3 text-left transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-400 ${
          selected ? 'border-accent bg-accent/10' : 'border-border hover:bg-white/5'
        }`}
      >
        <div className="flex items-center justify-between gap-2">
          <span className="flex items-center gap-2 font-medium">
            <span
              className={`size-2.5 rounded-full ${LEVEL_DOT[summary.max_level]}`}
              aria-hidden="true"
            />
            {route.name}
            {recommended && (
              <span className="bg-accent/15 text-accent rounded px-1.5 py-0.5 text-xs">Best</span>
            )}
          </span>
          <span className="text-sm text-slate-400">
            {formatMiles(route.distance_m)} · {formatDuration(route.duration_s)}
          </span>
        </div>
        <p className="mt-1.5 text-xs text-slate-400">
          Severe {summary.severe_miles.toFixed(1)} mi · High {summary.high_miles.toFixed(1)} mi
          {summary.no_travel_miles > 0 && ` · No Travel ${summary.no_travel_miles.toFixed(1)} mi`}
        </p>
        <p className="mt-1 text-xs text-slate-500">
          Avg risk {summary.avg_risk.toFixed(2)} · ETA {formatClock(route.arrival)}
        </p>
      </button>
    </li>
  )
}
