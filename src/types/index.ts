export interface TMDBShow {
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
  credits?: { cast: TMDBCastMember[] }
}

export interface TMDBCastMember {
  id: number
  name: string
  character: string
  profile_path: string | null
}

export interface TMDBEpisode {
  id: number
  name: string
  overview: string
  episode_number: number
  season_number: number
  still_path: string | null
  runtime: number | null
  air_date: string
}

export interface TMDBSeason {
  id: number
  name: string
  season_number: number
  episode_count: number
  episodes: TMDBEpisode[]
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

export interface WatchlistItem {
  id: number
  name: string
  poster: string | null
  year: string
}
