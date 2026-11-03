import type { PlannedRoute, RiskLevel } from '../../lib/api.ts'
import { formatClock, formatDuration, formatMiles } from '../../lib/format.ts'
import { RISK_DOT } from '../../lib/risk.ts'

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
        aria-current={selected ? 'true' : undefined}
        onClick={onSelect}
        className={`focus-visible:outline-accent w-full rounded-lg border p-3 text-left transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 ${
          selected ? 'border-accent bg-accent/10' : 'border-border hover:bg-hover'
        }`}
      >
        <div className="flex items-center justify-between gap-2">
          <span className="flex min-w-0 items-center gap-2 font-medium">
            <span
              className={`size-2.5 shrink-0 rounded-full ${RISK_DOT[summary.max_level]}`}
              aria-hidden="true"
            />
            <span className="truncate">{route.name}</span>
            {recommended && (
              <span className="bg-accent/15 text-accent shrink-0 rounded px-1.5 py-0.5 text-xs">
                Best
              </span>
            )}
            {selected && <span className="sr-only">Selected</span>}
          </span>
          <span className="text-muted shrink-0 text-sm">
            {formatMiles(route.distance_m)} · {formatDuration(route.duration_s)}
          </span>
        </div>
        <p className="text-muted mt-1.5 text-xs">
          Severe {summary.severe_miles.toFixed(1)} mi · High {summary.high_miles.toFixed(1)} mi
          {summary.no_travel_miles > 0 && ` · No Travel ${summary.no_travel_miles.toFixed(1)} mi`}
        </p>
        <p className="text-subtle mt-1 text-xs">
          Avg risk {summary.avg_risk.toFixed(2)} · ETA {formatClock(route.arrival)}
        </p>
        <RiskStrip checkpoints={route.checkpoints} />
      </button>
    </li>
  )
}

function RiskStrip({ checkpoints }: { checkpoints: PlannedRoute['checkpoints'] }) {
  if (checkpoints.length < 2) return null
  const step = Math.max(1, Math.ceil(checkpoints.length / 20))
  const bars: RiskLevel[] = []
  for (let i = 0; i < checkpoints.length; i += step) {
    const point = checkpoints[i]
    if (point) bars.push(point.level)
  }
  return (
    <span className="mt-2 flex h-1.5 gap-px" aria-hidden="true">
      {bars.map((level, i) => (
        <span key={i} className={`min-w-0 flex-1 rounded-full ${RISK_DOT[level]}`} />
      ))}
    </span>
  )
}
