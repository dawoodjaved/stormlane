import { create } from 'zustand'

import type { Place, Plan, WeatherMode } from '../../lib/api.ts'
import { toDateTimeLocal, type WeightUnit } from '../../lib/format.ts'

export type Interval = 10 | 25 | 50

export interface TripForm {
  origin: Place | null
  destination: Place | null
  departure: string
  load: string
  loadUnit: WeightUnit
  interval: Interval
  gustAware: boolean
  weatherMode: WeatherMode
}

const defaults = (): TripForm => ({
  origin: null,
  destination: null,
  departure: toDateTimeLocal(new Date()),
  load: '36000',
  loadUnit: 'lb',
  interval: 25,
  gustAware: true,
  weatherMode: 'live',
})

interface TripStore extends TripForm {
  formKey: number
  hydratedPlanId: string | null
  update: (changes: Partial<TripForm>) => void
  swap: () => void
  reset: () => void
  hydrate: (plan: Plan) => void
}

export const useTripStore = create<TripStore>()((set) => ({
  ...defaults(),
  formKey: 0,
  hydratedPlanId: null,
  update: (changes) => {
    set(changes)
  },
  swap: () => {
    set((state) => ({
      origin: state.destination,
      destination: state.origin,
      formKey: state.formKey + 1,
    }))
  },
  reset: () => {
    set((state) => ({ ...defaults(), formKey: state.formKey + 1, hydratedPlanId: null }))
  },
  hydrate: (plan) => {
    set((state) => {
      if (state.hydratedPlanId === plan.plan_id) return state
      const fields = fieldsFromPlan(plan)
      if (!fields.origin || !fields.destination) return state
      return { ...fields, formKey: state.formKey + 1, hydratedPlanId: plan.plan_id }
    })
  },
}))

export function fieldsFromPlan(plan: Plan): Partial<TripForm> {
  const interval: Interval =
    plan.interval_miles === 10 || plan.interval_miles === 50 ? plan.interval_miles : 25
  return {
    origin: plan.origin ?? placeFromCheckpoint(plan, 'start'),
    destination: plan.destination ?? placeFromCheckpoint(plan, 'end'),
    departure: toDateTimeLocal(new Date(plan.departure)),
    load: String(Math.round(plan.load_lb)),
    loadUnit: 'lb',
    interval,
    gustAware: plan.gust_aware,
    weatherMode: plan.weather_mode ?? 'live',
  }
}

function placeFromCheckpoint(plan: Plan, end: 'start' | 'end'): Place | null {
  const route = plan.routes[0]
  if (!route || route.checkpoints.length === 0) return null
  const checkpoint =
    end === 'start' ? route.checkpoints[0] : route.checkpoints[route.checkpoints.length - 1]
  if (!checkpoint) return null
  return {
    name: `${checkpoint.lat.toFixed(4)}, ${checkpoint.lon.toFixed(4)}`,
    lat: checkpoint.lat,
    lon: checkpoint.lon,
  }
}
