import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'

import { Panel } from './Panel.tsx'

describe('Panel', () => {
  it('toggles the planner body on small screens', async () => {
    const user = userEvent.setup()
    render(
      <Panel title="Trip planner">
        <p>Planner body</p>
      </Panel>,
    )

    expect(screen.getByRole('heading', { name: 'Stormlane' })).toBeInTheDocument()
    expect(screen.getByLabelText('Trip planner')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Hide' }))

    expect(screen.getByRole('button', { name: 'Show' })).toHaveAttribute('aria-expanded', 'false')

    await user.click(screen.getByRole('button', { name: 'Show' }))

    expect(screen.getByRole('button', { name: 'Hide' })).toHaveAttribute('aria-expanded', 'true')
    expect(screen.getByText('Planner body')).toBeInTheDocument()
  })
})
