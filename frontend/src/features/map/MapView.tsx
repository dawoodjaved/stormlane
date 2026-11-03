import 'maplibre-gl/dist/maplibre-gl.css'

import { Map as MapLibreMap, NavigationControl, setWorkerUrl } from 'maplibre-gl'
import workerUrl from 'maplibre-gl/dist/maplibre-gl-worker.mjs?url'
import { useEffect, useRef } from 'react'

setWorkerUrl(workerUrl)

const STYLE_URL = 'https://tiles.openfreemap.org/styles/dark'
const NORTH_AMERICA: [number, number] = [-96, 38.5]

export default function MapView() {
  const container = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!container.current) return
    const map = new MapLibreMap({
      container: container.current,
      style: STYLE_URL,
      center: NORTH_AMERICA,
      zoom: 3.6,
      attributionControl: { compact: true },
    })
    map.addControl(new NavigationControl({ showCompass: false }), 'top-right')
    return () => {
      map.remove()
    }
  }, [])

  return <div ref={container} className="h-full w-full" role="region" aria-label="Map" />
}
