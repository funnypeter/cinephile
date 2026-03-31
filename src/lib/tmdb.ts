const TMDB_BASE = 'https://api.themoviedb.org/3'

function getKey() {
  const key = process.env.TMDB_API_KEY
  if (!key) throw new Error('TMDB_API_KEY is not set in .env.local')
  return key
}

async function tmdb<T>(endpoint: string, params: Record<string, string> = {}): Promise<T> {
  const url = new URL(TMDB_BASE + endpoint)
  url.searchParams.set('api_key', getKey())
  Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v))
  const res = await fetch(url.toString(), { next: { revalidate: 3600 } })
  if (!res.ok) throw new Error(`TMDB ${res.status}: ${endpoint}`)
  return res.json()
}

export const IMG = {
  poster: (path: string | null, size: 'w342' | 'w500' = 'w342') =>
    path ? `https://image.tmdb.org/t/p/${size}${path}` : null,
  backdrop: (path: string | null) =>
    path ? `https://image.tmdb.org/t/p/w780${path}` : null,
  profile: (path: string | null) =>
    path ? `https://image.tmdb.org/t/p/w185${path}` : null,
}

export async function getTrending() {
  return tmdb<{ results: any[] }>('/trending/tv/week')
}

export async function getPopular(genreId?: string) {
  if (genreId && genreId !== 'all') {
    return tmdb<{ results: any[] }>('/discover/tv', {
      with_genres: genreId,
      sort_by: 'popularity.desc',
    })
  }
  return tmdb<{ results: any[] }>('/tv/popular')
}

export async function searchShows(query: string) {
  return tmdb<{ results: any[] }>('/search/tv', {
    query,
    include_adult: 'false',
  })
}

export async function getShow(id: string) {
  return tmdb<any>(`/tv/${id}`, {
    append_to_response: 'credits',
  })
}

export async function getSeason(showId: string, season: number) {
  return tmdb<any>(`/tv/${showId}/season/${season}`)
}
