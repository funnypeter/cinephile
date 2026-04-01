'use client'
import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useStore } from '@/lib/store'
import { apiFetch, IMG, GENRE_MAP } from '@/lib/api'
import { traktFetch } from '@/lib/trakt-api'
import type { TVShow, SearchResult } from '@/lib/types'

const TRENDING_TAGS = ['Breaking Bad','The Bear','Severance','Succession','House of the Dragon','The Last of Us','Shōgun','Andor','Silo','The Diplomat']

interface Suggestion { id: number; name: string; poster: string | null; year: string }

// Module-level cache — survives component remounts
const SUGGESTIONS_KEY = 'cinephile-suggestions'

function getCachedSuggestions(): Suggestion[] | null {
  try {
    const raw = sessionStorage.getItem(SUGGESTIONS_KEY)
    return raw ? JSON.parse(raw) : null
  } catch { return null }
}

function setCachedSuggestions(s: Suggestion[]) {
  try { sessionStorage.setItem(SUGGESTIONS_KEY, JSON.stringify(s)) } catch {}
}

export default function SearchPage() {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<TVShow[]>([])
  const [loading, setLoading] = useState(false)
  const [searched, setSearched] = useState(false)
  const timerRef = useRef<ReturnType<typeof setTimeout>>(undefined)

  const [addedIds, setAddedIds] = useState<Set<number>>(new Set())
  const [suggestions, setSuggestions] = useState<Suggestion[]>([])
  const [loadingSuggestions, setLoadingSuggestions] = useState(true)
  const [debugInfo, setDebugInfo] = useState('starting...')

  useEffect(() => {
    // Check sessionStorage first
    const cached = getCachedSuggestions()
    if (cached && cached.length > 0) {
      setSuggestions(cached)
      setLoadingSuggestions(false)
      setDebugInfo(`from cache: ${cached.length} items`)
      return
    }

    // Fetch from Trakt
    fetch('/api/trakt/status').then(r => r.json()).then(async (status) => {
      setDebugInfo(`status: ${JSON.stringify(status)}`)
      if (!status.connected) { setLoadingSuggestions(false); setDebugInfo('not connected'); return }

      const { diary } = useStore.getState()
      const loggedIds = new Set(diary.map((d: any) => d.showId))

      const history = await traktFetch<any[]>('/users/me/history/episodes', { params: { limit: '100' } })
      setDebugInfo(`history: ${history ? (Array.isArray(history) ? history.length + ' items' : typeof history) : 'null'}`)
      if (!history || !Array.isArray(history)) { setLoadingSuggestions(false); return }

      const showEpisodes = new Map<number, { show: any; episodes: Set<string> }>()
      let skippedLogged = 0
      for (const item of history) {
        const tmdbId = item.show?.ids?.tmdb
        if (!tmdbId) continue
        if (loggedIds.has(tmdbId)) { skippedLogged++; continue }
        if (!showEpisodes.has(tmdbId)) {
          showEpisodes.set(tmdbId, { show: item.show, episodes: new Set() })
        }
        const s = item.episode?.season
        const e = item.episode?.number
        if (s != null && e != null) showEpisodes.get(tmdbId)!.episodes.add(`${s}x${e}`)
      }

      setDebugInfo(`history: ${history.length} | logged-skip: ${skippedLogged} | unique shows: ${showEpisodes.size} | diary: ${diary.length}`)

      const candidates: Suggestion[] = []
      const debugRejects: string[] = []
      for (const [tmdbId, { show, episodes }] of showEpisodes) {
        try {
          const detail = await apiFetch<TVShow>(`/tv/${tmdbId}`)
          const totalSeasons = detail.number_of_seasons ?? 0
          if (totalSeasons === 0) { debugRejects.push(`${show.title}: 0 seasons`); continue }
          const latestSeason = await apiFetch<any>(`/tv/${tmdbId}/season/${totalSeasons}`)
          const today = new Date().toISOString().slice(0, 10)
          const airedEps = (latestSeason?.episodes ?? [])
            .filter((ep: any) => ep.air_date && ep.air_date <= today)
            .map((ep: any) => ({ season: totalSeasons, number: ep.episode_number }))
          const last3 = airedEps.slice(-3)
          const match = last3.some((ep: any) => episodes.has(`${ep.season}x${ep.number}`))
          if (match) {
            candidates.push({ id: tmdbId, name: show.title, poster: detail.poster_path, year: String(show.year ?? '') })
          } else {
            debugRejects.push(`${show.title}: last3aired=[${last3.map((e: any) => `${e.season}x${e.number}`)}] watched=[${Array.from(episodes).slice(0,5)}]`)
          }
        } catch (e) { debugRejects.push(`${show.title}: error ${e}`) }
        if (candidates.length >= 8) break
      }

      setDebugInfo(`shows: ${showEpisodes.size} | candidates: ${candidates.length} | rejects: ${debugRejects.join(' // ')}`)

      setCachedSuggestions(candidates)
      setSuggestions(candidates)
      setLoadingSuggestions(false)
    }).catch(() => setLoadingSuggestions(false))
  }, [])

  function handleInput(val: string) {
    setQuery(val)
    clearTimeout(timerRef.current)
    if (!val.trim()) { setSearched(false); setResults([]); return }
    setLoading(true)
    setSearched(true)
    timerRef.current = setTimeout(() => doSearch(val.trim()), 380)
  }

  async function doSearch(q: string) {
    try {
      const data = await apiFetch<SearchResult>('/search/tv', { query: q, include_adult: 'false' })
      setResults(data.results?.slice(0, 20) ?? [])
    } finally {
      setLoading(false)
    }
  }

  function handleAdd(show: Suggestion) {
    if (addedIds.has(show.id)) return
    useStore.getState().addDiaryEntry({
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

  return (
    <div>
      <header className="sticky top-0 z-40 glass shadow-[0px_8px_32px_rgba(0,0,0,0.5)]">
        <div className="flex items-center gap-3 px-5 h-14 max-w-md mx-auto">
          <Link href="/" className="p-1.5 hover:bg-surface-container-high rounded-full">
            <span className="material-symbols-outlined text-on-surface-variant" style={{fontSize:20}}>arrow_back_ios_new</span>
          </Link>
          <div className="flex-1 flex items-center gap-2 bg-surface-container-lowest rounded-xl px-3 py-2 focus-within:ring-1 focus-within:ring-primary/30">
            <span className="material-symbols-outlined text-outline" style={{fontSize:18}}>search</span>
            <input
              type="text"
              value={query}
              placeholder="Search TV shows..."
              className="flex-1 bg-transparent text-on-surface text-sm placeholder:text-outline outline-none font-body"
              onChange={e => handleInput(e.target.value)}
            />
            {query && (
              <button onClick={() => handleInput('')}>
                <span className="material-symbols-outlined text-outline" style={{fontSize:16}}>close</span>
              </button>
            )}
          </div>
        </div>
      </header>

      <div className="px-5 pt-5">
        {/* Debug */}
        <div className="mb-3 p-2 bg-surface-container-high rounded text-[10px] font-mono text-on-surface-variant">
          {debugInfo} | suggestions: {suggestions.length} | loading: {String(loadingSuggestions)}
        </div>

        {suggestions.length > 0 && (
          <div className="mb-6">
            <p className="text-[10px] font-bold tracking-widest uppercase text-primary font-label mb-3">Recently Watched — Add to Watchlist?</p>
            <div className="space-y-2">
              {suggestions.map((s) => {
                const added = addedIds.has(s.id)
                const p = IMG.poster(s.poster)
                return (
                  <div key={s.id} className="flex items-center gap-3 p-3 bg-surface-container-low rounded-xl">
                    <Link href={`/show/${s.id}`} className="flex items-center gap-3 flex-1 min-w-0">
                      <div className="w-10 h-14 rounded-lg overflow-hidden bg-surface-container-high flex-none">
                        {p
                          ? <Image src={p} alt={s.name} width={40} height={56} className="w-full h-full object-cover"/>
                          : <div className="w-full h-full flex items-center justify-center"><span className="material-symbols-outlined text-outline" style={{fontSize:14}}>movie</span></div>}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-headline font-semibold text-on-surface truncate">{s.name}</p>
                        <p className="text-[10px] text-on-surface-variant font-label">{s.year}</p>
                      </div>
                    </Link>
                    <button
                      onClick={() => handleAdd(s)}
                      disabled={added}
                      className={`w-10 h-10 rounded-full flex items-center justify-center flex-none transition-all ${
                        added ? 'bg-primary/20' : 'bg-surface-container-high active:scale-90'
                      }`}>
                      <span className={`material-symbols-outlined ${added ? 'fill-icon text-primary' : 'text-on-surface-variant'}`} style={{fontSize:20}}>
                        {added ? 'check_circle' : 'add_circle'}
                      </span>
                    </button>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {loadingSuggestions && (
          <div className="mb-6">
            <p className="text-[10px] font-bold tracking-widest uppercase text-primary font-label mb-3">Recently Watched</p>
            <div className="space-y-2">
              {[...Array(3)].map((_, i) => <div key={i} className="skeleton h-[68px]" />)}
            </div>
          </div>
        )}

        {!searched ? (
          <div>
            <p className="text-[10px] font-bold tracking-widest uppercase text-on-surface-variant font-label mb-3">Trending Searches</p>
            <div className="flex flex-wrap gap-2">
              {TRENDING_TAGS.map(tag => (
                <button
                  key={tag}
                  onClick={() => handleInput(tag)}
                  className="px-3 py-1.5 bg-surface-container-high text-on-surface-variant text-xs font-label rounded-full hover:bg-surface-container-highest transition-colors"
                >
                  {tag}
                </button>
              ))}
            </div>
          </div>
        ) : loading ? (
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => <div key={i} className="skeleton h-20" />)}
          </div>
        ) : results.length === 0 ? (
          <div className="text-center py-16">
            <span className="material-symbols-outlined text-outline text-5xl">search_off</span>
            <p className="text-on-surface-variant font-label text-sm mt-3">No results for &ldquo;{query}&rdquo;</p>
          </div>
        ) : (
          <div className="space-y-2 fade-in">
            {results.map(show => {
              const poster = IMG.poster(show.poster_path)
              const genre = show.genre_ids?.[0] ? GENRE_MAP[show.genre_ids[0]] : ''
              const year = (show.first_air_date || '').slice(0, 4)
              return (
                <Link key={show.id} href={`/show/${show.id}`}
                  className="flex gap-3 p-3 bg-surface-container-low rounded-xl hover:bg-surface-container-high transition-colors active:scale-[0.98]">
                  <div className="relative w-12 h-16 rounded-lg overflow-hidden bg-surface-container-high flex-none">
                    {poster
                      ? <Image src={poster} alt={show.name} fill className="object-cover" sizes="48px"/>
                      : <div className="w-full h-full flex items-center justify-center"><span className="material-symbols-outlined text-outline" style={{fontSize:18}}>movie</span></div>}
                  </div>
                  <div className="flex-1 min-w-0 py-0.5">
                    <p className="font-headline font-semibold text-on-surface text-sm truncate">{show.name}</p>
                    <p className="text-[11px] text-on-surface-variant font-label mt-0.5">{[year, genre].filter(Boolean).join(' · ')}</p>
                    {show.vote_average > 0 && (
                      <div className="flex items-center gap-1 mt-1.5">
                        <span className="material-symbols-outlined fill-icon text-tertiary" style={{fontSize:11}}>star</span>
                        <span className="text-[11px] font-bold font-headline text-on-surface">{show.vote_average.toFixed(1)}</span>
                      </div>
                    )}
                  </div>
                  <span className="material-symbols-outlined text-on-surface-variant self-center flex-none" style={{fontSize:18}}>chevron_right</span>
                </Link>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
