export function apiUrl(path: string, base: string = import.meta.env.VITE_API_URL ?? ''): string {
  const trimmedBase = base.replace(/\/+$/, '')
  const normalizedPath = path.startsWith('/') ? path : `/${path}`
  return `${trimmedBase}${normalizedPath}`
}
