import { describe, expect, it } from 'vitest'

import { apiUrl } from './config.ts'

describe('apiUrl', () => {
  it('returns a relative path when no base is configured', () => {
    expect(apiUrl('/api/health', '')).toBe('/api/health')
  })

  it('joins base and path without duplicate slashes', () => {
    expect(apiUrl('/api/health', 'https://api.example.com/')).toBe(
      'https://api.example.com/api/health',
    )
  })

  it('adds a leading slash to the path when missing', () => {
    expect(apiUrl('api/plan', 'https://api.example.com')).toBe('https://api.example.com/api/plan')
  })
})
