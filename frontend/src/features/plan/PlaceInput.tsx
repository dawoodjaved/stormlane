import { useQuery } from '@tanstack/react-query'
import { useId, useState, type KeyboardEvent } from 'react'

import { geocode, type Place } from '../../lib/api.ts'
import { useDebouncedValue } from '../../lib/useDebouncedValue.ts'

const MIN_QUERY_LENGTH = 3

interface Props {
  label: string
  placeholder: string
  value: Place | null
  onChange: (place: Place | null) => void
}

export function PlaceInput({ label, placeholder, value, onChange }: Props) {
  const inputId = useId()
  const listId = useId()
  const [text, setText] = useState(value?.name ?? '')
  const [open, setOpen] = useState(false)
  const [active, setActive] = useState(-1)

  const trimmed = text.trim()
  const query = useDebouncedValue(trimmed, 250)
  const searching = open && trimmed.length >= MIN_QUERY_LENGTH && trimmed !== value?.name
  const {
    data: places = [],
    isFetching,
    isError,
  } = useQuery({
    queryKey: ['geocode', query],
    queryFn: ({ signal }) => geocode(query, signal),
    enabled: searching && query === trimmed,
    staleTime: 5 * 60_000,
  })

  const waiting = isFetching || query !== trimmed
  const showList = searching

  function select(place: Place) {
    onChange(place)
    setText(place.name)
    setOpen(false)
    setActive(-1)
  }

  function onKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault()
      setOpen(true)
      if (places.length === 0) return
      const step = event.key === 'ArrowDown' ? 1 : -1
      setActive((current) => (current + step + places.length) % places.length)
    } else if (event.key === 'Enter' && showList && places[active]) {
      event.preventDefault()
      select(places[active])
    } else if (event.key === 'Escape') {
      setOpen(false)
    }
  }

  return (
    <div className="relative">
      <label htmlFor={inputId} className="text-muted mb-1.5 block text-sm font-medium">
        {label}
      </label>
      <input
        id={inputId}
        type="text"
        role="combobox"
        autoComplete="off"
        autoCapitalize="off"
        spellCheck={false}
        enterKeyHint="search"
        aria-autocomplete="list"
        aria-expanded={showList}
        aria-controls={listId}
        aria-activedescendant={active >= 0 ? `${listId}-${String(active)}` : undefined}
        placeholder={placeholder}
        value={text}
        onChange={(event) => {
          setText(event.target.value)
          setOpen(true)
          setActive(-1)
          if (value) onChange(null)
        }}
        onFocus={() => {
          setOpen(true)
        }}
        onBlur={() => {
          setOpen(false)
        }}
        onKeyDown={onKeyDown}
        className="field"
      />
      {showList && (
        <ul
          id={listId}
          role="listbox"
          aria-label={`${label} suggestions`}
          className="border-border bg-surface-raised absolute z-20 mt-1 max-h-64 w-full overflow-auto rounded-lg border py-1 shadow-xl"
        >
          {waiting && <li className="text-muted px-3 py-2 text-sm">Searching…</li>}
          {!waiting && isError && (
            <li className="text-risk-severe px-3 py-2 text-sm">Search is unavailable.</li>
          )}
          {!waiting && !isError && places.length === 0 && (
            <li className="text-muted px-3 py-2 text-sm">No matches</li>
          )}
          {!waiting &&
            places.map((place, index) => (
              <li
                key={`${place.name}-${String(place.lat)}-${String(place.lon)}`}
                id={`${listId}-${String(index)}`}
                role="option"
                aria-selected={index === active}
                onMouseDown={(event) => {
                  event.preventDefault()
                }}
                onClick={() => {
                  select(place)
                }}
                className="aria-selected:bg-accent/20 hover:bg-hover text-ink cursor-pointer px-3 py-2 text-sm"
              >
                {place.name}
              </li>
            ))}
        </ul>
      )}
    </div>
  )
}
