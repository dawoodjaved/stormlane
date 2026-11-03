import {
  GeoJSONSource,
  Popup,
  type ExpressionSpecification,
  type Map as MapLibreMap,
  type PointLike,
} from 'maplibre-gl'

import type { Checkpoint, Heatmap, Plan, PlannedRoute } from '../../lib/api.ts'
import { formatClock, prefersMoreContrast } from '../../lib/format.ts'
import { RISK_HEX } from '../../lib/risk.ts'
import { routeLinePaint } from '../../lib/routeStyle.ts'
import {
  checkpointCollection,
  heatmapCollection,
  heatmapWeight,
  positionAtHour,
  routeBounds,
  routeCollection,
} from '../../lib/routeGeo.ts'

const EMPTY = { type: 'FeatureCollection' as const, features: [] }

const ROUTE_IDS = ['A', 'B', 'C'] as const
const FIRST_ROUTE_CASE = 'route-case-A'

const geometryByMap = new WeakMap<MapLibreMap, string | undefined>()
const heatmapByMap = new WeakMap<MapLibreMap, string | undefined>()
let routeSync = 0

export const ROUTE_LINE_LAYERS = ROUTE_IDS.map((id) => `route-line-${id}`)
export const CHECKPOINT_LAYER = 'checkpoints'
export const HEATMAP_LAYER = 'corridor-heat'

function emptyLine(id: string) {
  return {
    type: 'Feature' as const,
    properties: { id, level: 0, recommended: false, selected: false },
    geometry: { type: 'LineString' as const, coordinates: [] as [number, number][] },
  }
}

function keepHeatmapUnderRoutes(map: MapLibreMap): void {
  if (!map.getLayer(HEATMAP_LAYER) || !map.getLayer(FIRST_ROUTE_CASE)) return
  map.moveLayer(HEATMAP_LAYER, FIRST_ROUTE_CASE)
}

export function addBaseLayers(map: MapLibreMap): void {
  if (map.getSource('heatmap')) return
  geometryByMap.delete(map)
  heatmapByMap.delete(map)

  map.addSource('heatmap', { type: 'geojson', data: EMPTY })
  map.addSource('checkpoints', { type: 'geojson', data: EMPTY })
  map.addSource('truck', { type: 'geojson', data: EMPTY })

  for (const id of ROUTE_IDS) {
    map.addSource(`route-${id}`, { type: 'geojson', data: EMPTY })
  }

  map.addLayer({
    id: HEATMAP_LAYER,
    type: 'heatmap',
    source: 'heatmap',
    paint: {
      'heatmap-weight': heatmapWeight(0) as ExpressionSpecification,
      'heatmap-intensity': 1.05,
      'heatmap-radius': ['interpolate', ['linear'], ['zoom'], 4, 14, 9, 38],
      'heatmap-opacity': 0.4,
      'heatmap-color': [
        'interpolate',
        ['linear'],
        ['heatmap-density'],
        0,
        'rgba(34,197,94,0)',
        0.18,
        '#22c55e',
        0.4,
        '#eab308',
        0.62,
        '#f97316',
        0.82,
        '#dc2626',
        1,
        '#7e22ce',
      ],
    },
  })

  for (const id of ROUTE_IDS) {
    map.addLayer({
      id: `route-case-${id}`,
      type: 'line',
      source: `route-${id}`,
      layout: { 'line-cap': 'round', 'line-join': 'round', visibility: 'none' },
      paint: { 'line-color': caseColor(), 'line-width': 9, 'line-opacity': 0.95 },
    })
    map.addLayer({
      id: `route-line-${id}`,
      type: 'line',
      source: `route-${id}`,
      layout: { 'line-cap': 'round', 'line-join': 'round', visibility: 'none' },
      paint: {
        'line-width': 5.5,
        'line-opacity': 1,
        'line-color': [
          'match',
          ['get', 'level'],
          0,
          RISK_HEX[0],
          1,
          RISK_HEX[1],
          2,
          RISK_HEX[2],
          3,
          RISK_HEX[3],
          4,
          RISK_HEX[4],
          RISK_HEX[0],
        ],
      },
    })
  }

  map.addLayer({
    id: CHECKPOINT_LAYER,
    type: 'circle',
    source: 'checkpoints',
    paint: {
      'circle-radius': [
        'interpolate',
        ['linear'],
        ['zoom'],
        4,
        ['case', ['==', ['get', 'selected'], 1], 5, 3],
        8,
        ['case', ['==', ['get', 'selected'], 1], 6.5, 4],
      ],
      'circle-color': [
        'match',
        ['get', 'level'],
        0,
        RISK_HEX[0],
        1,
        RISK_HEX[1],
        2,
        RISK_HEX[2],
        3,
        RISK_HEX[3],
        4,
        RISK_HEX[4],
        RISK_HEX[0],
      ],
      'circle-stroke-width': 1.5,
      'circle-stroke-color': caseColor(),
      'circle-opacity': ['case', ['==', ['get', 'selected'], 1], 1, 0.2],
    },
  })

  map.addLayer({
    id: 'truck',
    type: 'circle',
    source: 'truck',
    paint: {
      'circle-radius': 7,
      'circle-color': '#38bdf8',
      'circle-stroke-width': 2,
      'circle-stroke-color': inkColor(),
    },
  })

  keepHeatmapUnderRoutes(map)
}

