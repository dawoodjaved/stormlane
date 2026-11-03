import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { emptyHeatmap, laterCalmHeatmap, samplePlan } from '../../test/fixtures.ts'
import { useMapStore } from '../map/store.ts'
import { PlanResult } from './PlanResult.tsx'

describe('PlanResult', () => {
  beforeEach(() => {
    useMapStore.setState({
      selectedRouteId: null,
      focused: null,
      hour: 0,
      playing: false,
      fitNonce: 0,
      heatmapLayer: 'risk',
    })
  })

  it('shows idle copy before a plan exists', () => {
    render(
      <PlanResult
        plan={undefined}
        pending={false}
        error={null}
        heatmap={emptyHeatmap}
        onNewTrip={vi.fn()}
      />,
    )

    expect(screen.getByText(/Set origin, destination, and departure/)).toBeInTheDocument()
  })

  it('shows a planning skeleton', () => {
    render(
      <PlanResult
        plan={undefined}
        pending
        error={null}
        heatmap={emptyHeatmap}
        onNewTrip={vi.fn()}
      />,
    )

    expect(screen.getByText('Pulling truck routes and corridor weather…')).toBeInTheDocument()
  })

  it('shows a planning error', () => {
    render(
      <PlanResult
        plan={undefined}
        pending={false}
        error={new Error('No truck route found.')}
        heatmap={emptyHeatmap}
        onNewTrip={vi.fn()}
      />,
    )

    expect(screen.getByRole('alert')).toHaveTextContent('No truck route found.')
  })

  it('selects a route, focuses a checkpoint, and starts a new trip', async () => {
    const user = userEvent.setup()
    const onNewTrip = vi.fn()
    render(
      <PlanResult
        plan={samplePlan}
        pending={false}
        error={null}
        heatmap={emptyHeatmap}
        onNewTrip={onNewTrip}
      />,
    )

    expect(screen.getByText('Lowest weather risk among truck routes.')).toBeInTheDocument()
    expect(screen.getByText('Pick')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Copy link' })).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Worst stretch' }))
    expect(useMapStore.getState().focused).toEqual({ routeId: 'B', index: 1 })

    await user.click(screen.getByRole('button', { name: /Route A/ }))
    expect(useMapStore.getState().selectedRouteId).toBe('A')

    await user.click(screen.getByRole('button', { name: /Moderate/ }))
    expect(useMapStore.getState().focused).toEqual({ routeId: 'A', index: 1 })

    await user.click(screen.getByRole('button', { name: 'New run' }))
    expect(onNewTrip).toHaveBeenCalledOnce()
  })

  it('previews a calmer departure on the map', async () => {
    const user = userEvent.setup()
    render(
      <PlanResult
        plan={samplePlan}
        pending={false}
        error={null}
        heatmap={laterCalmHeatmap}
        onNewTrip={vi.fn()}
      />,
    )

    expect(screen.getByText('Hold the gate')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: /See .+ on the map/ }))
    expect(useMapStore.getState().hour).toBe(3)
    expect(useMapStore.getState().playing).toBe(false)
  })

  it('keeps routes usable when the heatmap fails', () => {
    render(
      <PlanResult
        plan={samplePlan}
        pending={false}
        error={null}
        heatmap={{ data: undefined, isPending: false, isError: true }}
        onNewTrip={vi.fn()}
      />,
    )

    expect(screen.getByRole('alert')).toHaveTextContent('Corridor forecast could not be loaded')
    expect(screen.getByRole('button', { name: /Route B/ })).toBeInTheDocument()
  })
})
