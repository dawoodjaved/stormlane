import type { RiskLevel } from './api.ts'

export const RISK_HEX: Record<RiskLevel, string> = {
  0: '#22c55e',
  1: '#eab308',
  2: '#f97316',
  3: '#dc2626',
  4: '#7e22ce',
}

export const RISK_LABEL: Record<RiskLevel, string> = {
  0: 'Low',
  1: 'Moderate',
  2: 'High',
  3: 'Severe',
  4: 'No Travel',
}

export const RISK_DOT: Record<RiskLevel, string> = {
  0: 'bg-risk-low',
  1: 'bg-risk-moderate',
  2: 'bg-risk-high',
  3: 'bg-risk-severe',
  4: 'bg-risk-no-travel',
}

export const RISK_LEVELS: RiskLevel[] = [0, 1, 2, 3, 4]

export function riskHex(level: number): string {
  if (level <= 0) return RISK_HEX[0]
  if (level >= 4) return RISK_HEX[4]
  return RISK_HEX[level as RiskLevel]
}
