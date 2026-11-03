import { describe, expect, it } from 'vitest'

import type { Checkpoint, PlannedRoute, RouteSummary } from './api.ts'
import {
  gradientStops,
  heatmapCollection,
  heatmapWeight,
  positionAtHour,
  routeBounds,
  routeCoordinates,
} from './routeGeo.ts'

function checkpoint(
  distance_m: number,
  eta: string,
  lat: number,
  lon: number,
  level: Checkpoint['level'] = 0,
): Checkpoint {
  return {
    distance_m,
    eta,
    lat,
    lon,
    vertex_index: 0,
    level,
    level_label: 'Low',
    factor: 'No significant weather',
    wind_mph: 8,
    gust_mph: 10,
    rain_in: 0,
    snow_in: 0,
  }
}

const summary: RouteSummary = {
  miles_by_level: [100, 0, 0, 0, 0],
  high_miles: 0,
  severe_miles: 0,
  no_travel_miles: 0,
  avg_risk: 0,
  max_level: 0,
}

const route: PlannedRoute = {
  id: 'A',
  name: 'Route A',
  polyline: '',
  distance_m: 160_934,
  duration_s: 7_200,
  departure: '2026-11-03T10:00:00Z',
  arrival: '2026-11-03T12:00:00Z',
  notices: [],
  summary,
  checkpoints: [
    checkpoint(0, '2026-11-03T10:00:00Z', 41.88, -87.63, 0),
    checkpoint(80_467, '2026-11-03T11:00:00Z', 40.82, -86.9, 2),
    checkpoint(160_934, '2026-11-03T12:00:00Z', 39.77, -86.16, 1),
  ],
}

describe('gradientStops', () => {
  it('covers the full line and uses checkpoint colors', () => {
    const stops = gradientStops(route)

    expect(stops[0]).toBe(0)
    expect(stops[stops.length - 2]).toBe(1)
    expect(stops).toContain('#f97316')
  })

  it('keeps progress strictly increasing', () => {
    const progress = gradientStops(route).filter((_, index) => index % 2 === 0)
    for (let i = 1; i < progress.length; i += 1) {
      expect(progress[i]).toBeGreaterThan(progress[i - 1] as number)
    }
  })
})

describe('positionAtHour', () => {
  it('stays at the origin before departure', () => {
    expect(positionAtHour(route, 0)).toEqual([-87.63, 41.88])
  })

  it('interpolates the midpoint after one hour', () => {
    expect(positionAtHour(route, 1)).toEqual([-86.9, 40.82])
  })

  it('holds at the destination after arrival', () => {
    expect(positionAtHour(route, 5)).toEqual([-86.16, 39.77])
  })
})

describe('routeBounds', () => {
  it('returns null when there is no geometry', () => {
    expect(routeBounds([route])).toBeNull()
  })
})

describe('heatmapWeight', () => {
  it('reads the property for the active hour', () => {
    expect(heatmapWeight(7)).toEqual(['interpolate', ['linear'], ['get', 'h7'], 0, 0.08, 4, 1])
  })
})

describe('routeCoordinates', () => {
  it('reuses the decoded polyline', () => {
    const first = routeCoordinates(route)
    expect(routeCoordinates(route)).toBe(first)
  })
})

describe('heatmapCollection', () => {
  it('writes one property per forecast hour', () => {
    const collection = heatmapCollection({
      plan_id: 'abc',
      start: '2026-11-03T10:00:00Z',
      hours: 3,
      cell_size_m: 8000,
      cells: [{ lat: 41.8, lon: -87.6, risk: [0, 2, 4] }],
    })
    const properties = collection.features[0]?.properties

    expect(properties).toMatchObject({ h0: 0, h1: 2, h2: 4 })
  })
})
