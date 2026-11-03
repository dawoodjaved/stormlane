import type { Plan, PlannedRoute } from './api.ts'

/** Why this alternate lost to the recommended route. */
export function whyNotChosen(plan: Plan, route: PlannedRoute): string | null {
  const bestId = plan.recommendation.route_id
  if (route.id === bestId) return null
  const best = plan.routes.find((item) => item.id === bestId)
  if (!best) return null

  const a = best.summary
  const b = route.summary
  if (a.no_travel_miles === 0 && b.no_travel_miles > 0) {
    return `Not chosen: ${b.no_travel_miles.toFixed(0)} mi of No Travel weather`
  }
  if (b.no_travel_miles - a.no_travel_miles > 0.05) {
    return `Not chosen: ${b.no_travel_miles.toFixed(1)} vs ${a.no_travel_miles.toFixed(1)} No Travel miles`
  }
  if (b.severe_miles - a.severe_miles > 0.05) {
    return `Not chosen: ${b.severe_miles.toFixed(0)} mi of severe-risk weather`
  }
  if (b.high_miles - a.high_miles > 0.05) {
    return `Not chosen: ${b.high_miles.toFixed(0)} mi of High-risk weather`
  }
  if (b.avg_risk - a.avg_risk > 0.02) {
    return `Not chosen: Higher average risk: ${b.avg_risk.toFixed(2)} vs ${a.avg_risk.toFixed(2)}`
  }
  if (route.duration_s - best.duration_s > 60) {
    const minutes = Math.round((route.duration_s - best.duration_s) / 60)
    return `Not chosen: ${String(minutes)} min slower at similar risk`
  }
  return 'Not chosen: Ranked below the safer corridor'
}
