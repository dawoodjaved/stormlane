import type { Checkpoint, Plan, PlannedRoute, RouteSummary } from '../lib/api.ts'

export const chicago = { name: 'Chicago, IL', lat: 41.8781, lon: -87.6298 }
export const indy = { name: 'Indianapolis, IN', lat: 39.7684, lon: -86.1581 }

export const emptyHeatmap = { data: undefined, isPending: false, isError: false }

const calmThenClear = [4, 4, 4, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0] as const

export const laterCalmHeatmap = {
  data: {
    plan_id: 'plan-1',
    start: '2026-11-03T10:00:00Z',
    hours: 13,
    cell_size_m: 25_000,
    cells: [
      { lat: 41.88, lon: -87.63, risk: [...calmThenClear] },
      { lat: 39.77, lon: -86.16, risk: [...calmThenClear] },
    ],
  },
  isPending: false,
  isError: false,
}

const summary = (max_level: RouteSummary['max_level'] = 0): RouteSummary => ({
  miles_by_level: [100, 0, 0, 0, 0],
  high_miles: max_level >= 2 ? 12 : 0,
  severe_miles: 0,
  no_travel_miles: 0,
  avg_risk: max_level === 0 ? 0.12 : 0.84,
  max_level,
})

export function checkpoint(
  partial: Partial<Checkpoint> & Pick<Checkpoint, 'distance_m' | 'eta' | 'lat' | 'lon'>,
): Checkpoint {
  return {
    vertex_index: 0,
    level: 0,
    level_label: 'Low',
    factor: 'No significant weather',
    wind_mph: 8,
    gust_mph: 10,
    rain_in: 0,
    snow_in: 0,
    ...partial,
  }
}

export function route(
  partial: Partial<PlannedRoute> & Pick<PlannedRoute, 'id' | 'name'>,
): PlannedRoute {
  return {
    polyline: '',
    distance_m: 160_934,
    duration_s: 7_200,
    departure: '2026-11-03T10:00:00Z',
    arrival: '2026-11-03T12:00:00Z',
    notices: [],
    summary: summary(),
    checkpoints: [
      checkpoint({ distance_m: 0, eta: '2026-11-03T10:00:00Z', lat: 41.88, lon: -87.63 }),
      checkpoint({
        distance_m: 160_934,
        eta: '2026-11-03T12:00:00Z',
        lat: 39.77,
        lon: -86.16,
        level: 1,
        level_label: 'Moderate',
        factor: 'Rain',
      }),
    ],
    ...partial,
  }
}

export const routeA = route({ id: 'A', name: 'Route A', summary: summary(2) })
export const routeB = route({ id: 'B', name: 'Route B' })

export const samplePlan: Plan = {
  plan_id: 'plan-1',
  departure: '2026-11-03T10:00:00Z',
  load_lb: 36_000,
  interval_miles: 25,
  gust_aware: true,
  origin: chicago,
  destination: indy,
  recommendation: {
    route_id: 'B',
    order: ['B', 'A'],
    no_safe_route: false,
    reason: 'Lowest weather risk among truck routes.',
  },
  routes: [routeA, routeB],
}