function paintRouteLine(map: MapLibreMap, id: (typeof ROUTE_IDS)[number], selected: string): void {
  if (!map.getLayer(`route-line-${id}`)) return
  const paint = routeLinePaint(id === selected, prefersMoreContrast())
  map.setPaintProperty(`route-line-${id}`, 'line-width', paint.width)
  map.setPaintProperty(`route-line-${id}`, 'line-opacity', paint.opacity)
  map.setPaintProperty(`route-case-${id}`, 'line-width', paint.caseWidth)
  map.setPaintProperty(`route-case-${id}`, 'line-opacity', paint.caseOpacity)
  map.setPaintProperty(`route-case-${id}`, 'line-color', caseColor())
}

function caseColor(): string {
  return cssVar('--map-case') || '#0b1220'
}

function inkColor(): string {
  return cssVar('--ink') || '#e2e8f0'
}

function cssVar(name: string): string {
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim()
}

export function syncRoutes(
  map: MapLibreMap,
  plan: Plan | undefined,
  selectedId: string | null,
): void {
  if (!map.getLayer(`route-line-A`)) {
    addBaseLayers(map)
  }
  if (!map.getLayer(`route-line-A`)) return

  const routes = plan?.routes ?? []
  const recommendedId = plan?.recommendation.route_id ?? ''
  const selected = selectedId ?? recommendedId
  const byId = new Map(routes.map((route) => [route.id, route]))
  const planId = plan?.plan_id
  const rewrite = geometryByMap.get(map) !== planId
  const gen = (routeSync += 1)
  const collection = rewrite ? routeCollection(routes, selected, recommendedId) : null
  const writes: Promise<void>[] = []

  for (const id of ROUTE_IDS) {
    const feature = collection?.features.find((item) => item.properties.id === id)
    const source = map.getSource(`route-${id}`)
    if (collection && source instanceof GeoJSONSource) {
      writes.push(
        source.setData({
          type: 'FeatureCollection',
          features: [feature ?? emptyLine(id)],
        }),
      )
    }

    const visible = byId.has(id) ? 'visible' : 'none'
    map.setLayoutProperty(`route-case-${id}`, 'visibility', visible)
    map.setLayoutProperty(`route-line-${id}`, 'visibility', visible)
  }

  for (const id of ROUTE_IDS) {
    if (!byId.has(id) || id === selected) continue
    map.moveLayer(`route-case-${id}`)
    map.moveLayer(`route-line-${id}`)
  }
  if (byId.has(selected)) {
    map.moveLayer(`route-case-${selected}`)
    map.moveLayer(`route-line-${selected}`)
  }
  if (map.getLayer(CHECKPOINT_LAYER)) map.moveLayer(CHECKPOINT_LAYER)
  if (map.getLayer('truck')) map.moveLayer('truck')

  const checkpoints = map.getSource('checkpoints')
  if (checkpoints instanceof GeoJSONSource) {
    writes.push(checkpoints.setData(checkpointCollection(routes, selected)))
  }

  const paint = () => {
    if (gen !== routeSync) return
    if (rewrite) geometryByMap.set(map, planId)
    for (const id of ROUTE_IDS) {
      if (byId.has(id)) paintRouteLine(map, id, selected)
    }
  }

  if (writes.length > 0) {
    void Promise.all(writes).then(paint)
    return
  }
  paint()
}

