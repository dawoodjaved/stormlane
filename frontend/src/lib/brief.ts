import type { Checkpoint, Plan, PlannedRoute } from './api.ts'
import { RISK_LABEL } from './risk.ts'

export interface DriverBrief {
  action: string
  headline: string
  origin: Checkpoint
  arrival: Checkpoint
  pavement: string
  maxLevel: number
}

export function buildDriverBrief(plan: Plan, route: PlannedRoute): DriverBrief | null {
  const origin = route.checkpoints[0]
  const arrival = route.checkpoints[route.checkpoints.length - 1]
  if (!origin || !arrival) return null

  const max = route.summary.max_level
  const worst = route.checkpoints.reduce((best, cp) => (cp.level > best.level ? cp : best), origin)
  const action =
    max >= 4 ? 'HOLD / REROUTE' : max >= 3 ? 'SLOW DOWN' : max >= 2 ? 'CAUTION' : 'CLEAR ROADS'

  const headline =
    max >= 4
      ? `No Travel weather on ${route.name}. Do not dispatch this corridor as planned.`
      : max >= 3
        ? `Severe stretch near mi ${(worst.distance_m / 1609.34).toFixed(0)} — ${worst.factor}.`
        : max >= 2
          ? `High risk pockets on ${route.name}. Reduce speed through flagged miles.`
          : `Gentle winds (${origin.wind_mph.toFixed(0)} mph at yard) and mostly dry pavement to ${plan.destination?.name ?? 'destination'}.`

  const wet = route.checkpoints.some((cp) => cp.rain_in >= 0.1 || cp.snow_in >= 0.5)
  const pavement = wet ? 'Wet / slick patches expected' : 'Dry & clear for most of the run'

  return {
    action,
    headline,
    origin,
    arrival,
    pavement,
    maxLevel: max,
  }
}

export function briefRiskWord(level: number): string {
  return RISK_LABEL[level as 0 | 1 | 2 | 3 | 4] ?? 'Low'
}
