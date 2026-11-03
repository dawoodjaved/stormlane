import type { PlannedRoute } from '../../lib/api.ts'
import { RISK_HEX } from '../../lib/risk.ts'

interface Props {
  route: PlannedRoute
}

/** Compact risk + wind profile along the selected corridor (no chart library). */
export function CorridorChart({ route }: Props) {
  const points = route.checkpoints
  if (points.length < 2) return null

  const width = 320
  const height = 88
  const pad = 8
  const maxMiles = Math.max(route.distance_m / 1609.34, 1)
  const maxWind = Math.max(25, ...points.map((p) => Math.max(p.wind_mph, p.gust_mph)))

  const riskPath = points
    .map((cp, i) => {
      const x = pad + (cp.distance_m / 1609.34 / maxMiles) * (width - pad * 2)
      const y = height - pad - (cp.level / 4) * (height - pad * 2)
      return `${i === 0 ? 'M' : 'L'}${x.toFixed(1)} ${y.toFixed(1)}`
    })
    .join(' ')

  const windPath = points
    .map((cp, i) => {
      const x = pad + (cp.distance_m / 1609.34 / maxMiles) * (width - pad * 2)
      const wind = Math.max(cp.wind_mph, cp.gust_mph)
      const y = height - pad - (wind / maxWind) * (height - pad * 2)
      return `${i === 0 ? 'M' : 'L'}${x.toFixed(1)} ${y.toFixed(1)}`
    })
    .join(' ')

  return (
    <section aria-label="Corridor risk chart" className="border-border rounded-sm border p-3">
      <p className="text-accent brand text-xs">Corridor profile</p>
      <p className="text-muted mt-1 text-xs">
        Risk severity (0–4) and peak wind along {route.name}
      </p>
      <svg
        viewBox={`0 0 ${String(width)} ${String(height)}`}
        className="mt-2 h-24 w-full"
        role="img"
        aria-label="Risk and wind along the route"
      >
        {[0, 1, 2, 3, 4].map((level) => {
          const y = height - pad - (level / 4) * (height - pad * 2)
          return (
            <line
              key={level}
              x1={pad}
              x2={width - pad}
              y1={y}
              y2={y}
              stroke="var(--border)"
              strokeWidth="1"
            />
          )
        })}
        <path
          d={windPath}
          fill="none"
          stroke="var(--muted)"
          strokeWidth="1.5"
          strokeDasharray="3 3"
        />
        <path
          d={riskPath}
          fill="none"
          stroke={RISK_HEX[route.summary.max_level]}
          strokeWidth="2.5"
        />
        {points
          .filter((_, i) => i % Math.ceil(points.length / 8) === 0)
          .map((cp) => {
            const x = pad + (cp.distance_m / 1609.34 / maxMiles) * (width - pad * 2)
            const y = height - pad - (cp.level / 4) * (height - pad * 2)
            return <circle key={cp.distance_m} cx={x} cy={y} r="2.5" fill={RISK_HEX[cp.level]} />
          })}
      </svg>
      <div className="text-subtle mt-1 flex justify-between text-[0.65rem]">
        <span>Solid = risk · Dashed = wind</span>
        <span>{maxMiles.toFixed(0)} mi</span>
      </div>
    </section>
  )
}
