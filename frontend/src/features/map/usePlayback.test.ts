import { describe, expect, it } from 'vitest'

import { nextForecastHour } from './usePlayback.ts'

describe('nextForecastHour', () => {
  it('advances until the last forecast hour', () => {
    expect(nextForecastHour(0, 48)).toEqual({ hour: 1, playing: true })
    expect(nextForecastHour(47, 48)).toEqual({ hour: 48, playing: true })
  })

  it('stops on the last hour', () => {
    expect(nextForecastHour(48, 48)).toEqual({ hour: 48, playing: false })
  })
})
