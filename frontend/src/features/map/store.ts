import { create } from 'zustand'

import type { HeatmapLayer } from '../../lib/api.ts'

export interface FocusedCheckpoint {
  routeId: string
  index: number
}

interface MapState {
  selectedRouteId: string | null
  focused: FocusedCheckpoint | null
  hour: number
  playing: boolean
  fitNonce: number
  heatmapLayer: HeatmapLayer
  selectRoute: (id: string) => void
  focusCheckpoint: (focused: FocusedCheckpoint | null) => void
  setHour: (hour: number) => void
  setPlaying: (playing: boolean) => void
  setHeatmapLayer: (layer: HeatmapLayer) => void
  requestFit: () => void
  reset: (routeId: string) => void
}

export const useMapStore = create<MapState>()((set) => ({
  selectedRouteId: null,
  focused: null,
  hour: 0,
  playing: false,
  fitNonce: 0,
  heatmapLayer: 'risk',
  selectRoute: (selectedRouteId) => {
    set({ selectedRouteId, focused: null })
  },
  focusCheckpoint: (focused) => {
    set(focused ? { focused, selectedRouteId: focused.routeId } : { focused })
  },
  setHour: (hour) => {
    set({ hour })
  },
  setPlaying: (playing) => {
    set({ playing })
  },
  setHeatmapLayer: (heatmapLayer) => {
    set({ heatmapLayer })
  },
  requestFit: () => {
    set((state) => ({ fitNonce: state.fitNonce + 1 }))
  },
  reset: (routeId) => {
    set({ selectedRouteId: routeId, focused: null, hour: 0, playing: false })
  },
}))
