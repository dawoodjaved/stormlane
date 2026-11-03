import { toggleTheme, useTheme } from '../lib/theme.ts'

export function ThemeToggle() {
  const theme = useTheme()
  const next = theme === 'dark' ? 'light' : 'dark'

  return (
    <button
      type="button"
      aria-label={`Switch to ${next === 'light' ? 'day' : 'night'} theme`}
      onClick={toggleTheme}
      className="focus-visible:outline-accent hover:bg-hover text-muted rounded-sm px-2 py-1 text-sm focus-visible:outline-2"
    >
      {next === 'light' ? 'Day' : 'Night'}
    </button>
  )
}
