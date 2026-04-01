'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useStore, useWatchlist } from '@/lib/store'
import { apiFetch, IMG, GENRE_MAP } from '@/lib/api'
import type { TVShow, SearchResult } from '@/lib/types'
import { traktFetch } from '@/lib/trakt-api'

const GENRES = [
  { id: 'all', label: 'All' },
  { id: '10759', label: 'Action' },
  { id: '35', label: 'Comedy' },
  { id: '18', label: 'Drama' },
  { id: '10765', label: 'Sci-Fi' },
  { id: '80', label: 'Crime' },
  { id: '9648', label: 'Mystery' },
  { id: '16', label: 'Animation' },
]

export default function HomeClient() {
  const [trendingShows, setTrendingShows] = useState<TVShow[]>([])
  const [popularShows, setPopularShows] = useState<TVShow[]>([])
  const [selectedGenre, setSelectedGenre] = useState('all')
  const [loadingTrending, setLoadingTrending] = useState(true)
  const [loadingPopular, setLoadingPopular] = useState(true)
  const watchlist = useWatchlist()
  const diary = useStore((s) => s.diary)
  const addDiaryEntry = useStore((s) => s.addDiaryEntry)
  const traktConnected = useStore((s) => s.trakt.connected)
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [suggestions, setSuggestions] = useState<{ id: number; name: string; poster: string | null; year: string }[]>([])
  const [loadingSuggestions, setLoadingSuggestions] = useState(false)
  const [addedIds, setAddedIds] = useState<Set<number>>(new Set())

  const ratings = diary.filter(d => d.rating > 0).map(d => d.rating)
  const avgRating = ratings.length
    ? (ratings.reduce((a, b) => a + b, 0) / ratings.length).toFixed(1)
    : null

  useEffect(() => {
    apiFetch<SearchResult>('/trending/tv/week')
      .then(d => setTrendingShows(d.results?.slice(0, 10) ?? []))
      .catch(() => {})
      .finally(() => setLoadingTrending(false))

    apiFetch<SearchResult>('/tv/popular')
      .then(d => setPopularShows(d.results?.slice(0, 6) ?? []))
      .catch(() => {})
      .finally(() => setLoadingPopular(false))
  }, [])

  const loggedShowIds = new Set(diary.map((d) => d.showId))

  async function handleAddShow() {
    if (showSuggestions) { setShowSuggestions(false); return }
    setShowSuggestions(true)
    setLoadingSuggestions(true)
    try {
      const twoWeeksAgo = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString()

      if (traktConnected) {
        // Fetch recent episode watches from Trakt
        const history = await traktFetch<any[]>('/users/me/history/episodes', {
          params: { start_at: twoWeeksAgo, limit: '50' },
        })
        if (history) {
          const showMap = new Map<number, { id: number; name: string; poster: string | null; year: string }>()
          for (const item of history) {
            const tmdbId = item.show?.ids?.tmdb
            if (!tmdbId || loggedShowIds.has(tmdbId) || showMap.has(tmdbId)) continue
            showMap.set(tmdbId, {
              id: tmdbId,
              name: item.show.title,
              poster: null,
              year: String(item.show.year ?? ''),
            })
          }
          // Fetch posters from TMDB for each suggestion
          const shows = Array.from(showMap.values())
          const withPosters = await Promise.all(
            shows.slice(0, 10).map(async (s) => {
              try {
                const detail = await apiFetch<TVShow>(`/tv/${s.id}`)
                return { ...s, poster: detail.poster_path }
              } catch { return s }
            })
          )
          setSuggestions(withPosters)
        }
      } else {
        // No Trakt — suggest from TMDB airing today, filtered by what's not logged
        const data = await apiFetch<SearchResult>('/tv/on_the_air')
        const filtered = (data.results ?? [])
          .filter((s) => !loggedShowIds.has(s.id))
          .slice(0, 10)
          .map((s) => ({ id: s.id, name: s.name, poster: s.poster_path, year: (s.first_air_date || '').slice(0, 4) }))
        setSuggestions(filtered)
      }
    } catch {
      setSuggestions([])
    } finally {
      setLoadingSuggestions(false)
    }
  }

  function handleToggleAdd(show: { id: number; name: string; poster: string | null; year: string }) {
    if (addedIds.has(show.id)) return
    addDiaryEntry({
      showId: show.id,
      showName: show.name,
      poster: show.poster,
      year: show.year,
      rating: 0,
      review: '',
      spoiler: false,
    })
    setAddedIds((prev) => new Set(prev).add(show.id))
  }

  async function handleGenre(id: string) {
    setSelectedGenre(id)
    setLoadingPopular(true)
    try {
      if (id === 'all') {
        const data = await apiFetch<SearchResult>('/tv/popular')
        setPopularShows(data.results?.slice(0, 6) ?? [])
      } else {
        const data = await apiFetch<SearchResult>('/discover/tv', {
          with_genres: id,
          sort_by: 'popularity.desc',
        })
        setPopularShows(data.results?.slice(0, 6) ?? [])
      }
    } finally {
      setLoadingPopular(false)
    }
  }

  return (
    <div>
      <header className="sticky top-0 z-40 glass shadow-[0px_8px_32px_rgba(0,0,0,0.5)]">
        <div className="flex justify-between items-center px-5 h-14 max-w-md mx-auto">
          <span className="text-xl font-headline font-bold tracking-tighter text-on-surface">Cinephile</span>
          <Link href="/search" className="p-2 hover:bg-surface-container-high rounded-full transition-colors">
            <span className="material-symbols-outlined text-on-surface-variant" style={{fontSize:22}}>search</span>
          </Link>
        </div>
      </header>

      <section className="pt-6 pb-2">
        <div className="px-5 flex items-end justify-between mb-4">
          <div>
            <p className="text-[10px] font-bold tracking-widest uppercase text-primary font-label">Cinema Spotlight</p>
            <h2 className="text-2xl font-headline font-bold tracking-tight">Trending Shows</h2>
          </div>
        </div>
        <div className="flex gap-3 px-5 overflow-x-auto pb-3">
          {loadingTrending
            ? [...Array(5)].map((_, i) => <div key={i} className="flex-none w-36 h-52 skeleton" />)
            : trendingShows.map(show => {
                const poster = IMG.poster(show.poster_path)
                return (
                  <Link key={show.id} href={`/show/${show.id}`} className="flex-none w-36 group">
                    <div className="relative w-36 h-52 rounded-2xl overflow-hidden bg-surface-container-high">
                      {poster
                        ? <Image src={poster} alt={show.name} fill className="object-cover group-hover:scale-105 transition-transform duration-300" sizes="144px" />
                        : <div className="w-full h-full flex items-center justify-center"><span className="material-symbols-outlined text-outline">movie</span></div>}
                      <div className="absolute bottom-2 left-2 flex items-center gap-1 bg-surface-container-highest/90 rounded-full px-2 py-0.5">
                        <span className="material-symbols-outlined fill-icon text-tertiary" style={{fontSize:11}}>star</span>
                        <span className="text-[10px] font-bold font-headline text-on-surface">{(show.vote_average||0).toFixed(1)}</span>
                      </div>
                    </div>
                    <p className="mt-1.5 text-xs font-headline font-semibold text-on-surface truncate">{show.name}</p>
                    <p className="text-[10px] text-on-surface-variant font-label">
                      {show.genre_ids?.[0] ? GENRE_MAP[show.genre_ids[0]] : ''} · {(show.first_air_date||'').slice(0,4)}
                    </p>
                  </Link>
                )
              })}
        </div>
      </section>

      <section className="px-5 pt-4 pb-2">
        <div className="flex gap-2 overflow-x-auto pb-1">
          {GENRES.map(g => (
            <button key={g.id} onClick={() => handleGenre(g.id)}
              className={`flex-none px-4 py-1.5 text-xs font-bold font-label uppercase tracking-wide rounded-full transition-colors ${selectedGenre === g.id ? 'bg-secondary-container text-on-secondary-container' : 'bg-surface-container-high text-on-surface-variant'}`}>
              {g.label}
            </button>
          ))}
        </div>
      </section>

      <section className="px-5 pt-4">
        <h2 className="text-xl font-headline font-bold tracking-tight mb-4">Popular Now</h2>
        {loadingPopular ? (
          <div className="grid grid-cols-2 gap-3">
            {[...Array(6)].map((_, i) => <div key={i} className="skeleton aspect-[2/3]" />)}
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {popularShows.map(show => {
              const poster = IMG.poster(show.poster_path)
              return (
                <Link key={show.id} href={`/show/${show.id}`} className="block group">
                  <div className="relative w-full aspect-[2/3] rounded-2xl overflow-hidden bg-surface-container-high">
                    {poster
                      ? <Image src={poster} alt={show.name} fill className="object-cover group-hover:scale-105 transition-transform duration-300" sizes="50vw"/>
                      : <div className="w-full h-full flex items-center justify-center"><span className="material-symbols-outlined text-outline text-3xl">movie</span></div>}
                    <div className="absolute top-2 right-2 flex items-center gap-0.5 bg-surface/80 backdrop-blur rounded-full px-1.5 py-0.5">
                      <span className="material-symbols-outlined fill-icon text-tertiary" style={{fontSize:10}}>star</span>
                      <span className="text-[9px] font-bold font-headline text-on-surface">{(show.vote_average||0).toFixed(1)}</span>
                    </div>
                  </div>
                  <p className="mt-1.5 text-xs font-headline font-semibold text-on-surface truncate">{show.name}</p>
                  <p className="text-[10px] text-on-surface-variant font-label">{(show.first_air_date||'').slice(0,4)}</p>
                </Link>
              )
            })}
          </div>
        )}
      </section>

      <section className="px-5 pt-8">
        <div className="flex items-end justify-between mb-4">
          <h2 className="text-xl font-headline font-bold tracking-tight">Your Watchlist</h2>
          <Link href="/lists" className="text-primary text-xs font-bold font-headline uppercase tracking-wide">View All →</Link>
        </div>
        <div className="flex gap-3 overflow-x-auto pb-3">
          <button onClick={handleAddShow} className="flex-none flex flex-col items-center justify-center w-28 h-40 bg-surface-container-low rounded-2xl border border-dashed border-outline-variant gap-2">
            <span className="material-symbols-outlined text-outline text-3xl">{showSuggestions ? 'close' : 'add'}</span>
            <span className="text-[10px] text-outline font-label uppercase tracking-wide">{showSuggestions ? 'Close' : 'Add Show'}</span>
          </button>
          {watchlist.slice(0, 6).map(w => {
            const p = IMG.poster(w.poster)
            return (
              <Link key={w.showId} href={`/show/${w.showId}`} className="flex-none w-28 group">
                <div className="relative w-28 h-40 rounded-2xl overflow-hidden bg-surface-container-high">
                  {p ? <Image src={p} alt={w.showName} fill className="object-cover" sizes="112px"/> : <div className="w-full h-full flex items-center justify-center"><span className="material-symbols-outlined text-outline">movie</span></div>}
                </div>
                <p className="mt-1 text-[10px] font-label text-on-surface-variant truncate">{w.showName}</p>
              </Link>
            )
          })}
        </div>

        {/* Suggestions panel */}
        {showSuggestions && (
          <div className="mt-4 slide-up">
            <p className="text-[10px] font-bold tracking-widest uppercase text-primary font-label mb-3">
              {traktConnected ? 'Recently Watched on Trakt' : 'Currently Airing'}
            </p>
            {loadingSuggestions ? (
              <div className="space-y-2">
                {[...Array(3)].map((_, i) => <div key={i} className="skeleton h-14" />)}
              </div>
            ) : suggestions.length === 0 ? (
              <p className="text-sm text-on-surface-variant font-label py-4 text-center">No new suggestions found</p>
            ) : (
              <div className="space-y-2">
                {suggestions.map((s) => {
                  const added = addedIds.has(s.id) || loggedShowIds.has(s.id)
                  const p = IMG.poster(s.poster)
                  return (
                    <div key={s.id} className="flex items-center gap-3 p-3 bg-surface-container-low rounded-xl">
                      <div className="w-10 h-14 rounded-lg overflow-hidden bg-surface-container-high flex-none">
                        {p
                          ? <Image src={p} alt={s.name} width={40} height={56} className="w-full h-full object-cover"/>
                          : <div className="w-full h-full flex items-center justify-center"><span className="material-symbols-outlined text-outline" style={{fontSize:14}}>movie</span></div>}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-headline font-semibold text-on-surface truncate">{s.name}</p>
                        <p className="text-[10px] text-on-surface-variant font-label">{s.year}</p>
                      </div>
                      <button
                        onClick={() => handleToggleAdd(s)}
                        disabled={added}
                        className={`w-10 h-10 rounded-full flex items-center justify-center flex-none transition-colors ${
                          added
                            ? 'bg-primary/20'
                            : 'bg-surface-container-high active:scale-95'
                        }`}>
                        <span className={`material-symbols-outlined ${added ? 'fill-icon text-primary' : 'text-on-surface-variant'}`} style={{fontSize:20}}>
                          {added ? 'check_circle' : 'add_circle'}
                        </span>
                      </button>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )}
      </section>

      <section className="px-5 pt-6 pb-8">
        <div className="bg-surface-container-low rounded-2xl p-5" style={{borderLeft:'3px solid #a4e6ff'}}>
          <p className="text-[10px] font-bold tracking-widest uppercase text-primary font-label mb-3">Your Week in TV</p>
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center">
              <p className="text-2xl font-headline font-bold text-on-surface">{diary.length}</p>
              <p className="text-[10px] text-on-surface-variant uppercase tracking-wide font-label">Logged</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-headline font-bold text-on-surface">{Math.floor(diary.length * 45 / 60)}h</p>
              <p className="text-[10px] text-on-surface-variant uppercase tracking-wide font-label">Runtime</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-headline font-bold text-tertiary">{avgRating ? `★ ${avgRating}` : '—'}</p>
              <p className="text-[10px] text-on-surface-variant uppercase tracking-wide font-label">Avg Rating</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
