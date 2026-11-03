import { useState, type ReactNode } from 'react'
import { Link } from 'react-router-dom'

import { BrandMark } from '../components/BrandMark.tsx'
import {
  IconCloud,
  IconGate,
  IconShare,
  IconTruck,
  IconWind,
} from '../components/Icons.tsx'
import { ThemeToggle } from '../components/ThemeToggle.tsx'
import { DemoTour } from '../features/plan/DemoTour.tsx'

const STEPS = [
  {
    n: '01',
    title: 'Set the run',
    body: 'Yard, destination, gate time, load weight, and checkpoint spacing along the corridor.',
    icon: <IconTruck className="size-5" />,
  },
  {
    n: '02',
    title: 'Score every corridor',
    body: 'Valhalla truck routes meet Open-Meteo at each ETA. Wind, gusts, rain, and snow rank the options.',
    icon: <IconCloud className="size-5" />,
  },
  {
    n: '03',
    title: 'Dispatch with eyes open',
    body: 'Pick the safest run, hold the gate if later is calmer, share the plan, jump to the worst stretch.',
    icon: <IconGate className="size-5" />,
  },
] as const

const CAPABILITIES: { title: string; body: string; icon: ReactNode }[] = [
  {
    title: 'Gust-aware risk',
    body: 'Load rules tighten when wind is already high. Optional gust scoring uses the worse of sustained and peak.',
    icon: <IconWind className="size-5" />,
  },
  {
    title: 'Hold the gate',
    body: 'Scan the next 48 hours. If waiting cuts peak risk, Weighcast says how long to hold and shows that hour on the map.',
    icon: <IconGate className="size-5" />,
  },
  {
    title: 'Shareable plans',
    body: 'Copy a link with ?p=. Teammates reopen the same ranking with city names restored, not raw coordinates.',
    icon: <IconShare className="size-5" />,
  },
  {
    title: 'Corridor heatmap',
    body: 'Scrub 0–48h across the band around every alternate. Risk gradients paint the line; the truck walks the ETAs.',
    icon: <IconCloud className="size-5" />,
  },
]

