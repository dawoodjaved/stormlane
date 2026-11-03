import { describe, expect, it } from 'vitest'

import { errorMessage } from './api.ts'

describe('errorMessage', () => {
  it('uses the detail field', () => {
    expect(errorMessage({ detail: 'No route' }, 422)).toBe('No route')
  })

  it('uses the first field error', () => {
    expect(errorMessage({ departure: ['Departure must be within the next 48 hours.'] }, 400)).toBe(
      'Departure must be within the next 48 hours.',
    )
  })

  it('falls back to a generic message', () => {
    expect(errorMessage(null, 502)).toBe('Something went wrong on our side. Try again.')
    expect(errorMessage('oops', 400)).toBe('Request failed.')
  })
})
