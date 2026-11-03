import 'maplibre-gl/dist/maplibre-gl.css'

import { Map as MapLibreMap, NavigationControl, Popup, setWorkerUrl } from 'maplibre-gl'
import workerUrl from 'maplibre-gl/dist/maplibre-gl-worker.mjs?url'
import { useEffect, useRef, useState } from 'react'

import type { Heatmap, Plan } from '../../lib/api.ts'
import { prefersReducedMotion } from '../../lib/format.ts'
import {
  addBaseLayers,
  attachPopup,
  checkpointFromEvent,
  CHECKPOINT_LAYER,
  fitPlan,
  flyToCheckpoint,
  routeIdFromEvent,
  ROUTE_LINE_LAYERS,
  syncHeatmap,
  syncRoutes,
  syncTruck,
} from './layers.ts'
import { useMapStore } from './store.ts'

setWorkerUrl(workerUrl)

const STYLE_URL = 'https://tiles.openfreemap.org/styles/dark'
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
  const selectedRouteId = useMapStore((state) => state.selectedRouteId)
  const focused = useMapStore((state) => state.focused)
  const hour = useMapStore((state) => state.hour)

  useEffect(() => {
    if (!container.current) return

    const map = new MapLibreMap({
      container: container.current,
      style: STYLE_URL,
      center: NORTH_AMERICA,
      zoom: 3.6,
      attributionControl: { compact: true },
    })
    const popup = new Popup({ closeButton: false, offset: 12, maxWidth: '240px' })
    mapRef.current = map
    popupRef.current = popup
    map.addControl(new NavigationControl({ showCompass: false }), 'top-right')

    const onLoad = () => {
      addBaseLayers(map)
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
  }, [])

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
    syncHeatmap(map, heatmap, hour)
  }, [heatmap, hour, ready])

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

  return (
    <div className="relative h-full w-full">
      <div ref={container} className="h-full w-full" role="region" aria-label="Map" />
      {!plan && !pending && (
        <p className="pointer-events-none absolute top-4 left-1/2 z-[1] w-[min(22rem,calc(100%-2rem))] -translate-x-1/2 rounded-lg border border-white/10 bg-slate-950/70 px-3 py-2 text-center text-sm text-slate-300 md:left-[calc(50%+10px)]">
          Plan a trip to see weather-ranked truck routes.
        </p>
      )}
      {pending && (
        <p
          className="pointer-events-none absolute top-4 left-1/2 z-[1] -translate-x-1/2 rounded-lg bg-slate-950/70 px-3 py-2 text-sm text-slate-300"
          aria-live="polite"
        >
          Drawing routes…
        </p>
      )}
    </div>
  )
}
