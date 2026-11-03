import { describe, expect, it } from 'vitest'

import { samplePlan } from '../test/fixtures.ts'
import { buildDriverBrief } from './brief.ts'

describe('buildDriverBrief', () => {
  it('builds an action line for the selected route', () => {
    const route = samplePlan.routes[0]
    expect(route).toBeTruthy()
    const brief = buildDriverBrief(samplePlan, route!)
    expect(brief?.action).toMatch(/CLEAR|CAUTION|SLOW|HOLD/)
    expect(brief?.origin).toBeTruthy()
    expect(brief?.arrival).toBeTruthy()
  })
})
