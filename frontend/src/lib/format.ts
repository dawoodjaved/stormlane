export const LB_PER_KG = 2.20462262

export type WeightUnit = 'lb' | 'kg'

export function toPounds(value: number, unit: WeightUnit): number {
  return unit === 'kg' ? value * LB_PER_KG : value
}

export function fromPounds(pounds: number, unit: WeightUnit): number {
  return unit === 'kg' ? pounds / LB_PER_KG : pounds
}

export function formatMiles(meters: number): string {
  const miles = meters / 1609.344
  return `${miles.toLocaleString('en-US', { maximumFractionDigits: miles < 10 ? 1 : 0 })} mi`
}

export function formatDuration(seconds: number): string {
  const totalMinutes = Math.round(seconds / 60)
  const hours = Math.floor(totalMinutes / 60)
  const minutes = totalMinutes % 60
  if (hours === 0) return `${String(minutes)} min`
  return `${String(hours)} h ${String(minutes).padStart(2, '0')} min`
}

export function formatClock(iso: string): string {
  return new Date(iso).toLocaleString('en-US', { hour: 'numeric', minute: '2-digit' })
}

export function formatForecastHour(startIso: string, hour: number): string {
  return formatClock(new Date(Date.parse(startIso) + hour * 3_600_000).toISOString())
}

export function prefersReducedMotion(): boolean {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

export function toDateTimeLocal(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${String(date.getFullYear())}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(
    date.getHours(),
  )}:${pad(date.getMinutes())}`
}
