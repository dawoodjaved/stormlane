import type { Heatmap, Plan, PlannedRoute, RiskLevel } from './api.ts'
import { formatForecastHour } from './format.ts'
import { RISK_LABEL } from './risk.ts'

export const MAX_LEAVE_DELAY_H = 12

export interface DelayHint {
  delay: number
  clock: string
  routeId: string
  routeName: string
  summary: string
}

interface Score {
  delay: number
  routeId: string
  routeName: string
  max: number
  noTravel: number
  severe: number
  avg: number
}

export function worstCheckpoint(route: PlannedRoute): { index: number; level: RiskLevel } | null {
  let index = -1
  let level = 0
  for (const [i, checkpoint] of route.checkpoints.entries()) {
    if (checkpoint.level > level) {
      level = checkpoint.level
      index = i
    }
  }
  return index < 0 ? null : { index, level: level as RiskLevel }
}

export function betterDeparture(plan: Plan, heatmap?: Heatmap | null): DelayHint | null {
  if (!heatmap?.cells.length || heatmap.plan_id !== plan.plan_id) return null
  const hours = heatmap.hours
  if (hours < 2) return null

  const maxDelay = Math.min(MAX_LEAVE_DELAY_H, hours - 1)
  const preferred = plan.recommendation.route_id
  const indexes = plan.routes.map((route) =>
    route.checkpoints.map((cp) => nearestCell(heatmap.cells, cp.lat, cp.lon)),
  )

  let best: Score | null = null
  let now: Score | null = null
  for (let delay = 0; delay <= maxDelay; delay++) {
    for (const [r, route] of plan.routes.entries()) {
      const cellsForRoute = indexes[r]
      if (!cellsForRoute || route.checkpoints.length === 0) continue
      const score = scoreRoute(route, plan.departure, heatmap.cells, cellsForRoute, delay, hours)
      if (delay === 0 && (!now || cmp(score, now, preferred) < 0)) now = score
      if (!best || cmp(score, best, preferred) < 0) best = score
    }
  }

  if (!best || !now || best.delay === 0) return null

  const wait = best.delay === 1 ? 'Hold 1 hour' : `Hold ${String(best.delay)} hours`
  const from = RISK_LABEL[now.max as RiskLevel]
  const to = RISK_LABEL[best.max as RiskLevel]
  const summary =
    now.max !== best.max
      ? `${wait} at the dock — peak risk drops from ${from} to ${to} on ${best.routeName}.`
      : `${wait} at the dock for a quieter corridor on ${best.routeName}.`

  return {
    delay: best.delay,
    clock: formatForecastHour(plan.departure, best.delay),
    routeId: best.routeId,
    routeName: best.routeName,
    summary,
  }
}

function scoreRoute(
  route: PlannedRoute,
  departure: string,
  cells: Heatmap['cells'],
  indexes: number[],
  delay: number,
  hours: number,
): Score {
  const last = hours - 1
  let sum = 0
  let noTravel = 0
  let severe = 0
  let max = 0
  const n = route.checkpoints.length
  for (const [i, checkpoint] of route.checkpoints.entries()) {
    const hour = Math.min(last, hourOffset(departure, checkpoint.eta) + delay)
    const cell = cells[indexes[i] ?? 0]
    const level = cell?.risk[hour] ?? checkpoint.level
    sum += level
    if (level >= 4) noTravel += 1
    if (level >= 3) severe += 1
    if (level > max) max = level
  }
  return {
    delay,
    routeId: route.id,
    routeName: route.name,
    max,
    noTravel,
    severe,
    avg: n === 0 ? 0 : sum / n,
  }
}

function nearestCell(cells: Heatmap['cells'], lat: number, lon: number): number {
  let best = 0
  let bestD = Infinity
  for (const [i, cell] of cells.entries()) {
    const dlat = cell.lat - lat
    const dlon = cell.lon - lon
    const d = dlat * dlat + dlon * dlon
    if (d < bestD) {
      bestD = d
      best = i
    }
  }
  return best
}

function hourOffset(departure: string, eta: string): number {
  return Math.max(0, Math.round((Date.parse(eta) - Date.parse(departure)) / 3_600_000))
}

function cmp(a: Score, b: Score, preferredId: string): number {
  const keys: [number, number][] = [
    [a.noTravel > 0 ? 1 : 0, b.noTravel > 0 ? 1 : 0],
    [a.noTravel, b.noTravel],
    [a.severe, b.severe],
    [a.max, b.max],
    [Math.round(a.avg * 1000), Math.round(b.avg * 1000)],
    [a.delay, b.delay],
  ]
  for (const [left, right] of keys) {
    if (left !== right) return left - right
  }
  if (a.routeId === preferredId && b.routeId !== preferredId) return -1
  if (b.routeId === preferredId && a.routeId !== preferredId) return 1
  return 0
}
