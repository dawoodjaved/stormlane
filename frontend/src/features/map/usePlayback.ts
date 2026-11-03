import { useEffect } from 'react'

import { prefersReducedMotion } from '../../lib/format.ts'
import { useMapStore } from './store.ts'

export function nextForecastHour(
  hour: number,
  max: number,
): { hour: number; playing: boolean } {
  if (hour >= max) return { hour, playing: false }
  return { hour: hour + 1, playing: true }
}

export function useForecastPlayback(hours: number) {
  const hour = useMapStore((state) => state.hour)
  const playing = useMapStore((state) => state.playing)
  const setHour = useMapStore((state) => state.setHour)
  const setPlaying = useMapStore((state) => state.setPlaying)
  const max = Math.max(hours - 1, 0)

  useEffect(() => {
    if (hour > max) setHour(max)
  }, [hour, max, setHour])

  useEffect(() => {
    if (!playing) return
    if (prefersReducedMotion()) {
      setPlaying(false)
      return
    }

    let frame = 0
    let last = performance.now()
    const tick = (now: number) => {
      if (now - last < 720) {
        frame = requestAnimationFrame(tick)
        return
      }
      last = now
      const step = nextForecastHour(useMapStore.getState().hour, max)
      setHour(step.hour)
      if (!step.playing) {
        setPlaying(false)
        return
      }
      frame = requestAnimationFrame(tick)
    }
    frame = requestAnimationFrame(tick)
    return () => {
      cancelAnimationFrame(frame)
    }
  }, [max, playing, setHour, setPlaying])
}
