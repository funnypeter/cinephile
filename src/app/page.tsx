import { tmdbFetch } from '@/lib/tmdb'
import type { TVShow, SearchResult } from '@/lib/types'
import HomeClient from '@/components/HomeClient'

export default async function HomePage() {
  const [trending, popular] = await Promise.all([
    tmdbFetch<SearchResult>('/trending/tv/week').catch(() => null),
    tmdbFetch<SearchResult>('/tv/popular').catch(() => null),
  ])

  return (
    <HomeClient
      trendingShows={trending?.results?.slice(0, 10) ?? []}
      popularShows={popular?.results?.slice(0, 6) ?? []}
    />
  )
}
