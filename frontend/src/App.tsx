import { useEffect, useState } from 'react'

import { apiUrl } from './lib/config.ts'

type ApiStatus = 'checking' | 'online' | 'offline'

const STATUS_STYLES: Record<ApiStatus, string> = {
  checking: 'bg-slate-500',
  online: 'bg-risk-low',
  offline: 'bg-risk-severe',
}

export default function App() {
  const [status, setStatus] = useState<ApiStatus>('checking')

  useEffect(() => {
    const controller = new AbortController()
    fetch(apiUrl('/api/health'), { signal: controller.signal })
      .then((res) => {
        setStatus(res.ok ? 'online' : 'offline')
      })
      .catch((err: unknown) => {
        if (!controller.signal.aborted) {
          console.warn('Health check failed', err)
          setStatus('offline')
        }
      })
    return () => {
      controller.abort()
    }
  }, [])

  return (
    <main className="flex h-full flex-col items-center justify-center gap-4 p-6 text-center">
      <h1 className="text-4xl font-semibold tracking-tight">Stormlane</h1>
      <p className="max-w-md text-slate-400">
        Weather-aware truck routing. Compare alternatives by storm risk before you roll.
      </p>
      <p className="flex items-center gap-2 text-sm text-slate-300" role="status">
        <span className={`size-2.5 rounded-full ${STATUS_STYLES[status]}`} aria-hidden="true" />
        API {status}
      </p>
    </main>
  )
}
