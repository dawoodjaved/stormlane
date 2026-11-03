import type { SVGProps } from 'react'

type IconProps = SVGProps<SVGSVGElement>

function base(props: IconProps) {
  const { className, ...rest } = props
  return {
    className: className ?? 'size-4 shrink-0',
    fill: 'none' as const,
    stroke: 'currentColor',
    strokeWidth: 1.75,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
    'aria-hidden': true as const,
    ...rest,
  }
}

export function IconTruck(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" {...base(props)}>
      <path d="M3 7.5h9.5V15H3z" />
      <path d="M12.5 10h4.2l2.3 3V15H12.5z" />
      <circle cx="7" cy="16.5" r="1.6" />
      <circle cx="16.5" cy="16.5" r="1.6" />
      <path d="M3 15h1.2M18.5 15H21" />
    </svg>
  )
}

export function IconCloud(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" {...base(props)}>
      <path d="M7.5 17.5h10a3.5 3.5 0 0 0 .4-7 5 5 0 0 0-9.6-1.2A3.8 3.8 0 0 0 7.5 17.5z" />
    </svg>
  )
}

export function IconWind(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" {...base(props)}>
      <path d="M3 9h11a2.5 2.5 0 1 0-2.5-2.5" />
      <path d="M3 13h14a2.5 2.5 0 1 1-2.5 2.5" />
      <path d="M3 17h7" />
    </svg>
  )
}

export function IconPin(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" {...base(props)}>
      <path d="M12 21s6-5.2 6-10a6 6 0 1 0-12 0c0 4.8 6 10 6 10z" />
      <circle cx="12" cy="11" r="2" />
    </svg>
  )
}

export function IconClock(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" {...base(props)}>
      <circle cx="12" cy="12" r="8" />
      <path d="M12 8v4.5l3 1.5" />
    </svg>
  )
}

export function IconWeight(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" {...base(props)}>
      <path d="M8 8.5h8l1.5 11H6.5z" />
      <path d="M10 8.5a2 2 0 1 1 4 0" />
      <path d="M9.5 13h5" />
    </svg>
  )
}

export function IconRuler(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" {...base(props)}>
      <path d="M4 8.5h16v7H4z" />
      <path d="M8 8.5v3M12 8.5v4.5M16 8.5v3" />
    </svg>
  )
}

export function IconSwap(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" {...base(props)}>
      <path d="M7 7h11l-2.5-2.5M17 17H6l2.5 2.5" />
      <path d="M18 7v4M6 17v-4" />
    </svg>
  )
}

export function IconLocate(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" {...base(props)}>
      <circle cx="12" cy="12" r="3.5" />
      <path d="M12 3.5v2.5M12 18v2.5M3.5 12H6M18 12h2.5" />
    </svg>
  )
}

export function IconGate(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" {...base(props)}>
      <path d="M5 19V6.5a1 1 0 0 1 1-1h12a1 1 0 0 1 1 1V19" />
      <path d="M5 19h14M9 10.5h6M9 14h6" />
    </svg>
  )
}

export function IconShare(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" {...base(props)}>
      <circle cx="18" cy="6" r="2.2" />
      <circle cx="6" cy="12" r="2.2" />
      <circle cx="18" cy="18" r="2.2" />
      <path d="M8 11.2 16 7.3M8 12.8l8 3.9" />
    </svg>
  )
}
