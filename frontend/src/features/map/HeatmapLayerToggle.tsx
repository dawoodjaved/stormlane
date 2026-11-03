import type { HeatmapLayer } from '../../lib/api.ts'
import { useMapStore } from './store.ts'

const LAYERS: { value: HeatmapLayer; label: string }[] = [
  { value: 'risk', label: 'Risk' },
  { value: 'wind', label: 'Wind' },
  { value: 'rain', label: 'Rain' },
  { value: 'snow', label: 'Snow' },
]

export function HeatmapLayerToggle() {
  const layer = useMapStore((state) => state.heatmapLayer)
  const setHeatmapLayer = useMapStore((state) => state.setHeatmapLayer)

  return (
    <div
      role="group"
      aria-label="Heatmap layer"
      className="border-border bg-surface-raised/95 flex gap-0.5 rounded-sm border p-1 shadow-lg backdrop-blur"
    >
      {LAYERS.map((item) => {
        const active = layer === item.value
        return (
          <button
            key={item.value}
            type="button"
            aria-pressed={active}
            onClick={() => {
              setHeatmapLayer(item.value)
            }}
            className={`brand rounded-sm px-2 py-1 text-[0.65rem] tracking-wide focus-visible:outline-2 focus-visible:outline-[var(--accent)] ${
              active ? 'bg-accent text-surface' : 'text-muted hover:bg-hover hover:text-ink'
            }`}
          >
            {item.label}
          </button>
        )
      })}
    </div>
  )
}
