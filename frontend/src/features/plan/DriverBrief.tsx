import type { Plan, PlannedRoute } from '../../lib/api.ts'
import { buildDriverBrief, briefRiskWord } from '../../lib/brief.ts'
import { formatClock } from '../../lib/format.ts'

interface Props {
  plan: Plan
  route: PlannedRoute
}

export function DriverBrief({ plan, route }: Props) {
  const brief = buildDriverBrief(plan, route)
  if (!brief) return null

  return (
    <section aria-label="Driver brief" className="border-border bg-surface rounded-sm border p-3">
      <div className="flex items-start justify-between gap-3">
        <p className="text-accent brand text-xs">Driver brief</p>
        <span
          className={`brand rounded-sm px-1.5 py-0.5 text-[0.65rem] ${
            brief.maxLevel >= 3
              ? 'bg-risk-severe text-white'
              : brief.maxLevel >= 2
                ? 'bg-risk-high text-white'
                : 'bg-accent text-surface'
          }`}
        >
          {brief.action}
        </span>
      </div>
      <p className="text-ink mt-2 text-sm leading-snug">{brief.headline}</p>
      <p className="text-muted mt-1 text-xs">
        Peak corridor risk {briefRiskWord(brief.maxLevel)} · {brief.pavement}
      </p>

      <dl className="mt-3 grid gap-3 sm:grid-cols-2">
        <PlaceBlock
          title="Now at yard"
          name={plan.origin?.name ?? 'Origin'}
          checkpoint={brief.origin}
        />
        <PlaceBlock
          title="At arrival"
          name={plan.destination?.name ?? 'Destination'}
          checkpoint={brief.arrival}
        />
      </dl>
    </section>
  )
}

function PlaceBlock({
  title,
  name,
  checkpoint,
}: {
  title: string
  name: string
  checkpoint: PlannedRoute['checkpoints'][number]
}) {
  return (
    <div className="border-border/80 border-t pt-2">
      <dt className="text-subtle brand text-[0.65rem] tracking-wide">{title}</dt>
      <dd className="text-ink mt-1 text-sm font-medium">{name}</dd>
      <p className="text-muted mt-1 text-xs">
        ETA {formatClock(checkpoint.eta)} · Wind {checkpoint.wind_mph.toFixed(0)} mph
        {checkpoint.gust_mph > checkpoint.wind_mph
          ? ` (gusts ${checkpoint.gust_mph.toFixed(0)})`
          : ''}
      </p>
      <p className="text-subtle text-xs">
        Rain {checkpoint.rain_in.toFixed(2)} in/h · Snow {checkpoint.snow_in.toFixed(1)} in/h
      </p>
    </div>
  )
}
