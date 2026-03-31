export const IMG = {
  poster: (path: string | null, size: 'w342' | 'w500' = 'w342') =>
    path ? `https://image.tmdb.org/t/p/${size}${path}` : null,
  backdrop: (path: string | null) =>
    path ? `https://image.tmdb.org/t/p/w780${path}` : null,
  profile: (path: string | null) =>
    path ? `https://image.tmdb.org/t/p/w185${path}` : null,
}

export const GENRES: Record<number, string> = {
  10759: 'Action', 35: 'Comedy', 18: 'Drama', 10765: 'Sci-Fi',
  80: 'Crime', 9648: 'Mystery', 10751: 'Family', 16: 'Animation',
  10768: 'War', 37: 'Western', 99: 'Documentary', 10767: 'Talk',
}

async function apiFetch(endpoint: string, params: Record<string, string> = {}) {
  const url = new URL('/api/tmdb', window.location.origin)
  url.searchParams.set('endpoint', endpoint)
  Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v))
  const res = await fetch(url.toString())
  if (!res.ok) throw new Error(`API error ${res.status}`)
  return res.json()
}

export const api = {
  trending: () => apiFetch('/trending/tv/week'),
  popular: (genreId?: string) =>
    genreId && genreId !== 'all'
      ? apiFetch('/discover/tv', { with_genres: genreId, sort_by: 'popularity.desc' })
      : apiFetch('/tv/popular'),
  search: (query: string) => apiFetch('/search/tv', { query, include_adult: 'false' }),
  show: (id: number | string) => apiFetch(`/tv/${id}`, { append_to_response: 'credits' }),
  season: (showId: number | string, season: number) =>
    apiFetch(`/tv/${showId}/season/${season}`),
}
