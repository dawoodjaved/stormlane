import { useId } from 'react'

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
  const name = useId()

  return (
    <fieldset className="m-0 min-w-0 border-0 p-0" style={{ minInlineSize: 0 }}>
      <legend className={hideLabel ? 'sr-only' : 'text-muted mb-1.5 text-sm font-medium'}>
        {label}
      </legend>
      <div
        role="presentation"
        className="border-border bg-surface flex min-w-0 overflow-hidden rounded-sm border p-0.5"
      >
        {options.map((option) => (
          <label
            key={String(option.value)}
            className="has-checked:bg-accent has-checked:text-surface has-focus-visible:outline-accent text-muted flex min-w-0 flex-1 cursor-pointer items-center justify-center rounded-sm px-2 py-1.5 text-center text-sm leading-tight transition-colors has-checked:font-medium has-focus-visible:outline-2"
          >
            <input
              type="radio"
              name={name}
              className="sr-only"
              checked={option.value === value}
              onChange={() => {
                onChange(option.value)
              }}
            />
            <span className="truncate">{option.label}</span>
          </label>
        ))}
      </div>
    </fieldset>
  )
}
