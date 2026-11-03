import { useState, type FormEvent } from 'react'

import type { PlanRequest } from '../../lib/api.ts'
import { fromPounds, toDateTimeLocal, toPounds, type WeightUnit } from '../../lib/format.ts'
import { PlaceInput } from './PlaceInput.tsx'
import { SegmentedControl } from './SegmentedControl.tsx'
import { HORIZON_MS, toRequest } from './request.ts'
import { useTripStore, type Interval, type TripForm as TripFields } from './store.ts'

const INTERVALS = [
  { value: 10, label: '10 mi' },
  { value: 25, label: '25 mi' },
  { value: 50, label: '50 mi' },
] as const satisfies readonly { value: Interval; label: string }[]

const UNITS = [
  { value: 'lb', label: 'lb' },
  { value: 'kg', label: 'kg' },
] as const satisfies readonly { value: WeightUnit; label: string }[]

interface Props {
  pending: boolean
  onSubmit: (request: PlanRequest) => void
}

export function TripForm({ pending, onSubmit }: Props) {
  const form = useTripStore()
  const [error, setError] = useState<string | null>(null)

  const now = new Date()
  const minDeparture = toDateTimeLocal(now)
  const maxDeparture = toDateTimeLocal(new Date(now.getTime() + HORIZON_MS))

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const result = toRequest(form)
    if (typeof result === 'string') {
      setError(result)
      return
    }
    setError(null)
    onSubmit(result)
  }

  function change(updates: Partial<TripFields>) {
    setError(null)
    form.update(updates)
  }

  function changeUnit(unit: WeightUnit) {
    const value = Number(form.load)
    const load =
      form.load === '' || Number.isNaN(value)
        ? form.load
        : String(Math.round(fromPounds(toPounds(value, form.loadUnit), unit)))
    setError(null)
    form.update({ loadUnit: unit, load })
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="flex min-w-0 flex-col gap-4">
      <PlaceInput
        key={`from-${String(form.formKey)}`}
        label="From"
        placeholder="City or address"
        value={form.origin}
        onChange={(origin) => {
          change({ origin })
        }}
      />
      <div className="-my-1 flex justify-end">
        <button
          type="button"
          aria-label="Swap origin and destination"
          disabled={!form.origin && !form.destination}
          onClick={() => {
            setError(null)
            form.swap()
          }}
          className="focus-visible:outline-accent hover:bg-hover text-muted rounded-md px-2 py-1 text-xs focus-visible:outline-2 disabled:opacity-40"
        >
          Swap
        </button>
      </div>
      <PlaceInput
        key={`to-${String(form.formKey)}`}
        label="To"
        placeholder="City or address"
        value={form.destination}
        onChange={(destination) => {
          change({ destination })
        }}
      />

      <div>
        <label htmlFor="departure" className="text-muted mb-1.5 block text-sm font-medium">
          Departure
        </label>
        <input
          id="departure"
          type="datetime-local"
          value={form.departure}
          min={minDeparture}
          max={maxDeparture}
          onChange={(event) => {
            change({ departure: event.target.value })
          }}
          className="field"
        />
      </div>

      <div>
        <label htmlFor="load" className="text-muted mb-1.5 block text-sm font-medium">
          Load weight
        </label>
        <div className="flex gap-2">
          <input
            id="load"
            type="number"
            inputMode="numeric"
            min={0}
            step={100}
            value={form.load}
            onChange={(event) => {
              change({ load: event.target.value })
            }}
            className="field min-w-0"
          />
          <div className="w-24 shrink-0 sm:w-28">
            <SegmentedControl
              label="Weight unit"
              hideLabel
              options={UNITS}
              value={form.loadUnit}
              onChange={changeUnit}
            />
          </div>
        </div>
      </div>

      <SegmentedControl
        label="Check weather every"
        options={INTERVALS}
        value={form.interval}
        onChange={(interval) => {
          change({ interval })
        }}
      />

      <label className="text-muted flex items-center gap-2.5 text-sm">
        <input
          type="checkbox"
          checked={form.gustAware}
          onChange={(event) => {
            change({ gustAware: event.target.checked })
          }}
          className="accent-accent size-4"
        />
        Use wind gusts when scoring risk
      </label>

      {error && (
        <p role="alert" className="text-risk-severe text-sm">
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={pending}
        aria-busy={pending}
        className="bg-accent text-surface focus-visible:outline-accent rounded-lg px-4 py-2.5 text-sm font-semibold transition-opacity hover:opacity-90 focus-visible:outline-2 focus-visible:outline-offset-2 disabled:cursor-wait disabled:opacity-60"
      >
        {pending ? 'Planning…' : 'Plan route'}
      </button>
    </form>
  )
}
