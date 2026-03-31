export async function apiFetch<T>(endpoint: string, params: Record<string, string> = {}): Promise<T> {
  const url = new URL('/api/tmdb', window.location.origin)
  url.searchParams.set('endpoint', endpoint)
  Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v))
  const res = await fetch(url.toString())
  if (!res.ok) throw new Error(`API error ${res.status}`)
  return res.json()
}

export const IMG = {
  poster: (path: string | null | undefined, size = 'w500') =>
    path ? `https://image.tmdb.org/t/p/${size}${path}` : null,
  backdrop: (path: string | null | undefined, size = 'w1280') =>
    path ? `https://image.tmdb.org/t/p/${size}${path}` : null,
}

export const GENRE_MAP: Record<number, string> = {
  10759: 'Action', 35: 'Comedy', 18: 'Drama', 10765: 'Sci-Fi',
  80: 'Crime', 9648: 'Mystery', 10751: 'Family', 16: 'Animation',
  10768: 'War', 37: 'Western', 99: 'Documentary',
}
