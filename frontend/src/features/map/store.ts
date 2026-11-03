import { create } from 'zustand'

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
  selectRoute: (id: string) => void
  focusCheckpoint: (focused: FocusedCheckpoint | null) => void
  setHour: (hour: number) => void
  setPlaying: (playing: boolean) => void
  requestFit: () => void
  reset: (routeId: string) => void
}

export const useMapStore = create<MapState>()((set) => ({
  selectedRouteId: null,
  focused: null,
  hour: 0,
  playing: false,
  fitNonce: 0,
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
  requestFit: () => {
    set((state) => ({ fitNonce: state.fitNonce + 1 }))
  },
  reset: (routeId) => {
    set({ selectedRouteId: routeId, focused: null, hour: 0, playing: false })
  },
}))
