import { useState, type ReactNode } from 'react'
import { Link } from 'react-router-dom'

import { BrandMark } from './BrandMark.tsx'
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
      className="border-border bg-surface-raised fixed inset-x-0 bottom-0 z-10 flex max-h-[min(72dvh,36rem)] flex-col border-t pb-[env(safe-area-inset-bottom)] shadow-2xl sm:max-h-[75dvh] md:static md:z-auto md:h-full md:max-h-none md:w-[22rem] md:shrink-0 md:border-t-0 md:border-r md:pb-0 md:shadow-none lg:w-[24rem]"
      style={{ backgroundImage: 'var(--panel-glow)' }}
    >
      <div
        className="absolute inset-y-0 left-0 hidden w-1 md:block"
        style={{ background: 'var(--rail)' }}
        aria-hidden="true"
      />
      <header className="flex items-start justify-between gap-3 px-4 pt-3 pb-3 sm:px-5 md:pt-6">
        <div className="min-w-0">
          <div
            className="bg-border mx-auto mb-2 h-1 w-10 rounded-full md:hidden"
            aria-hidden="true"
          />
          <Link to="/" className="hidden items-center gap-2.5 md:flex">
            <BrandMark className="size-9 shrink-0 border border-[color:var(--border)]" />
            <span className="min-w-0">
              <span className="text-accent brand block text-[0.65rem] leading-none">
                Dispatch desk
              </span>
              <span className="brand text-ink mt-1 block text-3xl leading-none">Weighcast</span>
            </span>
          </Link>
          <div className="md:hidden">
            <p className="text-accent brand text-[0.65rem] leading-none">Dispatch desk</p>
            <h1 className="brand text-ink mt-1 text-3xl leading-none">Weighcast</h1>
          </div>
          <p className="text-muted mt-1.5 max-w-[16rem] text-xs leading-snug">
            Rank truck runs by weather risk before the wheels turn.
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-1 pt-1">
          <ThemeToggle />
          <button
            type="button"
            aria-expanded={expanded}
            aria-controls="planner-body"
            onClick={() => {
              setExpanded((value) => !value)
            }}
            className="focus-visible:outline-accent hover:bg-hover text-muted rounded-sm px-2 py-1 text-sm focus-visible:outline-2 md:hidden"
          >
            {expanded ? 'Hide' : 'Show'}
          </button>
        </div>
      </header>
      <div
        id="planner-body"
        className={`${expanded ? 'flex' : 'hidden'} min-h-0 flex-1 flex-col gap-6 overflow-y-auto overscroll-contain px-4 pt-1 pb-6 sm:px-5 md:flex`}
      >
        {children}
      </div>
    </aside>
  )
}
