const PLAN_ID = /^[0-9a-f]{32}$/i

export function planIdFromSearch(search = window.location.search): string | null {
  const id = new URLSearchParams(search).get('p')
  if (!id || !PLAN_ID.test(id)) return null
  return id.toLowerCase()
}

export function withPlanQuery(planId: string, href = window.location.href): string {
  const url = new URL(href)
  url.searchParams.set('p', planId)
  return url.toString()
}

export function replacePlanQuery(planId: string | null, href = window.location.href): void {
  const url = new URL(href)
  if (planId) url.searchParams.set('p', planId)
  else url.searchParams.delete('p')
  window.history.replaceState(null, '', `${url.pathname}${url.search}${url.hash}`)
}
