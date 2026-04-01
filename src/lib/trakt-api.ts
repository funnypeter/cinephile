export async function traktFetch<T>(
  endpoint: string,
  options?: { method?: string; body?: unknown; params?: Record<string, string> }
): Promise<T | null> {
  const url = new URL('/api/trakt', window.location.origin)
  url.searchParams.set('endpoint', endpoint)
  if (options?.params) {
    Object.entries(options.params).forEach(([k, v]) => url.searchParams.set(k, v))
  }

  const res = await fetch(url.toString(), {
    method: options?.method ?? 'GET',
    headers: options?.body ? { 'Content-Type': 'application/json' } : undefined,
    body: options?.body ? JSON.stringify(options.body) : undefined,
  })

  if (res.status === 401) return null
  if (!res.ok) throw new Error(`Trakt API error: ${res.status}`)
  return res.json()
}

export async function getTraktStatus(): Promise<{ connected: boolean; username?: string }> {
  const res = await fetch('/api/trakt/status')
  return res.json()
}
