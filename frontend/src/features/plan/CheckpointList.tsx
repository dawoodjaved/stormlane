import type { ReactNode } from 'react'

import type { PlannedRoute } from '../../lib/api.ts'
import { formatClock } from '../../lib/format.ts'
import { RISK_DOT } from '../../lib/risk.ts'

interface Props {
  route: PlannedRoute
  focusedIndex: number | null
  onFocus: (index: number) => void
  action?: ReactNode
}

export function CheckpointList({ route, focusedIndex, onFocus, action }: Props) {
  return (
    <section aria-label={`${route.name} checkpoints`} className="space-y-2">
      <div className="flex items-center justify-between gap-2">
        <h2 className="text-muted text-xs font-medium tracking-wide uppercase">Checkpoints</h2>
        {action}
      </div>
      <ul className="max-h-48 space-y-1 overflow-y-auto overscroll-contain pr-1 sm:max-h-56">
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
                className={`focus-visible:outline-accent flex w-full items-start gap-2 rounded-md px-2 py-1.5 text-left text-xs focus-visible:outline-2 focus-visible:outline-offset-2 ${
                  focused ? 'bg-hover' : 'hover:bg-hover'
                }`}
              >
                <span
                  className={`mt-1 size-2 shrink-0 rounded-full ${RISK_DOT[checkpoint.level]}`}
                  aria-hidden="true"
                />
                <span className="min-w-0 flex-1">
                  <span className="text-ink flex justify-between gap-2">
                    <span>{checkpoint.level_label}</span>
                    <span className="text-muted shrink-0">{formatClock(checkpoint.eta)}</span>
                  </span>
                  <span className="text-muted block truncate">{checkpoint.factor}</span>
                </span>
              </button>
            </li>
          )
        })}
      </ul>
    </section>
  )
}
