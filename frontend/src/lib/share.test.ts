import { describe, expect, it } from 'vitest'

import { planIdFromSearch, withPlanQuery } from './share.ts'

const id = 'a'.repeat(32)

describe('plan share url', () => {
  it('reads a 32-character plan id', () => {
    expect(planIdFromSearch(`?p=${id}`)).toBe(id)
    expect(planIdFromSearch(`?p=${id.toUpperCase()}`)).toBe(id)
  })

  it('ignores junk ids', () => {
    expect(planIdFromSearch('?p=plan-1')).toBeNull()
    expect(planIdFromSearch('?p=nope')).toBeNull()
    expect(planIdFromSearch('')).toBeNull()
  })

  it('writes a shareable query', () => {
    expect(withPlanQuery(id, 'http://localhost:5173/')).toBe(`http://localhost:5173/app?p=${id}`)
    expect(withPlanQuery(id, 'http://localhost:5173/app')).toBe(`http://localhost:5173/app?p=${id}`)
  })
})
