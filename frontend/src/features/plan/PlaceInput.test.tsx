import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { geocode } from '../../lib/api.ts'
import { chicago } from '../../test/fixtures.ts'
import { renderWithQuery } from '../../test/render.tsx'
import { PlaceInput } from './PlaceInput.tsx'

vi.mock('../../lib/api.ts', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../../lib/api.ts')>()
  return { ...actual, geocode: vi.fn() }
})

vi.mock('../../lib/useDebouncedValue.ts', () => ({
  useDebouncedValue: <T,>(value: T) => value,
}))

describe('PlaceInput', () => {
  beforeEach(() => {
    vi.mocked(geocode).mockReset()
    vi.mocked(geocode).mockResolvedValue([chicago])
  })

  it('lists matches and reports the chosen place', async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    renderWithQuery(
      <PlaceInput label="From" placeholder="City or address" value={null} onChange={onChange} />,
    )

    await user.type(screen.getByRole('combobox', { name: 'From' }), 'Chi')

    await waitFor(() => {
      expect(screen.getByRole('option', { name: 'Chicago, IL' })).toBeInTheDocument()
    })

    await user.click(screen.getByRole('option', { name: 'Chicago, IL' }))

    expect(onChange).toHaveBeenCalledWith(chicago)
  })

  it('shows an empty state when nothing matches', async () => {
    const user = userEvent.setup()
    vi.mocked(geocode).mockResolvedValue([])
    renderWithQuery(
      <PlaceInput label="From" placeholder="City or address" value={null} onChange={vi.fn()} />,
    )

    await user.type(screen.getByRole('combobox', { name: 'From' }), 'zzz')

    await waitFor(() => {
      expect(screen.getByText('No matches')).toBeInTheDocument()
    })
  })
})
