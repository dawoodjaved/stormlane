import { useState, type FormEvent } from 'react'

import type { PlanRequest, WeatherMode } from '../../lib/api.ts'
import { fromPounds, toDateTimeLocal, toPounds, type WeightUnit } from '../../lib/format.ts'
import { PlaceInput } from './PlaceInput.tsx'
import { TRIP_PRESETS, type TripPreset } from './presets.ts'
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

const WEATHER_MODES = [
  { value: 'live', label: 'Live' },
  { value: 'storm', label: 'Demo storm' },
  { value: 'calm', label: 'Demo calm' },
] as const satisfies readonly { value: WeatherMode; label: string }[]

interface Props {
  pending: boolean
  onSubmit: (request: PlanRequest) => void
}

export function TripForm({ pending, onSubmit }: Props) {
  const form = useTripStore()
  const [error, setError] = useState<string | null>(null)
  const [locating, setLocating] = useState(false)

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

  function applyPreset(preset: TripPreset) {
    setError(null)
    useTripStore.setState((state) => ({
      origin: preset.origin,
      destination: preset.destination,
      load: preset.load,
      loadUnit: 'lb',
      departure: toDateTimeLocal(new Date()),
      formKey: state.formKey + 1,
    }))
  }

  function setDepartureOffset(ms: number) {
    change({ departure: toDateTimeLocal(new Date(Date.now() + ms)) })
  }

  function setTomorrowSix() {
    const next = new Date()
    next.setDate(next.getDate() + 1)
    next.setHours(6, 0, 0, 0)
    change({ departure: toDateTimeLocal(next) })
  }

  function useMyLocation() {
    if (!navigator.geolocation) {
      setError('Location is not available in this browser.')
      return
    }
    setLocating(true)
    setError(null)
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLocating(false)
        useTripStore.setState({
          origin: {
            name: 'Current location',
            lat: position.coords.latitude,
            lon: position.coords.longitude,
          },
          formKey: useTripStore.getState().formKey + 1,
        })
      },
      () => {
        setLocating(false)
        setError('Could not read your location. Allow location access and try again.')
      },
      { enableHighAccuracy: false, timeout: 12_000 },
    )
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="flex min-w-0 flex-col gap-4">
      <div>
        <p className="text-muted mb-2 text-sm font-medium">Try a sample trip</p>
        <ul className="flex flex-col gap-1.5">
          {TRIP_PRESETS.map((preset) => (
            <li key={preset.id}>
              <button
                type="button"
                disabled={pending}
                onClick={() => {
                  applyPreset(preset)
                }}
                className="border-border hover:bg-hover focus-visible:outline-accent w-full rounded-sm border px-3 py-2 text-left focus-visible:outline-2"
              >
                <span className="text-ink block text-sm font-medium">{preset.label}</span>
                <span className="text-subtle text-xs">{preset.detail}</span>
              </button>
            </li>
          ))}
        </ul>
      </div>

      <PlaceInput
        key={`from-${String(form.formKey)}`}
        label="Yard"
        placeholder="City or address"
        value={form.origin}
        onChange={(origin) => {
          change({ origin })
        }}
      />
      <div className="-my-1 flex justify-between gap-2">
        <button
          type="button"
          disabled={pending || locating}
          onClick={useMyLocation}
          className="focus-visible:outline-accent hover:bg-hover text-muted rounded-sm px-2 py-1 text-xs focus-visible:outline-2 disabled:opacity-40"
        >
          {locating ? 'Locating…' : 'Use my location'}
        </button>
        <button
          type="button"
          aria-label="Swap yard and destination"
          disabled={!form.origin && !form.destination}
          onClick={() => {
            setError(null)
            form.swap()
          }}
          className="focus-visible:outline-accent hover:bg-hover text-muted rounded-sm px-2 py-1 text-xs focus-visible:outline-2 disabled:opacity-40"
        >
          Flip
        </button>
      </div>
      <PlaceInput
        key={`to-${String(form.formKey)}`}
        label="Destination"
        placeholder="City or address"
        value={form.destination}
        onChange={(destination) => {
          change({ destination })
        }}
      />

      <div>
        <label htmlFor="departure" className="text-muted mb-1.5 block text-sm font-medium">
          Gate time
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
        <div className="mt-2 flex flex-wrap gap-1.5">
          <Chip
            label="Now"
            onClick={() => {
              setDepartureOffset(0)
            }}
          />
          <Chip
            label="In 3 hours"
            onClick={() => {
              setDepartureOffset(3 * 3_600_000)
            }}
          />
          <Chip label="Tomorrow 6 AM" onClick={setTomorrowSix} />
        </div>
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
        label="Sample weather every"
        options={INTERVALS}
        value={form.interval}
        onChange={(interval) => {
          change({ interval })
        }}
      />

      <SegmentedControl
        label="Weather source"
        options={WEATHER_MODES}
        value={form.weatherMode}
        onChange={(weatherMode) => {
          change({ weatherMode })
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
        className="bg-accent text-surface focus-visible:outline-accent brand rounded-sm px-4 py-2.5 text-base tracking-wide transition-opacity hover:opacity-90 focus-visible:outline-2 focus-visible:outline-offset-2 disabled:cursor-wait disabled:opacity-60"
      >
        {pending ? 'Scoring runs…' : 'Score the runs'}
      </button>
    </form>
  )
}

function Chip({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="border-border text-muted hover:bg-hover hover:text-ink focus-visible:outline-accent rounded-sm border px-2 py-1 text-xs focus-visible:outline-2"
    >
      {label}
    </button>
  )
}
