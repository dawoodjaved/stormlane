export type LngLat = [number, number]

export function decodePolyline(encoded: string, precision = 6): LngLat[] {
  const factor = 10 ** precision
  let lat = 0
  let lon = 0
  let pos = 0
  const points: LngLat[] = []

  while (pos < encoded.length) {
    const latDelta = decodeValue(encoded, pos)
    pos = latDelta.next
    const lonDelta = decodeValue(encoded, pos)
    pos = lonDelta.next
    lat += latDelta.value
    lon += lonDelta.value
    points.push([lon / factor, lat / factor])
  }

  return points
}

function decodeValue(encoded: string, start: number): { value: number; next: number } {
  let shift = 0
  let result = 0
  let pos = start
  let chunk: number

  do {
    if (pos >= encoded.length) throw new Error('Polyline is truncated')
    chunk = encoded.charCodeAt(pos) - 63
    pos += 1
    result |= (chunk & 0x1f) << shift
    shift += 5
  } while (chunk >= 0x20)

  return { value: result & 1 ? ~(result >> 1) : result >> 1, next: pos }
}
