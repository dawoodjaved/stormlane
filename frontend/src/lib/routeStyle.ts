export interface RouteLinePaint {
  width: number
  opacity: number
  caseWidth: number
  caseOpacity: number
}

export function routeLinePaint(selected: boolean, highContrast = false): RouteLinePaint {
  if (selected) {
    return { width: 8, opacity: 1, caseWidth: 13, caseOpacity: 0.95 }
  }
  if (highContrast) {
    return { width: 5, opacity: 0.58, caseWidth: 8, caseOpacity: 0.45 }
  }
  return { width: 4, opacity: 0.26, caseWidth: 6.5, caseOpacity: 0.18 }
}
