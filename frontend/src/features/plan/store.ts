import { create } from 'zustand'

import type { Place } from '../../lib/api.ts'
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
}

interface TripStore extends TripForm {
  update: (changes: Partial<TripForm>) => void
}

export const useTripStore = create<TripStore>()((set) => ({
  origin: null,
  destination: null,
  departure: toDateTimeLocal(new Date()),
  load: '36000',
  loadUnit: 'lb',
  interval: 25,
  gustAware: true,
  update: (changes) => {
    set(changes)
  },
}))
