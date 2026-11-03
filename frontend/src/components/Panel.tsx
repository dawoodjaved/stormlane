import { useState, type ReactNode } from 'react'

import { ThemeToggle } from './ThemeToggle.tsx'

interface Props {
  title: string
  children: ReactNode
}

export function Panel({ title, children }: Props) {
  const [expanded, setExpanded] = useState(true)

  return (
    <aside
      id="planner"
      aria-label={title}
      className="border-border bg-surface-raised fixed inset-x-0 bottom-0 z-10 flex max-h-[min(72dvh,36rem)] flex-col rounded-t-2xl border-t pb-[env(safe-area-inset-bottom)] shadow-2xl sm:max-h-[75dvh] md:static md:z-auto md:h-full md:max-h-none md:w-80 md:shrink-0 md:rounded-none md:border-t-0 md:border-r md:pb-0 md:shadow-none lg:w-[380px]"
    >
      <header className="flex items-center justify-between px-4 pt-2 pb-2 sm:px-5 md:pt-5">
        <div className="min-w-0">
          <div
            className="bg-border mx-auto mb-2 h-1 w-10 rounded-full md:hidden"
            aria-hidden="true"
          />
          <h1 className="text-lg font-semibold tracking-tight">Stormlane</h1>
          <p className="text-muted text-xs">Weather-aware truck routing</p>
        </div>
        <div className="flex items-center gap-1">
          <ThemeToggle />
          <button
            type="button"
            aria-expanded={expanded}
            aria-controls="planner-body"
            onClick={() => {
              setExpanded((value) => !value)
            }}
            className="focus-visible:outline-accent hover:bg-hover text-muted rounded-md px-2 py-1 text-sm focus-visible:outline-2 md:hidden"
          >
            {expanded ? 'Hide' : 'Show'}
          </button>
        </div>
      </header>
      <div
        id="planner-body"
        className={`${expanded ? 'flex' : 'hidden'} min-h-0 flex-1 flex-col gap-6 overflow-y-auto overscroll-contain px-4 pt-2 pb-6 sm:px-5 md:flex`}
      >
        {children}
      </div>
    </aside>
  )
}