export function Landing() {
  const [demoOpen, setDemoOpen] = useState(false)

  return (
    <div className="landing-shell bg-surface text-ink min-h-dvh">
      <DemoTour
        open={demoOpen}
        onClose={() => {
          setDemoOpen(false)
        }}
      />
      <header className="border-border/80 absolute inset-x-0 top-0 z-20 border-b bg-[color-mix(in_oklab,var(--surface)_82%,transparent)] backdrop-blur-md">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
          <a href="#top" className="flex items-center gap-2.5">
            <BrandMark className="size-8 shrink-0 border border-[color:var(--border)]" />
            <span className="brand text-ink text-lg leading-none">Weighcast</span>
          </a>
          <nav className="flex items-center gap-1 sm:gap-2">
            <button
              type="button"
              onClick={() => {
                setDemoOpen(true)
              }}
              className="text-muted hover:text-ink focus-visible:outline-accent hidden rounded-sm px-2 py-1.5 text-sm focus-visible:outline-2 sm:inline"
            >
              Watch demo
            </button>
            <a
              href="#how"
              className="text-muted hover:text-ink focus-visible:outline-accent hidden rounded-sm px-2 py-1.5 text-sm focus-visible:outline-2 sm:inline"
            >
              How it works
            </a>
            <a
              href="#desk"
              className="text-muted hover:text-ink focus-visible:outline-accent hidden rounded-sm px-2 py-1.5 text-sm focus-visible:outline-2 md:inline"
            >
              The desk
            </a>
            <ThemeToggle />
            <Link
              to="/app"
              className="bg-accent text-surface brand focus-visible:outline-accent ml-1 rounded-sm px-3 py-1.5 text-sm tracking-wide hover:opacity-90 focus-visible:outline-2 focus-visible:outline-offset-2"
            >
              Open desk
            </Link>
          </nav>
        </div>
      </header>

      <main id="top">
        <section className="landing-hero relative isolate flex min-h-dvh flex-col justify-end overflow-hidden pt-24 pb-16 sm:pt-28 sm:pb-20">
          <div className="landing-hero-visual absolute inset-0 -z-10" aria-hidden="true">
            <CorridorArt />
          </div>
          <div className="mx-auto w-full max-w-6xl px-4 sm:px-6">
            <p className="landing-rise text-accent brand text-sm tracking-[0.18em]">Weighcast</p>
            <h1 className="landing-rise landing-rise-2 brand text-ink mt-3 max-w-[16ch] text-[clamp(2.75rem,9vw,5.5rem)] leading-[0.92]">
              Weigh the weather before you roll
            </h1>
            <p className="landing-rise landing-rise-3 text-muted mt-5 max-w-md text-base leading-relaxed sm:text-lg">
              Load-aware corridor scoring for dispatch. Gusts, rain, and snow meet your weight —
              then Weighcast ranks the run and tells you when to hold the gate.
            </p>
            <div className="landing-rise landing-rise-4 mt-8 flex flex-wrap items-center gap-3">
              <Link
                to="/app"
                className="bg-accent text-surface brand focus-visible:outline-accent rounded-sm px-5 py-3 text-base tracking-wide hover:opacity-90 focus-visible:outline-2 focus-visible:outline-offset-2"
              >
                Open the desk
              </Link>
              <a
                href="#how"
                className="border-border text-ink focus-visible:outline-accent hover:bg-hover rounded-sm border px-5 py-3 text-sm focus-visible:outline-2"
              >
                See how it works
              </a>
            </div>
          </div>
        </section>

        <section id="how" className="border-border border-t">
          <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6 sm:py-24">
            <p className="text-accent brand text-xs tracking-[0.16em]">How it works</p>
            <h2 className="brand text-ink mt-2 text-3xl sm:text-4xl">
              Three moves. Then you roll.
            </h2>
            <ol className="mt-12 space-y-0">
              {STEPS.map((step) => (
                <li
                  key={step.n}
                  className="border-border grid gap-3 border-t py-8 md:grid-cols-[5rem_1fr_1.4fr] md:gap-8 md:py-10"
                >
                  <span className="brand text-accent text-2xl">{step.n}</span>
                  <h3 className="brand text-ink flex items-center gap-2.5 text-2xl leading-none">
                    <span className="text-accent">{step.icon}</span>
                    {step.title}
                  </h3>
                  <p className="text-muted text-sm leading-relaxed sm:text-base">{step.body}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        <section id="desk" className="border-border bg-surface-raised border-t">
          <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6 sm:py-24">
            <p className="text-accent brand text-xs tracking-[0.16em]">The desk</p>
            <h2 className="brand text-ink mt-2 max-w-[18ch] text-3xl sm:text-4xl">
              Built for the call before the wheels turn
            </h2>
            <p className="text-muted mt-4 max-w-2xl text-sm leading-relaxed sm:text-base">
              Not a stormy brochure. A working surface: origin to destination, ranked runs, live
              map, leave-later hint, and a share link your team can reopen.
            </p>
            <ul className="mt-12 grid gap-x-10 gap-y-10 sm:grid-cols-2">
              {CAPABILITIES.map((item) => (
                <li key={item.title} className="border-accent/40 border-l-2 pl-4">
                  <h3 className="brand text-ink flex items-center gap-2 text-xl leading-none">
                    <span className="text-accent">{item.icon}</span>
                    {item.title}
                  </h3>
                  <p className="text-muted mt-3 text-sm leading-relaxed">{item.body}</p>
                </li>
              ))}
            </ul>
          </div>
        </section>

        <section className="border-border border-t">
          <div className="mx-auto grid max-w-6xl gap-12 px-4 py-20 sm:px-6 sm:py-24 lg:grid-cols-[1.1fr_0.9fr] lg:gap-16">
            <div>
              <p className="text-accent brand text-xs tracking-[0.16em]">Stack</p>
              <h2 className="brand text-ink mt-2 text-3xl sm:text-4xl">Open tools. Truck-first.</h2>
              <p className="text-muted mt-4 text-sm leading-relaxed sm:text-base">
                Weighcast pulls truck shapes from Valhalla on OpenStreetMap, samples Open-Meteo at
                checkpoint ETAs, and ranks by No Travel, severe miles, high miles, average risk,
                then duration. No proprietary map keys required to try it.
              </p>
            </div>
            <dl className="border-border divide-border divide-y border">
              {[
                ['Routing', 'Valhalla truck profiles (OSM)'],
                ['Weather', 'Open-Meteo hourly + geocode'],
                ['Map', 'MapLibre risk gradients + heatmap'],
                ['API', 'Django ASGI + Redis cache'],
              ].map(([k, v]) => (
                <div key={k} className="flex items-baseline justify-between gap-4 px-4 py-3.5">
                  <dt className="brand text-accent text-xs tracking-wide">{k}</dt>
                  <dd className="text-ink text-right text-sm">{v}</dd>
                </div>
              ))}
            </dl>
          </div>
        </section>

        <section className="border-border relative overflow-hidden border-t">
          <div
            className="landing-cta-glow pointer-events-none absolute inset-0"
            aria-hidden="true"
          />
          <div className="relative mx-auto max-w-6xl px-4 py-20 sm:px-6 sm:py-28">
            <h2 className="brand text-ink max-w-[16ch] text-3xl sm:text-5xl">
              Score the next run on the desk
            </h2>
            <p className="text-muted mt-4 max-w-lg text-sm sm:text-base">
              Set yard and destination, hit Score the runs, and read the ranking before the truck
              leaves the gate.
            </p>
            <Link
              to="/app"
              className="bg-accent text-surface brand focus-visible:outline-accent mt-8 inline-flex rounded-sm px-5 py-3 text-base tracking-wide hover:opacity-90 focus-visible:outline-2 focus-visible:outline-offset-2"
            >
              Open Weighcast
            </Link>
          </div>
        </section>
      </main>

      <footer className="border-border text-muted border-t py-8 text-sm">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 sm:px-6">
          <div className="flex items-center gap-2">
            <BrandMark className="size-6 border border-[color:var(--border)]" />
            <span className="brand text-ink text-sm">Weighcast</span>
          </div>
          <p>Weather-ranked truck routing. Forecasts are guidance, not a dispatch system.</p>
        </div>
      </footer>
    </div>
  )
}

function CorridorArt() {
  return (
    <svg className="h-full w-full" viewBox="0 0 1440 900" preserveAspectRatio="xMidYMid slice">
      <defs>
        <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="var(--landing-sky-top)" />
          <stop offset="55%" stopColor="var(--landing-sky-mid)" />
          <stop offset="100%" stopColor="var(--landing-sky-bottom)" />
        </linearGradient>
        <linearGradient id="road" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="var(--landing-road-a)" />
          <stop offset="50%" stopColor="var(--landing-road-b)" />
          <stop offset="100%" stopColor="var(--landing-road-a)" />
        </linearGradient>
        <linearGradient id="risk" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#3d9a5f" />
          <stop offset="35%" stopColor="#d4a017" />
          <stop offset="65%" stopColor="#d96a2f" />
          <stop offset="100%" stopColor="#c43c2c" />
        </linearGradient>
        <filter id="soft" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="18" />
        </filter>
      </defs>
      <rect width="1440" height="900" fill="url(#sky)" />
      <ellipse
        cx="1100"
        cy="180"
        rx="280"
        ry="120"
        fill="var(--landing-glow)"
        opacity="0.12"
        filter="url(#soft)"
      />
      <path
        d="M-40 720 C 280 560, 520 640, 760 520 S 1180 420, 1520 560 L 1520 940 L -40 940 Z"
        fill="url(#road)"
        opacity="0.85"
      />
      <path
        className="landing-risk-line"
        d="M-20 700 C 300 540, 540 620, 780 500 S 1200 400, 1500 540"
        fill="none"
        stroke="url(#risk)"
        strokeWidth="10"
        strokeLinecap="round"
      />
      <path
        d="M80 760 L 220 680 L 260 700 L 140 790 Z"
        fill="var(--landing-glow)"
        opacity="0.9"
        className="landing-cab"
      />
      <g opacity="0.4" stroke="var(--landing-mark)" strokeWidth="1.5">
        <path d="M420 180 v90 M380 225 h80" />
        <path d="M980 120 v70 M950 155 h60" />
      </g>
      <rect x="0" y="0" width="18" height="900" fill="var(--landing-glow)" opacity="0.95" />
    </svg>
  )
}
