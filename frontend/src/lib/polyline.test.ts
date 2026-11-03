import { describe, expect, it } from 'vitest'

import { decodePolyline } from './polyline.ts'

describe('decodePolyline', () => {
  it('decodes the Google polyline reference', () => {
    const points = decodePolyline('_p~iF~ps|U_ulLnnqC_mqNvxq`@', 5)

    expect(points[0]?.[1]).toBeCloseTo(38.5, 5)
    expect(points[0]?.[0]).toBeCloseTo(-120.2, 5)
    expect(points[2]?.[1]).toBeCloseTo(43.252, 5)
    expect(points[2]?.[0]).toBeCloseTo(-126.453, 5)
  })

  it('returns an empty list for an empty string', () => {
    expect(decodePolyline('')).toEqual([])
  })
})
