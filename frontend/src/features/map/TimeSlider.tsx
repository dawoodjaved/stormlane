import { formatForecastHour } from '../../lib/format.ts'
import { useMapStore } from './store.ts'

interface Props {
  start: string
  hours: number
}

export function TimeSlider({ start, hours }: Props) {
  const hour = useMapStore((state) => state.hour)
  const playing = useMapStore((state) => state.playing)
  const setHour = useMapStore((state) => state.setHour)
  const setPlaying = useMapStore((state) => state.setPlaying)
  const max = Math.max(hours - 1, 0)
  const clamped = Math.min(hour, max)

  return (
    <div className="border-border bg-surface-raised/90 flex items-center gap-3 rounded-xl border px-3 py-2 shadow-lg backdrop-blur">
      <button
        type="button"
        aria-pressed={playing}
        aria-label={playing ? 'Pause forecast' : 'Play forecast'}
        onClick={() => {
          if (playing) {
            setPlaying(false)
            return
          }
          if (clamped >= max) setHour(0)
          setPlaying(true)
        }}
        className="focus-visible:outline-accent rounded-md px-2 py-1 text-sm font-medium text-slate-100 hover:bg-white/5 focus-visible:outline-2"
      >
        {playing ? 'Pause' : 'Play'}
      </button>
      <label className="flex min-w-0 flex-1 flex-col gap-1">
        <span className="flex justify-between text-xs text-slate-400">
          <span>+{String(clamped)}h</span>
          <span>{formatForecastHour(start, clamped)}</span>
        </span>
        <input
          type="range"
          min={0}
          max={max}
          step={1}
          value={clamped}
          aria-valuetext={`${String(clamped)} hours after departure, ${formatForecastHour(start, clamped)}`}
          onChange={(event) => {
            setPlaying(false)
            setHour(Number(event.target.value))
          }}
          className="accent-accent h-2 w-full cursor-pointer"
        />
      </label>
    </div>
  )
}
