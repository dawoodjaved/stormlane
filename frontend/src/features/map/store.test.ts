import { beforeEach, describe, expect, it } from 'vitest'

import { useMapStore } from './store.ts'

describe('map store', () => {
  beforeEach(() => {
    useMapStore.setState({
      selectedRouteId: null,
      focused: null,
      hour: 4,
      playing: true,
      fitNonce: 0,
    })
  })

  it('selects a route and clears the focused checkpoint', () => {
    useMapStore.setState({ focused: { routeId: 'A', index: 1 } })
    useMapStore.getState().selectRoute('B')

    expect(useMapStore.getState().selectedRouteId).toBe('B')
    expect(useMapStore.getState().focused).toBeNull()
  })

  it('focuses a checkpoint and selects its route', () => {
    useMapStore.getState().focusCheckpoint({ routeId: 'A', index: 2 })

    expect(useMapStore.getState().focused).toEqual({ routeId: 'A', index: 2 })
    expect(useMapStore.getState().selectedRouteId).toBe('A')
  })

  it('resets playback and selection', () => {
    useMapStore.getState().reset('B')

    expect(useMapStore.getState()).toMatchObject({
      selectedRouteId: 'B',
      focused: null,
      hour: 0,
      playing: false,
    })
  })

  it('increments the fit nonce', () => {
    useMapStore.getState().requestFit()
    useMapStore.getState().requestFit()

    expect(useMapStore.getState().fitNonce).toBe(2)
  })
})
