import { apiUrl } from './config.ts'

export type RiskLevel = 0 | 1 | 2 | 3 | 4

export interface LatLon {
  lat: number
  lon: number
}

export interface Place extends LatLon {
  name: string
}

export interface PlanRequest {
  origin: LatLon
  destination: LatLon
  departure: string
  load_lb: number
  interval_miles: 10 | 25 | 50
  gust_aware: boolean
}

export interface Checkpoint extends LatLon {
  distance_m: number
  eta: string
  vertex_index: number
  level: RiskLevel
  level_label: string
  factor: string
  wind_mph: number
  gust_mph: number
  rain_in: number
  snow_in: number
}

export interface RouteSummary {
  miles_by_level: number[]
  high_miles: number
  severe_miles: number
  no_travel_miles: number
  avg_risk: number
  max_level: RiskLevel
}

export interface PlannedRoute {
  id: string
  name: string
  polyline: string
  distance_m: number
  duration_s: number
  departure: string
  arrival: string
  notices: string[]
  summary: RouteSummary
  checkpoints: Checkpoint[]
}

export interface Plan {
  plan_id: string
  departure: string
  load_lb: number
  interval_miles: number
  gust_aware: boolean
  recommendation: {
    route_id: string
    order: string[]
    no_safe_route: boolean
    reason: string
  }
  routes: PlannedRoute[]
}

export interface Heatmap {
  plan_id: string
  start: string
  hours: number
  cell_size_m: number
  cells: (LatLon & { risk: RiskLevel[] })[]
}

export class ApiError extends Error {
  readonly status: number

  constructor(status: number, message: string) {
    super(message)
    this.name = 'ApiError'
    this.status = status
  }
}

export function errorMessage(body: unknown, status: number): string {
  if (body && typeof body === 'object') {
    if ('detail' in body && typeof body.detail === 'string') return body.detail
    const first = Object.values(body as Record<string, unknown>).flat()[0]
    if (typeof first === 'string') return first
  }
  return status >= 500 ? 'Something went wrong on our side. Try again.' : 'Request failed.'
}

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const headers = new Headers(init.headers)
  headers.set('Accept', 'application/json')
  if (init.body) headers.set('Content-Type', 'application/json')
  const response = await fetch(apiUrl(path), { ...init, headers })
  const body: unknown = await response.json().catch(() => null)
  if (!response.ok) throw new ApiError(response.status, errorMessage(body, response.status))
  return body as T
}

export function geocode(query: string, signal?: AbortSignal): Promise<Place[]> {
  const params = new URLSearchParams({ q: query })
  return request<{ results: Place[] }>(`/api/geocode?${params.toString()}`, { signal }).then(
    (body) => body.results,
  )
}

export function createPlan(body: PlanRequest, signal?: AbortSignal): Promise<Plan> {
  return request<Plan>('/api/plan', { method: 'POST', body: JSON.stringify(body), signal })
}

export function fetchHeatmap(planId: string, signal?: AbortSignal): Promise<Heatmap> {
  const params = new URLSearchParams({ plan_id: planId })
  return request<Heatmap>(`/api/heatmap?${params.toString()}`, { signal })
}
