import type { PlanRequest } from '../../lib/api.ts'
import { toPounds } from '../../lib/format.ts'
import type { TripForm } from './store.ts'

const MAX_LOAD_LB = 200_000
export const HORIZON_MS = 48 * 60 * 60 * 1000

export function toRequest(form: TripForm, now: Date = new Date()): PlanRequest | string {
  if (!form.origin) return 'Choose a starting point from the suggestions.'
  if (!form.destination) return 'Choose a destination from the suggestions.'

  const load = Number(form.load)
  if (form.load.trim() === '' || Number.isNaN(load) || load < 0) {
    return 'Enter a load weight of zero or more.'
  }
  const loadLb = toPounds(load, form.loadUnit)
  if (loadLb > MAX_LOAD_LB) return 'Load weight is above the 200,000 lb limit.'

  const departure = new Date(form.departure)
  if (Number.isNaN(departure.getTime())) return 'Enter a departure time.'
  if (departure.getTime() > now.getTime() + HORIZON_MS) {
    return 'Departure must be within the next 48 hours.'
  }

  return {
    origin: form.origin,
    destination: form.destination,
    departure: new Date(Math.max(departure.getTime(), now.getTime())).toISOString(),
    load_lb: Math.round(loadLb),
    interval_miles: form.interval,
    gust_aware: form.gustAware,
    weather_mode: form.weatherMode,
  }
}
