import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { Legend } from './Legend.tsx'

describe('Legend', () => {
  it('lists every risk level', () => {
    render(<Legend />)

    expect(screen.getByLabelText('Risk legend')).toBeInTheDocument()
    for (const label of ['Low', 'Moderate', 'High', 'Severe', 'No Travel']) {
      expect(screen.getByText(label)).toBeInTheDocument()
    }
  })
})
