interface Props {
  className?: string
  title?: string
}

/** Truck + scale mark — load weight is part of the risk story. */
export function BrandMark({ className = 'size-8', title = 'Weighcast' }: Props) {
  return (
    <svg
      className={className}
      viewBox="0 0 64 64"
      role="img"
      aria-label={title}
      xmlns="http://www.w3.org/2000/svg"
    >
      <rect width="64" height="64" className="fill-surface" />
      <rect x="0" y="0" width="6" height="64" className="fill-accent" />
      <path d="M14 42h23l5.5-9H50v16H14z" className="fill-ink" />
      <circle cx="22" cy="50" r="3.5" className="fill-surface" />
      <circle cx="41" cy="50" r="3.5" className="fill-surface" />
      <path
        d="M32 10v8M22 28h20M22 28l10-10 10 10"
        className="stroke-accent"
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
      <circle cx="22" cy="30" r="2.6" className="fill-accent" />
      <circle cx="42" cy="30" r="2.6" className="fill-accent" />
    </svg>
  )
}
