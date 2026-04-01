export interface TVShow {
  id: number
  name: string
  overview: string
  poster_path: string | null
  backdrop_path: string | null
  first_air_date: string
  vote_average: number
  vote_count: number
  genre_ids?: number[]
  genres?: { id: number; name: string }[]
  number_of_seasons?: number
  number_of_episodes?: number
  status?: string
  networks?: { id: number; name: string; logo_path: string | null }[]
  credits?: { cast: CastMember[] }
}

export interface CastMember {
  id: number
  name: string
  character: string
  profile_path: string | null
}

export interface Episode {
  id: number
  name: string
  overview: string
  episode_number: number
  season_number: number
  air_date: string
  runtime: number | null
  still_path: string | null
  vote_average: number
}

export interface Season {
  id: number
  name: string
  season_number: number
  episode_count: number
  episodes: Episode[]
  poster_path: string | null
}

export interface SearchResult {
  results: TVShow[]
  total_results: number
  total_pages: number
  page: number
}

export interface DiaryEntry {
  id: string
  showId: number
  showName: string
  poster: string | null
  year: string
  rating: number
  review: string
  spoiler: boolean
  date: string
}