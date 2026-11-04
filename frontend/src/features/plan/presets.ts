import type { Place } from '../../lib/api.ts'

export interface TripPreset {
  id: string
  label: string
  detail: string
  origin: Place
  destination: Place
  load: string
}

/** Short corridors so Valhalla + weather return in ~1s for demos. */
export const TRIP_PRESETS: readonly TripPreset[] = [
  {
    id: 'chi-mke',
    label: 'Chicago → Milwaukee',
    detail: '~90 mi · quick sample',
    origin: { name: 'Chicago, Illinois, US', lat: 41.8781, lon: -87.6298 },
    destination: { name: 'Milwaukee, Wisconsin, US', lat: 43.0389, lon: -87.9065 },
    load: '36000',
  },
  {
    id: 'dal-ftw',
    label: 'Dallas → Fort Worth',
    detail: '~35 mi · metro hop',
    origin: { name: 'Dallas, Texas, US', lat: 32.7767, lon: -96.797 },
    destination: { name: 'Fort Worth, Texas, US', lat: 32.7555, lon: -97.3308 },
    load: '40000',
  },
  {
    id: 'den-cos',
    label: 'Denver → Colorado Springs',
    detail: '~70 mi · Front Range',
    origin: { name: 'Denver, Colorado, US', lat: 39.7392, lon: -104.9903 },
    destination: { name: 'Colorado Springs, Colorado, US', lat: 38.8339, lon: -104.8214 },
    load: '38000',
  },
  {
    id: 'bos-pvd',
    label: 'Boston → Providence',
    detail: '~50 mi · New England',
    origin: { name: 'Boston, Massachusetts, US', lat: 42.3601, lon: -71.0589 },
    destination: { name: 'Providence, Rhode Island, US', lat: 41.824, lon: -71.4128 },
    load: '32000',
  },
  {
    id: 'sea-tac',
    label: 'Seattle → Tacoma',
    detail: '~35 mi · Puget Sound',
    origin: { name: 'Seattle, Washington, US', lat: 47.6062, lon: -122.3321 },
    destination: { name: 'Tacoma, Washington, US', lat: 47.2529, lon: -122.4443 },
    load: '36000',
  },
] as const

export function presetById(id: string): TripPreset | undefined {
  return TRIP_PRESETS.find((item) => item.id === id)
}
