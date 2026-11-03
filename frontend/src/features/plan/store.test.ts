import { beforeEach, describe, expect, it } from 'vitest'

import { chicago, indy, samplePlan } from '../../test/fixtures.ts'
import { useTripStore } from './store.ts'

describe('trip store', () => {
  beforeEach(() => {
    useTripStore.getState().reset()
  })

  it('swaps origin and destination', () => {
    useTripStore.getState().update({ origin: chicago, destination: indy })
    const key = useTripStore.getState().formKey

    useTripStore.getState().swap()

    const state = useTripStore.getState()
    expect(state.origin).toEqual(indy)
    expect(state.destination).toEqual(chicago)
    expect(state.formKey).toBe(key + 1)
  })

  it('resets fields to defaults', () => {
    useTripStore.getState().update({ origin: chicago, load: '12000', gustAware: false })
    const key = useTripStore.getState().formKey

    useTripStore.getState().reset()

    const state = useTripStore.getState()
    expect(state.origin).toBeNull()
    expect(state.destination).toBeNull()
    expect(state.load).toBe('36000')
    expect(state.gustAware).toBe(true)
    expect(state.formKey).toBe(key + 1)
  })

  it('fills the form from a shared plan', () => {
    useTripStore.getState().hydrate(samplePlan)

    const state = useTripStore.getState()
    expect(state.origin).toEqual(chicago)
    expect(state.destination).toEqual(indy)
    expect(state.load).toBe('36000')
    expect(state.interval).toBe(25)
    expect(state.gustAware).toBe(true)
    expect(state.hydratedPlanId).toBe(samplePlan.plan_id)

    useTripStore.getState().hydrate(samplePlan)
    expect(useTripStore.getState().formKey).toBe(state.formKey)
  })
})
