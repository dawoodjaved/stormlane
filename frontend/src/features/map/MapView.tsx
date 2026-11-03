import { Map as MapLibreMap, NavigationControl, Popup, setWorkerUrl } from 'maplibre-gl'
import workerUrl from 'maplibre-gl/dist/maplibre-gl-worker.mjs?url'
import { useEffect, useRef, useState } from 'react'

import type { Heatmap, Plan } from '../../lib/api.ts'
import { prefersReducedMotion } from '../../lib/format.ts'
import { useTheme } from '../../lib/theme.ts'
import {
  addBaseLayers,
  attachPopup,
  checkpointFromEvent,
  CHECKPOINT_LAYER,
  fitPlan,
  flyToCheckpoint,
  routeIdFromEvent,
  ROUTE_LINE_LAYERS,
  syncHeatmapData,
  syncHeatmapHour,
  syncRoutes,
  syncTruck,
} from './layers.ts'
import { useMapStore } from './store.ts'

setWorkerUrl(workerUrl)

const STYLE_URL = {
  dark: 'https://tiles.openfreemap.org/styles/dark',
  light: 'https://tiles.openfreemap.org/styles/positron',
} as const
const NORTH_AMERICA: [number, number] = [-96, 38.5]

interface Props {
  plan?: Plan
  heatmap?: Heatmap
  pending?: boolean
}

