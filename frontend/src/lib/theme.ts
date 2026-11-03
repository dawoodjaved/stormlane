import { useSyncExternalStore } from 'react'

export type Theme = 'dark' | 'light'

const KEY = 'stormlane-theme'
const listeners = new Set<() => void>()

let theme: Theme = 'dark'

export function readTheme(): Theme {
  return theme
}

export function bootTheme(): Theme {
  const saved = typeof localStorage === 'undefined' ? null : localStorage.getItem(KEY)
  theme = saved === 'light' ? 'light' : 'dark'
  applyTheme(theme)
  return theme
}

export function setTheme(next: Theme): void {
  theme = next
  applyTheme(next)
  try {
    localStorage.setItem(KEY, next)
  } catch {
    /* ignore private mode */
  }
  for (const listener of listeners) listener()
}

export function toggleTheme(): void {
  setTheme(theme === 'dark' ? 'light' : 'dark')
}

export function useTheme(): Theme {
  return useSyncExternalStore(subscribe, readTheme, () => 'dark')
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}

function applyTheme(next: Theme): void {
  const root = document.documentElement
  root.dataset.theme = next
  root.style.colorScheme = next
  const meta = document.querySelector('meta[name="theme-color"]')
  if (meta) meta.setAttribute('content', next === 'dark' ? '#0b1220' : '#eef2f7')
}
