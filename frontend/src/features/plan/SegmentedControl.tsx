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
    <fieldset className="min-w-0">
      <legend className={hideLabel ? 'sr-only' : 'text-muted mb-1.5 text-sm font-medium'}>
        {label}
      </legend>
      <div className="border-border bg-surface flex rounded-sm border p-0.5">
        {options.map((option) => (
          <label
            key={String(option.value)}
            className="has-checked:bg-accent has-checked:text-surface has-focus-visible:outline-accent text-muted flex-1 cursor-pointer rounded-sm px-3 py-1.5 text-center text-sm transition-colors has-checked:font-medium has-focus-visible:outline-2"
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
            {option.label}
          </label>
        ))}
      </div>
    </fieldset>
  )
}
