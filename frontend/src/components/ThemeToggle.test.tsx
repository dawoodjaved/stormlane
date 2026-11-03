import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it } from 'vitest'

import { setTheme } from '../lib/theme.ts'
import { ThemeToggle } from './ThemeToggle.tsx'

describe('ThemeToggle', () => {
  afterEach(() => {
    setTheme('dark')
    localStorage.removeItem('weighcast-theme')
  })

  it('switches between dark and light', async () => {
    const user = userEvent.setup()
    render(<ThemeToggle />)

    await user.click(screen.getByRole('button', { name: 'Switch to day theme' }))
    expect(document.documentElement.dataset.theme).toBe('light')
    expect(screen.getByRole('button', { name: 'Switch to night theme' })).toBeInTheDocument()
  })
})
