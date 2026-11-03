import { act, renderHook } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { useDebouncedValue } from './useDebouncedValue.ts'

describe('useDebouncedValue', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('returns the latest value after the delay', () => {
    const { result, rerender } = renderHook(({ value }) => useDebouncedValue(value, 250), {
      initialProps: { value: 'Ch' },
    })

    expect(result.current).toBe('Ch')
    rerender({ value: 'Chi' })
    expect(result.current).toBe('Ch')

    act(() => {
      vi.advanceTimersByTime(250)
    })

    expect(result.current).toBe('Chi')
  })
})
