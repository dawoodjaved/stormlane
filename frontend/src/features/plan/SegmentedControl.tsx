interface Option<T> {
  value: T
  label: string
}

interface Props<T extends string | number> {
  label: string
  options: readonly Option<T>[]
  value: T
  onChange: (value: T) => void
  hideLabel?: boolean
}

export function SegmentedControl<T extends string | number>({
  label,
  options,
  value,
  onChange,
  hideLabel = false,
}: Props<T>) {
  return (
    <div className="min-w-0" style={{ minInlineSize: 0 }}>
      <p className={hideLabel ? 'sr-only' : 'text-muted mb-1.5 text-sm font-medium'}>{label}</p>
      <div
        role="radiogroup"
        aria-label={label}
        className="border-border bg-surface flex min-w-0 overflow-hidden rounded-sm border p-0.5"
      >
        {options.map((option) => {
          const selected = option.value === value
          return (
            <button
              key={String(option.value)}
              type="button"
              role="radio"
              aria-checked={selected}
              onClick={() => {
                onChange(option.value)
              }}
              className={`focus-visible:outline-accent flex min-w-0 flex-1 items-center justify-center rounded-sm px-2 py-1.5 text-center text-sm leading-tight transition-colors focus-visible:outline-2 ${
                selected
                  ? 'bg-accent text-surface font-medium'
                  : 'text-muted hover:bg-hover hover:text-ink'
              }`}
            >
              <span className="truncate">{option.label}</span>
            </button>
          )
        })}
      </div>
    </div>
  )
}