export default function MapView({ plan, heatmap, pending = false }: Props) {
  const container = useRef<HTMLDivElement>(null)
  const mapRef = useRef<MapLibreMap | null>(null)
  const popupRef = useRef<Popup | null>(null)
  const fittedFor = useRef<string | null>(null)
  const [ready, setReady] = useState(false)
  const theme = useTheme()
  const selectedRouteId = useMapStore((state) => state.selectedRouteId)
  const focused = useMapStore((state) => state.focused)
  const hour = useMapStore((state) => state.hour)
  const fitNonce = useMapStore((state) => state.fitNonce)
  const heatmapLayer = useMapStore((state) => state.heatmapLayer)
  const planRef = useRef(plan)
  const heatmapRef = useRef(heatmap)
  const selectedRef = useRef(selectedRouteId)
  const hourRef = useRef(hour)
  const layerRef = useRef(heatmapLayer)

  useEffect(() => {
    planRef.current = plan
    heatmapRef.current = heatmap
    selectedRef.current = selectedRouteId
    hourRef.current = hour
    layerRef.current = heatmapLayer
  }, [plan, heatmap, selectedRouteId, hour, heatmapLayer])

  useEffect(() => {
    if (!container.current) return

    fittedFor.current = null
    const map = new MapLibreMap({
      container: container.current,
      style: STYLE_URL[theme],
      center: NORTH_AMERICA,
      zoom: 3.6,
      fadeDuration: 0,
      attributionControl: { compact: true },
    })
    const popup = new Popup({ closeButton: false, offset: 12, maxWidth: '240px' })
    mapRef.current = map
    popupRef.current = popup
    map.addControl(new NavigationControl({ showCompass: false }), 'top-right')

    const onLoad = () => {
      addBaseLayers(map)
      map.resize()
      const current = planRef.current
      const selected = selectedRef.current
      syncRoutes(map, current, selected)
      syncHeatmapData(map, heatmapRef.current, layerRef.current)
      syncHeatmapHour(map, hourRef.current)
      const route =
        current?.routes.find((item) => item.id === (selected ?? current.recommendation.route_id)) ??
        current?.routes[0]
      syncTruck(map, route, hourRef.current)
      if (current) {
        fittedFor.current = current.plan_id
        fitPlan(map, current, prefersReducedMotion())
      }
      setReady(true)
    }
    map.on('load', onLoad)

    map.on('click', (event) => {
      const checkpoint = checkpointFromEvent(map, event.point)
      if (checkpoint) {
        useMapStore.getState().focusCheckpoint(checkpoint)
        return
      }
      const routeId = routeIdFromEvent(map, event.point)
      if (routeId) useMapStore.getState().selectRoute(routeId)
    })

    const setCursor = (cursor: string) => {
      map.getCanvas().style.cursor = cursor
    }
    map.on('mouseenter', CHECKPOINT_LAYER, () => {
      setCursor('pointer')
    })
    map.on('mouseleave', CHECKPOINT_LAYER, () => {
      setCursor('')
    })
    for (const layer of ROUTE_LINE_LAYERS) {
      map.on('mouseenter', layer, () => {
        setCursor('pointer')
      })
      map.on('mouseleave', layer, () => {
        setCursor('')
      })
    }

    return () => {
      popup.remove()
      map.remove()
      mapRef.current = null
      popupRef.current = null
      setReady(false)
    }
  }, [theme])

  useEffect(() => {
    const map = mapRef.current
    if (!ready || !map?.isStyleLoaded()) return
    addBaseLayers(map)
    syncRoutes(map, plan, selectedRouteId)
    if (plan && fittedFor.current !== plan.plan_id) {
      fittedFor.current = plan.plan_id
      fitPlan(map, plan, prefersReducedMotion())
    }
    if (!plan) {
      fittedFor.current = null
      popupRef.current?.remove()
    }
  }, [plan, ready, selectedRouteId])

  useEffect(() => {
    const map = mapRef.current
    if (!ready || !map?.isStyleLoaded()) return
    syncHeatmapData(map, heatmap, heatmapLayer)
  }, [heatmap, heatmapLayer, ready])

  useEffect(() => {
    const map = mapRef.current
    if (!ready || !map?.isStyleLoaded()) return
    syncHeatmapHour(map, hour)
  }, [hour, ready])

  useEffect(() => {
    const map = mapRef.current
    if (!ready || !map?.isStyleLoaded() || !plan || fitNonce === 0) return
    fitPlan(map, plan, prefersReducedMotion())
  }, [fitNonce, plan, ready])

  useEffect(() => {
    const map = mapRef.current
    if (!ready || !map?.isStyleLoaded()) return
    const selected =
      plan?.routes.find(
        (route) => route.id === (selectedRouteId ?? plan.recommendation.route_id),
      ) ?? plan?.routes[0]
    syncTruck(map, selected, hour)
  }, [plan, selectedRouteId, hour, ready])

  useEffect(() => {
    const map = mapRef.current
    const popup = popupRef.current
    if (!ready || !map || !popup || !plan || !focused) return
    const route = plan.routes.find((item) => item.id === focused.routeId)
    const checkpoint = route?.checkpoints[focused.index]
    if (!checkpoint) return
    flyToCheckpoint(map, checkpoint, prefersReducedMotion())
    attachPopup(map, popup, checkpoint)
  }, [focused, plan, ready])

  const selectedName =
    plan?.routes.find((route) => route.id === (selectedRouteId ?? plan.recommendation.route_id))
      ?.name ?? plan?.routes[0]?.name

  return (
    <div className="relative h-full w-full">
      <p id="map-help" className="sr-only">
        The bright colored line is the selected truck route. Dimmed lines are alternatives. Click a
        line to select it, or use the route list in the trip planner.
      </p>
      <div
        ref={container}
        id="map"
        className="h-full w-full"
        role="region"
        aria-label={selectedName ? `Map, ${selectedName} selected` : 'Map'}
        aria-describedby="map-help"
      />
      {!plan && !pending && (
        <p className="border-border bg-surface/90 text-muted pointer-events-none absolute top-4 right-14 left-3 z-[1] rounded-sm border px-3 py-2 text-center text-sm md:right-auto md:left-1/2 md:w-[min(22rem,calc(100%-2rem))] md:-translate-x-1/2">
          Score a run to paint risk-ranked corridors on the map.
        </p>
      )}
      {pending && (
        <p
          className="bg-surface/90 text-muted pointer-events-none absolute top-4 right-14 left-3 z-[1] rounded-sm px-3 py-2 text-center text-sm md:right-auto md:left-1/2 md:w-auto md:-translate-x-1/2"
          aria-live="polite"
        >
          Laying down corridors…
        </p>
      )}
    </div>
  )
}
