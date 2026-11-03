import { fireEvent, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it } from 'vitest'

import { useMapStore } from './store.ts'
import { TimeSlider } from './TimeSlider.tsx'

describe('TimeSlider', () => {
  beforeEach(() => {
    useMapStore.setState({ hour: 0, playing: false })
  })

  it('plays, pauses, and scrubs the forecast hour', async () => {
    const user = userEvent.setup()
    render(<TimeSlider start="2026-11-03T10:00:00Z" hours={5} />)

    await user.click(screen.getByRole('button', { name: 'Play forecast' }))
    expect(useMapStore.getState().playing).toBe(true)

    await user.click(screen.getByRole('button', { name: 'Pause forecast' }))
    expect(useMapStore.getState().playing).toBe(false)

    fireEvent.change(screen.getByRole('slider'), { target: { value: '3' } })
    expect(useMapStore.getState().hour).toBe(3)
    expect(useMapStore.getState().playing).toBe(false)
  })

  it('rewinds from the last hour before playing', async () => {
    const user = userEvent.setup()
    useMapStore.setState({ hour: 4, playing: false })
    render(<TimeSlider start="2026-11-03T10:00:00Z" hours={5} />)

    await user.click(screen.getByRole('button', { name: 'Play forecast' }))

    expect(useMapStore.getState().hour).toBe(0)
    expect(useMapStore.getState().playing).toBe(true)
  })
})
