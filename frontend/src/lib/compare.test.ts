import { describe, expect, it } from 'vitest'

import { samplePlan } from '../test/fixtures.ts'
import { whyNotChosen } from './compare.ts'

describe('whyNotChosen', () => {
  it('returns null for the recommended route', () => {
    const best = samplePlan.routes.find((route) => route.id === 'B')
    expect(best && whyNotChosen(samplePlan, best)).toBeNull()
  })

  it('explains why an alternate lost', () => {
    const alt = samplePlan.routes.find((route) => route.id === 'A')
    expect(alt && whyNotChosen(samplePlan, alt)).toMatch(/Not chosen/i)
  })
})
