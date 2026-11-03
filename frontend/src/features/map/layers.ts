import {
  GeoJSONSource,
  Popup,
  type ExpressionSpecification,
  type Map as MapLibreMap,
  type PointLike,
} from 'maplibre-gl'

import type { Checkpoint, Heatmap, Plan, PlannedRoute } from '../../lib/api.ts'
import { formatClock } from '../../lib/format.ts'
import { RISK_HEX } from '../../lib/risk.ts'
import {
  checkpointCollection,
  gradientStops,
  heatmapCollection,
  heatmapWeight,
  positionAtHour,
  routeBounds,
  routeCollection,
} from '../../lib/routeGeo.ts'

const EMPTY = { type: 'FeatureCollection' as const, features: [] }

const ROUTE_IDS = ['A', 'B', 'C'] as const

export const ROUTE_LINE_LAYERS = ROUTE_IDS.map((id) => `route-line-${id}`)
export const CHECKPOINT_LAYER = 'checkpoints'
export const HEATMAP_LAYER = 'corridor-heat'

export function addBaseLayers(map: MapLibreMap): void {
  if (map.getSource('heatmap')) return

  map.addSource('heatmap', { type: 'geojson', data: EMPTY })
  map.addSource('checkpoints', { type: 'geojson', data: EMPTY })
  map.addSource('truck', { type: 'geojson', data: EMPTY })

  for (const id of ROUTE_IDS) {
    map.addSource(`route-${id}`, { type: 'geojson', lineMetrics: true, data: EMPTY })
  }

  map.addLayer({
    id: HEATMAP_LAYER,
    type: 'heatmap',
    source: 'heatmap',
    paint: {
      'heatmap-weight': heatmapWeight(0) as ExpressionSpecification,
      'heatmap-intensity': 1.05,
      'heatmap-radius': ['interpolate', ['linear'], ['zoom'], 4, 14, 9, 38],
      'heatmap-opacity': 0.72,
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
      paint: { 'line-color': '#0b1220', 'line-width': 8, 'line-opacity': 0.9 },
    })
    map.addLayer({
      id: `route-line-${id}`,
      type: 'line',
      source: `route-${id}`,
      layout: { 'line-cap': 'round', 'line-join': 'round', visibility: 'none' },
      paint: {
        'line-width': 5,
        'line-opacity': 0.95,
        'line-gradient': [
          'interpolate',
          ['linear'],
          ['line-progress'],
          0,
          RISK_HEX[0],
          1,
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
      'circle-radius': ['case', ['==', ['get', 'selected'], 1], 5.5, 3.5],
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
      'circle-stroke-color': '#0b1220',
      'circle-opacity': ['case', ['==', ['get', 'selected'], 1], 1, 0.32],
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
      'circle-stroke-color': '#f8fafc',
    },
  })
}

export function syncRoutes(
  map: MapLibreMap,
  plan: Plan | undefined,
  selectedId: string | null,
): void {
  const routes = plan?.routes ?? []
  const recommendedId = plan?.recommendation.route_id ?? ''
  const selected = selectedId ?? recommendedId
  const byId = new Map(routes.map((route) => [route.id, route]))
  const collection = routeCollection(routes, selected, recommendedId)

  for (const id of ROUTE_IDS) {
    const feature = collection.features.find((item) => item.properties.id === id)
    const source = map.getSource(`route-${id}`)
    if (source instanceof GeoJSONSource) {
      void source.setData(
        feature ?? {
          type: 'Feature',
          properties: { id, recommended: false, selected: false },
          geometry: { type: 'LineString', coordinates: [] },
        },
      )
    }

    const visible = feature ? 'visible' : 'none'
    map.setLayoutProperty(`route-case-${id}`, 'visibility', visible)
    map.setLayoutProperty(`route-line-${id}`, 'visibility', visible)

    const route = byId.get(id)
    if (!route || !feature) continue

    map.setPaintProperty(`route-line-${id}`, 'line-gradient', [
      'interpolate',
      ['linear'],
      ['line-progress'],
      ...gradientStops(route),
    ])
    const isSelected = id === selected
    const isRecommended = id === recommendedId
    map.setPaintProperty(`route-line-${id}`, 'line-width', isSelected ? 7 : isRecommended ? 5.5 : 4)
    map.setPaintProperty(`route-line-${id}`, 'line-opacity', isSelected ? 1 : 0.55)
    map.setPaintProperty(`route-case-${id}`, 'line-width', isSelected ? 11 : 8)
  }

  if (selected && ROUTE_IDS.includes(selected as (typeof ROUTE_IDS)[number])) {
    map.moveLayer(`route-case-${selected}`, CHECKPOINT_LAYER)
    map.moveLayer(`route-line-${selected}`, CHECKPOINT_LAYER)
  }

  const checkpoints = map.getSource('checkpoints')
  if (checkpoints instanceof GeoJSONSource) {
    void checkpoints.setData(checkpointCollection(routes, selected))
  }
}

export function syncHeatmap(map: MapLibreMap, heatmap: Heatmap | undefined, hour: number): void {
  const source = map.getSource('heatmap')
  if (source instanceof GeoJSONSource) {
    void source.setData(heatmap ? heatmapCollection(heatmap) : EMPTY)
  }
  if (map.getLayer(HEATMAP_LAYER)) {
    map.setPaintProperty(
      HEATMAP_LAYER,
      'heatmap-weight',
      heatmapWeight(hour) as ExpressionSpecification,
    )
  }
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
  map.fitBounds(bounds, {
    padding: { top: 56, right: 40, bottom: 120, left: 40 },
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
  title.className = 'font-medium text-slate-100'
  title.textContent = `${checkpoint.level_label} · ${formatClock(checkpoint.eta)}`
  const factor = document.createElement('p')
  factor.className = 'text-slate-300'
  factor.textContent = checkpoint.factor
  const wind = document.createElement('p')
  wind.className = 'text-slate-400'
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
