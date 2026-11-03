import { describe, expect, it } from 'vitest'

import { routeLinePaint } from './routeStyle.ts'

describe('routeLinePaint', () => {
  it('keeps the selected route full strength', () => {
    expect(routeLinePaint(true).opacity).toBe(1)
    expect(routeLinePaint(true).width).toBeGreaterThan(routeLinePaint(false).width)
  })

  it('dims alternatives so the active line stands out', () => {
    expect(routeLinePaint(false).opacity).toBeLessThan(0.35)
  })

  it('fades less when more contrast is requested', () => {
    expect(routeLinePaint(false, true).opacity).toBeGreaterThan(routeLinePaint(false).opacity)
  })
})
