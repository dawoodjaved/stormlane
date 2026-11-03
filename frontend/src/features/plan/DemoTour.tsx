import { useEffect, useState } from 'react'

const STEPS = [
  {
    title: 'Set the run',
    body: 'Pick yard and destination, or tap a sample trip. Set gate time with Now, In 3 hours, or Tomorrow 6 AM. Checkpoint spacing controls how often weather is sampled along the corridor.',
  },
  {
    title: 'Score the corridors',
    body: 'Weighcast pulls Valhalla truck routes, samples Open-Meteo at each ETA, and ranks by No Travel, severe miles, high miles, then average risk.',
  },
  {
    title: 'Read the brief',
    body: 'Driver Brief shows origin and arrival weather plus an action line. Hold the gate if leaving later is safer. Jump to the worst stretch on the map.',
  },
  {
    title: 'Scrub the forecast',
    body: 'Toggle Risk, Wind, Rain, or Snow on the corridor heatmap. Play 0–48 hours and compare named corridors like via I-20.',
  },
] as const

interface Props {
  open: boolean
  onClose: () => void
}

export function DemoTour({ open, onClose }: Props) {
  const [index, setIndex] = useState(0)

  useEffect(() => {
    if (!open) {
      window.speechSynthesis?.cancel()
      setIndex(0)
      return
    }
    const step = STEPS[index]
    if (!step || !window.speechSynthesis) return
    window.speechSynthesis.cancel()
    const utterance = new SpeechSynthesisUtterance(`${step.title}. ${step.body}`)
    utterance.rate = 1.02
    window.speechSynthesis.speak(utterance)
    return () => {
      window.speechSynthesis.cancel()
    }
  }, [open, index])

  if (!open) return null
  const step = STEPS[index]
  if (!step) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/55 p-4 sm:items-center"
      role="dialog"
      aria-modal="true"
      aria-labelledby="demo-tour-title"
      onClick={onClose}
    >
      <div
        className="border-border bg-surface-raised max-h-[85dvh] w-full max-w-md overflow-y-auto rounded-sm border p-4 shadow-2xl"
        onClick={(event) => {
          event.stopPropagation()
        }}
      >
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-accent brand text-xs">Narrated tour · 1 min</p>
            <h2 id="demo-tour-title" className="brand text-ink mt-1 text-2xl">
              {step.title}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-muted hover:text-ink focus-visible:outline-accent rounded-sm text-sm focus-visible:outline-2"
          >
            Close
          </button>
        </div>
        <p className="text-muted mt-3 text-sm leading-relaxed">{step.body}</p>
        <p className="text-subtle mt-3 text-xs">
          Step {String(index + 1)} of {String(STEPS.length)}
        </p>
        <div className="mt-4 flex justify-between gap-2">
          <button
            type="button"
            disabled={index === 0}
            onClick={() => {
              setIndex((value) => Math.max(0, value - 1))
            }}
            className="border-border text-ink hover:bg-hover focus-visible:outline-accent rounded-sm border px-3 py-2 text-sm focus-visible:outline-2 disabled:opacity-40"
          >
            Back
          </button>
          {index < STEPS.length - 1 ? (
            <button
              type="button"
              onClick={() => {
                setIndex((value) => value + 1)
              }}
              className="bg-accent text-surface brand focus-visible:outline-accent rounded-sm px-3 py-2 text-sm focus-visible:outline-2"
            >
              Next
            </button>
          ) : (
            <button
              type="button"
              onClick={onClose}
              className="bg-accent text-surface brand focus-visible:outline-accent rounded-sm px-3 py-2 text-sm focus-visible:outline-2"
            >
              Open the desk
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
