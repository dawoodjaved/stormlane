import type { Plan, RiskLevel } from '../../lib/api.ts'
import { formatDuration, formatMiles } from '../../lib/format.ts'

const LEVEL_DOT: Record<RiskLevel, string> = {
  0: 'bg-risk-low',
  1: 'bg-risk-moderate',
  2: 'bg-risk-high',
  3: 'bg-risk-severe',
  4: 'bg-risk-no-travel',
}

interface Props {
  plan: Plan | undefined
  pending: boolean
  error: Error | null
}

export function PlanResult({ plan, pending, error }: Props) {
  if (pending) {
    return (
      <div className="space-y-3" aria-busy="true" aria-live="polite">
        <p className="text-sm text-slate-400">Checking routes and forecasts…</p>
        <div className="h-20 animate-pulse rounded-lg bg-white/5" />
        <div className="h-14 animate-pulse rounded-lg bg-white/5" />
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

  if (!plan) return null

  const { recommendation } = plan
  return (
    <section aria-label="Results" className="space-y-3">
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
          const route = plan.routes.find((r) => r.id === id)
          if (!route) return null
          const { summary } = route
          return (
            <li key={id} className="border-border rounded-lg border p-3">
              <div className="flex items-center justify-between gap-2">
                <span className="flex items-center gap-2 font-medium">
                  <span
                    className={`size-2.5 rounded-full ${LEVEL_DOT[summary.max_level]}`}
                    aria-hidden="true"
                  />
                  {route.name}
                  {id === recommendation.route_id && (
                    <span className="bg-accent/15 text-accent rounded px-1.5 py-0.5 text-xs">
                      Best
                    </span>
                  )}
                </span>
                <span className="text-sm text-slate-400">
                  {formatMiles(route.distance_m)} · {formatDuration(route.duration_s)}
                </span>
              </div>
              <p className="mt-1.5 text-xs text-slate-400">
                Severe {summary.severe_miles.toFixed(1)} mi · High {summary.high_miles.toFixed(1)}{' '}
                mi
                {summary.no_travel_miles > 0 &&
                  ` · No Travel ${summary.no_travel_miles.toFixed(1)} mi`}
              </p>
            </li>
          )
        })}
      </ul>
    </section>
  )
}
