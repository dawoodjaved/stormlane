import { RISK_HEX, RISK_LABEL, RISK_LEVELS } from '../../lib/risk.ts'

export function Legend() {
  return (
    <div
      className="border-border bg-surface-raised/90 rounded-lg border px-2.5 py-2 shadow-lg backdrop-blur"
      role="group"
      aria-label="Risk legend"
    >
      <p className="text-muted mb-1.5 text-[10px] font-medium tracking-wide uppercase">Risk</p>
      <ul className="flex flex-wrap gap-x-3 gap-y-1 md:block md:space-y-1">
        {RISK_LEVELS.map((level) => (
          <li key={level} className="text-ink flex items-center gap-2 text-xs">
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
