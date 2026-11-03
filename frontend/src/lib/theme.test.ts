import { afterEach, describe, expect, it } from 'vitest'

import { bootTheme, readTheme, setTheme } from './theme.ts'

describe('theme', () => {
  afterEach(() => {
    localStorage.removeItem('stormlane-theme')
    setTheme('dark')
  })

  it('defaults to dark', () => {
    localStorage.removeItem('stormlane-theme')
    expect(bootTheme()).toBe('dark')
    expect(document.documentElement.dataset.theme).toBe('dark')
  })

  it('restores a saved light theme', () => {
    localStorage.setItem('stormlane-theme', 'light')
    expect(bootTheme()).toBe('light')
    expect(readTheme()).toBe('light')
  })
})
