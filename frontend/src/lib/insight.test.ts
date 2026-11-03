import { describe, expect, it } from 'vitest'

import { route, routeA, samplePlan } from '../test/fixtures.ts'
import type { Heatmap, RiskLevel } from './api.ts'
import { betterDeparture, worstCheckpoint } from './insight.ts'

function risk(level: RiskLevel, hours = 13): RiskLevel[] {
  return Array.from({ length: hours }, () => level)
}

function heatmap(cells: Heatmap['cells'], hours = 13): Heatmap {
  return {
    plan_id: samplePlan.plan_id,
    start: samplePlan.departure,
    hours,
    cell_size_m: 25_000,
    cells,
  }
}

describe('worstCheckpoint', () => {
  it('picks the first highest-risk stop', () => {
    const found = worstCheckpoint(
      route({
        id: 'A',
        name: 'Route A',
        checkpoints: routeA.checkpoints.map((cp, i) => ({
          ...cp,
          level: i === 1 ? 3 : 1,
        })),
      }),
    )
    expect(found).toEqual({ index: 1, level: 3 })
  })

  it('hides when the run is calm', () => {
    const calm = route({
      id: 'A',
      name: 'Route A',
      checkpoints: routeA.checkpoints.map((cp) => ({ ...cp, level: 0 })),
    })
    expect(worstCheckpoint(calm)).toBeNull()
  })
})

describe('betterDeparture', () => {
  it('stays quiet without a matching heatmap', () => {
    expect(betterDeparture(samplePlan)).toBeNull()
    expect(betterDeparture(samplePlan, heatmap([], 13))).toBeNull()
  })

  it('stays quiet when leaving now is already best', () => {
    expect(
      betterDeparture(
        samplePlan,
        heatmap([
          { lat: 41.88, lon: -87.63, risk: risk(0) },
          { lat: 39.77, lon: -86.16, risk: risk(0) },
        ]),
      ),
    ).toBeNull()
  })

  it('suggests the soonest calmer window', () => {
    const highThenCalm: RiskLevel[] = [4, 4, 4, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]
    const hint = betterDeparture(
      samplePlan,
      heatmap([
        { lat: 41.88, lon: -87.63, risk: highThenCalm },
        { lat: 39.77, lon: -86.16, risk: highThenCalm },
      ]),
    )
    expect(hint).toMatchObject({ delay: 3, routeId: 'B' })
    expect(hint?.summary).toContain('Wait 3 hours')
    expect(hint?.summary).toContain('No Travel')
    expect(hint?.summary).toContain('Low')
  })
})
