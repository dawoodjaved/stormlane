import type { RiskLevel } from '../../lib/api.ts'
import { RISK_HEX, RISK_LABEL } from '../../lib/risk.ts'

const LEVELS: RiskLevel[] = [0, 1, 2, 3, 4]

export function Legend() {
  return (
    <div
      className="border-border bg-surface-raised/90 rounded-lg border px-2.5 py-2 shadow-lg backdrop-blur"
      aria-label="Risk legend"
    >
      <p className="mb-1.5 text-[10px] font-medium tracking-wide text-slate-400 uppercase">Risk</p>
      <ul className="space-y-1">
        {LEVELS.map((level) => (
          <li key={level} className="flex items-center gap-2 text-xs text-slate-200">
            <span
              className="size-2.5 rounded-full"
              style={{ backgroundColor: RISK_HEX[level] }}
              aria-hidden="true"
            />
            {RISK_LABEL[level]}
          </li>
        ))}
      </ul>
    </div>
  )
}
