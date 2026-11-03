import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { chicago, indy } from '../../test/fixtures.ts'
import { renderWithQuery } from '../../test/render.tsx'
import { useTripStore } from './store.ts'
import { TripForm } from './TripForm.tsx'

describe('TripForm', () => {
  beforeEach(() => {
    useTripStore.setState({
      origin: null,
      destination: null,
      departure: '2026-11-03T12:00',
      load: '36000',
      loadUnit: 'lb',
      interval: 25,
      gustAware: true,
      formKey: 0,
    })
  })

  it('blocks submit until both places are chosen', async () => {
    const user = userEvent.setup()
    const onSubmit = vi.fn()
    renderWithQuery(<TripForm pending={false} onSubmit={onSubmit} />)

    await user.click(screen.getByRole('button', { name: 'Score the runs' }))

    expect(screen.getByRole('alert')).toHaveTextContent('Choose a starting point')
    expect(onSubmit).not.toHaveBeenCalled()
  })

  it('swaps origin and destination', async () => {
    const user = userEvent.setup()
    useTripStore.setState({ origin: chicago, destination: indy })
    renderWithQuery(<TripForm pending={false} onSubmit={vi.fn()} />)

    expect(screen.getByLabelText('Yard')).toHaveValue('Chicago, IL')
    expect(screen.getByLabelText('Destination')).toHaveValue('Indianapolis, IN')

    await user.click(screen.getByRole('button', { name: 'Swap yard and destination' }))

    expect(screen.getByLabelText('Yard')).toHaveValue('Indianapolis, IN')
    expect(screen.getByLabelText('Destination')).toHaveValue('Chicago, IL')
  })

  it('submits a valid trip', async () => {
    const user = userEvent.setup()
    const onSubmit = vi.fn()
    useTripStore.setState({ origin: chicago, destination: indy, load: '40000' })
    renderWithQuery(<TripForm pending={false} onSubmit={onSubmit} />)

    await user.click(screen.getByText('10 mi'))
    await user.click(screen.getByRole('button', { name: 'Score the runs' }))

    expect(onSubmit).toHaveBeenCalledWith(
      expect.objectContaining({
        origin: chicago,
        destination: indy,
        load_lb: 40_000,
        interval_miles: 10,
        gust_aware: true,
      }),
    )
  })

  it('clears a validation error after the form changes', async () => {
    const user = userEvent.setup()
    renderWithQuery(<TripForm pending={false} onSubmit={vi.fn()} />)

    await user.click(screen.getByRole('button', { name: 'Score the runs' }))
    expect(screen.getByRole('alert')).toBeInTheDocument()

    await user.click(screen.getByLabelText('Use wind gusts when scoring risk'))
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
  })
})
