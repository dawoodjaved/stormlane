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
  selectRoute: (id: string) => void
  focusCheckpoint: (focused: FocusedCheckpoint | null) => void
  setHour: (hour: number) => void
  setPlaying: (playing: boolean) => void
  reset: (routeId: string) => void
}

export const useMapStore = create<MapState>()((set) => ({
  selectedRouteId: null,
  focused: null,
  hour: 0,
  playing: false,
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
  reset: (routeId) => {
    set({ selectedRouteId: routeId, focused: null, hour: 0, playing: false })
  },
}))
