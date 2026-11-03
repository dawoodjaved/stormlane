import { describe, expect, it } from 'vitest'

import { toRequest } from './request.ts'
import type { TripForm } from './store.ts'

const NOW = new Date('2026-11-03T10:00')

const valid: TripForm = {
  origin: { name: 'Chicago', lat: 41.88, lon: -87.63 },
  destination: { name: 'Indianapolis', lat: 39.77, lon: -86.16 },
  departure: '2026-11-03T12:00',
  load: '36000',
  loadUnit: 'lb',
  interval: 25,
  gustAware: true,
}

describe('toRequest', () => {
  it('builds an API request', () => {
    const request = toRequest(valid, NOW)

    expect(request).toEqual({
      origin: { lat: 41.88, lon: -87.63 },
      destination: { lat: 39.77, lon: -86.16 },
      departure: new Date('2026-11-03T12:00').toISOString(),
      load_lb: 36_000,
      interval_miles: 25,
      gust_aware: true,
    })
  })

  it('converts kilograms to pounds', () => {
    const request = toRequest({ ...valid, load: '16329', loadUnit: 'kg' }, NOW)

    expect(typeof request !== 'string' && request.load_lb).toBe(35_999)
  })

  it('moves a past departure up to now', () => {
    const request = toRequest({ ...valid, departure: '2020-01-01T00:00' }, NOW)

    expect(typeof request !== 'string' && request.departure).toBe(NOW.toISOString())
  })

  it.each([
    [{ origin: null }, 'Choose a starting point from the suggestions.'],
    [{ destination: null }, 'Choose a destination from the suggestions.'],
    [{ load: '' }, 'Enter a load weight of zero or more.'],
    [{ load: '-5' }, 'Enter a load weight of zero or more.'],
    [{ load: '250000' }, 'Load weight is above the 200,000 lb limit.'],
    [{ departure: '' }, 'Enter a departure time.'],
    [{ departure: '2026-11-06T10:00' }, 'Departure must be within the next 48 hours.'],
  ] as const)('rejects %o', (changes, message) => {
    expect(toRequest({ ...valid, ...changes }, NOW)).toBe(message)
  })
})
