import { afterEach, describe, expect, it } from 'vitest'

import { bootTheme, readTheme, setTheme } from './theme.ts'

describe('theme', () => {
  afterEach(() => {
    localStorage.removeItem('weighcast-theme')
    setTheme('light')
  })

  it('defaults to light', () => {
    localStorage.removeItem('weighcast-theme')
    expect(bootTheme()).toBe('light')
    expect(document.documentElement.dataset.theme).toBe('light')
  })

  it('restores a saved dark theme', () => {
    localStorage.setItem('weighcast-theme', 'dark')
    expect(bootTheme()).toBe('dark')
    expect(readTheme()).toBe('dark')
  })
})
