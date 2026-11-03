import { useState } from 'react'

import { replacePlanQuery, withPlanQuery } from '../../lib/share.ts'

export function CopyLinkButton({ planId }: { planId: string }) {
  const [copied, setCopied] = useState(false)

  return (
    <button
      type="button"
      className="focus-visible:outline-accent text-muted hover:text-ink shrink-0 text-xs focus-visible:outline-2"
      onClick={() => {
        replacePlanQuery(planId)
        void navigator.clipboard.writeText(withPlanQuery(planId)).catch(() => undefined)
        setCopied(true)
        window.setTimeout(() => {
          setCopied(false)
        }, 1500)
      }}
    >
      {copied ? 'Copied' : 'Copy link'}
    </button>
  )
}
