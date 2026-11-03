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

export function riskHex(level: number): string {
  if (level <= 0) return RISK_HEX[0]
  if (level >= 4) return RISK_HEX[4]
  return RISK_HEX[level as RiskLevel]
}