export function syncHeatmapData(map: MapLibreMap, heatmap: Heatmap | undefined): void {
  const source = map.getSource('heatmap')
  if (!(source instanceof GeoJSONSource)) return
  const planId = heatmap?.plan_id
  if (planId === heatmapByMap.get(map)) return
  heatmapByMap.set(map, planId)
  void source.setData(heatmap ? heatmapCollection(heatmap) : EMPTY).then(() => {
    keepHeatmapUnderRoutes(map)
  })
}

export function syncHeatmapHour(map: MapLibreMap, hour: number): void {
  if (!map.getLayer(HEATMAP_LAYER)) return
  map.setPaintProperty(
    HEATMAP_LAYER,
    'heatmap-weight',
    heatmapWeight(hour) as ExpressionSpecification,
  )
}

export function syncTruck(map: MapLibreMap, route: PlannedRoute | undefined, hour: number): void {
  const source = map.getSource('truck')
  if (!(source instanceof GeoJSONSource)) return
  const point = route ? positionAtHour(route, hour) : null
  void source.setData(
    point
      ? {
          type: 'FeatureCollection',
          features: [
            {
              type: 'Feature',
              properties: {},
              geometry: { type: 'Point', coordinates: point },
            },
          ],
        }
      : EMPTY,
  )
}

export function fitPlan(map: MapLibreMap, plan: Plan, reducedMotion: boolean): void {
  const bounds = routeBounds(plan.routes)
  if (!bounds) return
  const mobile = window.matchMedia('(max-width: 767px)').matches
  map.fitBounds(bounds, {
    padding: mobile
      ? { top: 88, right: 28, bottom: 176, left: 28 }
      : { top: 56, right: 40, bottom: 120, left: 40 },
    duration: reducedMotion ? 0 : 700,
    maxZoom: 8.5,
  })
}

export function flyToCheckpoint(
  map: MapLibreMap,
  checkpoint: Checkpoint,
  reducedMotion: boolean,
): void {
  map.easeTo({
    center: [checkpoint.lon, checkpoint.lat],
    zoom: Math.max(map.getZoom(), 7.2),
    duration: reducedMotion ? 0 : 450,
  })
}

export function checkpointPopup(checkpoint: Checkpoint): HTMLElement {
  const root = document.createElement('div')
  root.className = 'text-xs leading-5'
  const title = document.createElement('p')
  title.className = 'font-medium text-ink'
  title.textContent = `${checkpoint.level_label} · ${formatClock(checkpoint.eta)}`
  const factor = document.createElement('p')
  factor.className = 'text-muted'
  factor.textContent = checkpoint.factor
  const wind = document.createElement('p')
  wind.className = 'text-subtle'
  wind.textContent = `Wind ${checkpoint.wind_mph.toFixed(0)} mph · gusts ${checkpoint.gust_mph.toFixed(0)} mph`
  root.append(title, factor, wind)
  return root
}

export function attachPopup(map: MapLibreMap, popup: Popup, checkpoint: Checkpoint): void {
  popup
    .setLngLat([checkpoint.lon, checkpoint.lat])
    .setDOMContent(checkpointPopup(checkpoint))
    .addTo(map)
}

export function routeIdFromEvent(map: MapLibreMap, point: PointLike): string | null {
  const hits = map.queryRenderedFeatures(point, {
    layers: [...ROUTE_LINE_LAYERS, CHECKPOINT_LAYER],
  })
  const props = hits[0]?.properties
  if (typeof props?.routeId === 'string') return props.routeId
  if (typeof props?.id === 'string') return props.id
  return null
}

export function checkpointFromEvent(
  map: MapLibreMap,
  point: PointLike,
): { routeId: string; index: number } | null {
  const hits = map.queryRenderedFeatures(point, { layers: [CHECKPOINT_LAYER] })
  const props = hits[0]?.properties
  if (!props || typeof props.routeId !== 'string') return null
  const index = Number(props.index)
  if (!Number.isInteger(index)) return null
  return { routeId: props.routeId, index }
}
