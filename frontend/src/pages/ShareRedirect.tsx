import type { ReactNode } from 'react'
import { Navigate, useLocation } from 'react-router-dom'

import { planIdFromSearch } from '../lib/share.ts'

/** Old root share links (?p=) land on the desk. */
export function ShareRedirect({ children }: { children: ReactNode }) {
  const location = useLocation()
  const id = planIdFromSearch(location.search)
  if (id) return <Navigate to={`/app${location.search}`} replace />
  return children
}
