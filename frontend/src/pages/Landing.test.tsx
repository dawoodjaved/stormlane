import { screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { renderWithRouter } from '../test/render.tsx'
import { Landing } from './Landing.tsx'

describe('Landing', () => {
  it('shows the Weighcast hero and desk CTA', () => {
    renderWithRouter(<Landing />)

    expect(
      screen.getByRole('heading', { level: 1, name: /Weigh the weather before you roll/i }),
    ).toBeInTheDocument()
    expect(
      screen.getAllByRole('link', { name: /Open the desk|Open Weighcast|Open desk/i }).length,
    ).toBeGreaterThan(0)
    expect(screen.getByRole('heading', { name: /Three moves/i })).toBeInTheDocument()
  })
})
