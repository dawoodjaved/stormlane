import type { Checkpoint, Heatmap, PlannedRoute } from './api.ts'
import { decodePolyline, type LngLat } from './polyline.ts'
import { riskHex } from './risk.ts'

export interface LineFeature {
  type: 'Feature'
  properties: { id: string; recommended: boolean; selected: boolean }
  geometry: { type: 'LineString'; coordinates: LngLat[] }
}

export interface PointFeature {
  type: 'Feature'
  properties: Record<string, string | number | boolean>
  geometry: { type: 'Point'; coordinates: LngLat }
}

export function routeCoordinates(route: PlannedRoute): LngLat[] {
  return decodePolyline(route.polyline)
}

export function routeCollection(
  routes: PlannedRoute[],
  selectedId: string | null,
  recommendedId: string,
): { type: 'FeatureCollection'; features: LineFeature[] } {
  return {
    type: 'FeatureCollection',
    features: routes.map((route) => ({
      type: 'Feature',
      properties: {
        id: route.id,
        recommended: route.id === recommendedId,
        selected: route.id === selectedId,
      },
      geometry: { type: 'LineString', coordinates: routeCoordinates(route) },
    })),
  }
}

export function gradientStops(route: PlannedRoute): (number | string)[] {
  const total = Math.max(route.distance_m, 1)
  const stops: (number | string)[] = []
  let last = -1

  for (const checkpoint of route.checkpoints) {
    const progress = clamp(checkpoint.distance_m / total, 0, 1)
    if (progress - last < 1e-4) continue
    stops.push(progress, riskHex(checkpoint.level))
    last = progress
  }

  if (stops.length === 0) return [0, riskHex(0), 1, riskHex(0)]
  if (stops[0] !== 0) {
    stops.unshift(0, stops[1] ?? riskHex(0))
  }
  if (stops[stops.length - 2] !== 1) {
    stops.push(1, stops[stops.length - 1] ?? riskHex(0))
  }
  return stops
}

export function checkpointCollection(
  routes: PlannedRoute[],
  selectedId: string | null,
): { type: 'FeatureCollection'; features: PointFeature[] } {
  return {
    type: 'FeatureCollection',
    features: routes.flatMap((route) =>
      route.checkpoints.map((checkpoint, index) => ({
        type: 'Feature',
        properties: {
          routeId: route.id,
          index,
          selected: route.id === selectedId ? 1 : 0,
          level: checkpoint.level,
          label: checkpoint.level_label,
          factor: checkpoint.factor,
          eta: checkpoint.eta,
          wind: checkpoint.wind_mph,
          gust: checkpoint.gust_mph,
        },
        geometry: { type: 'Point', coordinates: [checkpoint.lon, checkpoint.lat] },
      })),
    ),
  }
}

export function heatmapCollection(heatmap: Heatmap): {
  type: 'FeatureCollection'
  features: PointFeature[]
} {
  return {
    type: 'FeatureCollection',
    features: heatmap.cells.map((cell) => {
      const properties: Record<string, number> = {}
      cell.risk.forEach((level, hour) => {
        properties[`h${String(hour)}`] = level
      })
      return {
        type: 'Feature',
        properties,
        geometry: { type: 'Point', coordinates: [cell.lon, cell.lat] },
      }
    }),
  }
}

export function positionAtHour(route: PlannedRoute, hour: number): LngLat | null {
  const checkpoints = route.checkpoints
  const first = checkpoints[0]
  const last = checkpoints[checkpoints.length - 1]
  if (!first || !last) return null

  const target = Date.parse(route.departure) + hour * 3_600_000
  if (target <= Date.parse(first.eta)) return [first.lon, first.lat]
  if (target >= Date.parse(last.eta)) return [last.lon, last.lat]

  for (let i = 1; i < checkpoints.length; i += 1) {
    const previous = checkpoints[i - 1]
    const current = checkpoints[i]
    if (!previous || !current) continue
    const start = Date.parse(previous.eta)
    const end = Date.parse(current.eta)
    if (target <= end) {
      const frac = end === start ? 0 : (target - start) / (end - start)
      return lerpPoint(previous, current, frac)
    }
  }
  return [last.lon, last.lat]
}

export function routeBounds(routes: PlannedRoute[]): [LngLat, LngLat] | null {
  const points = routes.flatMap(routeCoordinates)
  const first = points[0]
  if (!first) return null

  let west = first[0]
  let south = first[1]
  let east = first[0]
  let north = first[1]
  for (const [lon, lat] of points) {
    west = Math.min(west, lon)
    east = Math.max(east, lon)
    south = Math.min(south, lat)
    north = Math.max(north, lat)
  }
  return [
    [west, south],
    [east, north],
  ]
}

export function heatmapWeight(hour: number): (string | number | string[])[] {
  return ['interpolate', ['linear'], ['get', `h${String(hour)}`], 0, 0.08, 4, 1]
}

function lerpPoint(from: Checkpoint, to: Checkpoint, frac: number): LngLat {
  const t = clamp(frac, 0, 1)
  return [from.lon + (to.lon - from.lon) * t, from.lat + (to.lat - from.lat) * t]
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value))
}
