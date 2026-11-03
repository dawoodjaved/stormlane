import { useState, type FormEvent } from 'react'

import type { PlanRequest } from '../../lib/api.ts'
import { fromPounds, toDateTimeLocal, toPounds, type WeightUnit } from '../../lib/format.ts'
import { PlaceInput } from './PlaceInput.tsx'
import { SegmentedControl } from './SegmentedControl.tsx'
import { toRequest } from './request.ts'
import { useTripStore, type Interval } from './store.ts'

const HORIZON_MS = 48 * 60 * 60 * 1000

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

  function changeUnit(unit: WeightUnit) {
    const value = Number(form.load)
    const load =
      form.load === '' || Number.isNaN(value)
        ? form.load
        : String(Math.round(fromPounds(toPounds(value, form.loadUnit), unit)))
    form.update({ loadUnit: unit, load })
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
      <PlaceInput
        label="From"
        placeholder="City or address"
        value={form.origin}
        onChange={(origin) => {
          form.update({ origin })
        }}
      />
      <PlaceInput
        label="To"
        placeholder="City or address"
        value={form.destination}
        onChange={(destination) => {
          form.update({ destination })
        }}
      />

      <div>
        <label htmlFor="departure" className="mb-1.5 block text-sm font-medium text-slate-300">
          Departure
        </label>
        <input
          id="departure"
          type="datetime-local"
          value={form.departure}
          min={minDeparture}
          max={maxDeparture}
          onChange={(event) => {
            form.update({ departure: event.target.value })
          }}
          className="border-border bg-surface focus:border-accent w-full rounded-lg border px-3 py-2 text-sm text-slate-100 [color-scheme:dark] focus:outline-none"
        />
      </div>

      <div>
        <label htmlFor="load" className="mb-1.5 block text-sm font-medium text-slate-300">
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
              form.update({ load: event.target.value })
            }}
            className="border-border bg-surface focus:border-accent w-full min-w-0 rounded-lg border px-3 py-2 text-sm text-slate-100 focus:outline-none"
          />
          <div className="w-28 shrink-0">
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
          form.update({ interval })
        }}
      />

      <label className="flex items-center gap-2.5 text-sm text-slate-300">
        <input
          type="checkbox"
          checked={form.gustAware}
          onChange={(event) => {
            form.update({ gustAware: event.target.checked })
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
        className="bg-accent text-surface focus-visible:outline-accent rounded-lg px-4 py-2.5 text-sm font-semibold transition-opacity hover:opacity-90 focus-visible:outline-2 focus-visible:outline-offset-2 disabled:cursor-wait disabled:opacity-60"
      >
        {pending ? 'Planning…' : 'Plan route'}
      </button>
    </form>
  )
}
