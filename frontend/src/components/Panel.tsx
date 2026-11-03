import { useId, useState, type ReactNode } from 'react'

interface Props {
  title: string
  children: ReactNode
}

export function Panel({ title, children }: Props) {
  const [expanded, setExpanded] = useState(true)
  const bodyId = useId()

  return (
    <aside
      aria-label={title}
      className="border-border bg-surface-raised fixed inset-x-0 bottom-0 z-10 flex max-h-[70dvh] flex-col rounded-t-2xl border-t shadow-2xl md:static md:z-auto md:h-full md:max-h-none md:w-[380px] md:shrink-0 md:rounded-none md:border-t-0 md:border-r md:shadow-none"
    >
      <header className="flex items-center justify-between px-5 pt-3 pb-2 md:pt-5">
        <div>
          <h1 className="text-lg font-semibold tracking-tight">Stormlane</h1>
          <p className="text-xs text-slate-400">Weather-aware truck routing</p>
        </div>
        <button
          type="button"
          aria-expanded={expanded}
          aria-controls={bodyId}
          onClick={() => {
            setExpanded((value) => !value)
          }}
          className="focus-visible:outline-accent rounded-md px-2 py-1 text-sm text-slate-300 hover:bg-white/5 focus-visible:outline-2 md:hidden"
        >
          {expanded ? 'Hide' : 'Show'}
        </button>
      </header>
      <div
        id={bodyId}
        className={`${expanded ? 'flex' : 'hidden'} min-h-0 flex-1 flex-col gap-6 overflow-y-auto px-5 pt-2 pb-6 md:flex`}
      >
        {children}
      </div>
    </aside>
  )
}
