import { describe, expect, it } from 'vitest'

import { formatDuration, formatMiles, fromPounds, toDateTimeLocal, toPounds } from './format.ts'

describe('weight conversion', () => {
  it('converts kilograms to pounds and back', () => {
    expect(toPounds(1000, 'kg')).toBeCloseTo(2204.62, 2)
    expect(fromPounds(toPounds(16_329, 'kg'), 'kg')).toBeCloseTo(16_329, 6)
  })

  it('leaves pounds unchanged', () => {
    expect(toPounds(36_000, 'lb')).toBe(36_000)
    expect(fromPounds(36_000, 'lb')).toBe(36_000)
  })
})

describe('formatMiles', () => {
  it('rounds long distances to whole miles', () => {
    expect(formatMiles(290_000)).toBe('180 mi')
  })

  it('keeps one decimal for short distances', () => {
    expect(formatMiles(5_000)).toBe('3.1 mi')
  })
})

describe('formatDuration', () => {
  it('formats minutes only', () => {
    expect(formatDuration(45 * 60)).toBe('45 min')
  })

  it('formats hours and minutes', () => {
    expect(formatDuration(3 * 3600 + 5 * 60)).toBe('3 h 05 min')
  })
})

describe('toDateTimeLocal', () => {
  it('formats a local date for datetime-local inputs', () => {
    expect(toDateTimeLocal(new Date(2026, 10, 3, 7, 5))).toBe('2026-11-03T07:05')
  })
})
