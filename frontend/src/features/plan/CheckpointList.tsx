import type { PlannedRoute, RiskLevel } from '../../lib/api.ts'
import { formatClock } from '../../lib/format.ts'

const LEVEL_DOT: Record<RiskLevel, string> = {
  0: 'bg-risk-low',
  1: 'bg-risk-moderate',
  2: 'bg-risk-high',
  3: 'bg-risk-severe',
  4: 'bg-risk-no-travel',
}

interface Props {
  route: PlannedRoute
  focusedIndex: number | null
  onFocus: (index: number) => void
}

export function CheckpointList({ route, focusedIndex, onFocus }: Props) {
  return (
    <section aria-label={`${route.name} checkpoints`} className="space-y-2">
      <h2 className="text-xs font-medium tracking-wide text-slate-400 uppercase">Checkpoints</h2>
      <ul className="max-h-56 space-y-1 overflow-y-auto pr-1">
        {route.checkpoints.map((checkpoint, index) => {
          const focused = focusedIndex === index
          return (
            <li key={`${route.id}-${String(index)}`}>
              <button
                type="button"
                aria-pressed={focused}
                onClick={() => {
                  onFocus(index)
                }}
                className={`flex w-full items-start gap-2 rounded-md px-2 py-1.5 text-left text-xs focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-400 ${
                  focused ? 'bg-white/10' : 'hover:bg-white/5'
                }`}
              >
                <span
                  className={`mt-1 size-2 shrink-0 rounded-full ${LEVEL_DOT[checkpoint.level]}`}
                  aria-hidden="true"
                />
                <span className="min-w-0 flex-1">
                  <span className="flex justify-between gap-2 text-slate-200">
                    <span>{checkpoint.level_label}</span>
                    <span className="text-slate-400">{formatClock(checkpoint.eta)}</span>
                  </span>
                  <span className="block truncate text-slate-400">{checkpoint.factor}</span>
                </span>
              </button>
            </li>
          )
        })}
      </ul>
    </section>
  )
}
