import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'

import { setTheme } from '../lib/theme.ts'
import { ThemeToggle } from './ThemeToggle.tsx'

describe('ThemeToggle', () => {
  beforeEach(() => {
    setTheme('light')
    localStorage.removeItem('weighcast-theme')
  })

  afterEach(() => {
    setTheme('light')
    localStorage.removeItem('weighcast-theme')
  })

  it('switches between light and dark', async () => {
    const user = userEvent.setup()
    render(<ThemeToggle />)

    await user.click(screen.getByRole('button', { name: 'Switch to night theme' }))
    expect(document.documentElement.dataset.theme).toBe('dark')
    expect(screen.getByRole('button', { name: 'Switch to day theme' })).toBeInTheDocument()
  })
})
