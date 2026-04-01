'use client'
import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { useStore } from '@/lib/store'
import { apiFetch, IMG } from '@/lib/api'
import type { TVShow, Season } from '@/lib/types'

interface Props { show: TVShow }

export default function ShowClient({ show }: Props) {
  const router = useRouter()
  const addToWatchlist = useStore((s) => s.addToWatchlist)
  const removeFromWatchlist = useStore((s) => s.removeFromWatchlist)
  const inWatchlist = useStore((s) => s.watchlist.some((w) => w.id === show.id))
  const [activeSeason, setActiveSeason] = useState(1)
  const [season, setSeason] = useState<Season | null>(null)
  const [loadingEps, setLoadingEps] = useState(false)

  const backdrop = IMG.backdrop(show.backdrop_path) ?? IMG.poster(show.poster_path, 'w780')
  const cast = show.credits?.cast?.slice(0, 6) ?? []
  const seasons = show.number_of_seasons ?? 0

  async function loadSeason(n: number) {
    setActiveSeason(n)
    setLoadingEps(true)
    try {
      const data = await apiFetch<Season>(`/tv/${show.id}/season/${n}`)
      setSeason(data)
    } finally {
      setLoadingEps(false)
    }
  }

  // Load season 1 on mount
  useState(() => { if (seasons > 0) loadSeason(1) })

  function toggleWatchlist() {
    if (inWatchlist) {
      removeFromWatchlist(show.id)
    } else {
      addToWatchlist({
        id: show.id,
        name: show.name,
        poster: show.poster_path,
        year: (show.first_air_date || '').slice(0, 4),
      })
    }
  }

  return (
    <div className="fade-in">
      {/* Header */}
      <header className="fixed top-0 w-full z-40 glass shadow-[0px_8px_32px_rgba(0,0,0,0.5)] max-w-md mx-auto left-0 right-0">
        <div className="flex justify-between items-center px-5 h-14">
          <button onClick={() => router.back()} className="p-1.5 hover:bg-surface-container-high rounded-full transition-colors">
            <span className="material-symbols-outlined text-on-surface" style={{fontSize:20}}>arrow_back_ios_new</span>
          </button>
          <span className="font-headline font-bold text-on-surface">Cinephile</span>
          <button onClick={toggleWatchlist} className="p-2 hover:bg-surface-container-high rounded-full transition-colors">
            <span className={`material-symbols-outlined ${inWatchlist ? 'fill-icon text-primary' : 'text-on-surface'}`} style={{fontSize:22}}>bookmark</span>
          </button>
        </div>
      </header>

      <div className="pt-14">
        {/* Hero backdrop */}
        <section className="relative h-72 w-full overflow-hidden">
          <div className="absolute inset-0 backdrop-fade z-10" />
          {backdrop && (
            <Image src={backdrop} alt={show.name} fill className="object-cover" sizes="100vw" priority />
          )}
          <div className="absolute bottom-0 left-0 w-full px-5 pb-5 z-20 space-y-2">
            <div className="flex items-center gap-2 flex-wrap">
              {show.status === 'Returning Series' && (
                <span className="px-2.5 py-0.5 bg-primary-container text-on-primary-container text-[9px] font-bold tracking-widest uppercase rounded-full">Ongoing</span>
              )}
              {show.status === 'Ended' && (
                <span className="px-2.5 py-0.5 bg-surface-container-high text-on-surface-variant text-[9px] font-bold tracking-widest uppercase rounded-full">Ended</span>
              )}
              <div className="flex items-center gap-1 text-tertiary">
                <span className="material-symbols-outlined fill-icon" style={{fontSize:13}}>star</span>
                <span className="font-headline font-bold text-sm">{(show.vote_average||0).toFixed(1)}</span>
              </div>
            </div>
            <h1 className="text-3xl font-headline font-bold tracking-tight leading-tight">{show.name}</h1>
            <p className="text-xs text-on-surface-variant font-label">
              {seasons} Season{seasons !== 1 ? 's' : ''} · {(show.genres ?? []).map(g => g.name).join(' / ')}
            </p>
          </div>
        </section>

        {/* CTAs */}
        <div className="px-5 pt-4 flex gap-3">
          <Link href={`/log?id=${show.id}&name=${encodeURIComponent(show.name)}&poster=${encodeURIComponent(show.poster_path ?? '')}&year=${(show.first_air_date||'').slice(0,4)}`}
            className="flex-1 h-11 gradient-cta text-on-primary font-headline font-bold rounded-xl text-sm flex items-center justify-center gap-2 active:scale-95 transition-transform shadow-[0px_8px_20px_rgba(0,209,255,0.2)]">
            <span className="material-symbols-outlined fill-icon" style={{fontSize:18}}>add_circle</span>
            Log This Show
          </Link>
          <button onClick={toggleWatchlist}
            className="w-11 h-11 bg-surface-container-high text-on-surface rounded-xl flex items-center justify-center active:scale-95 transition-transform">
            <span className={`material-symbols-outlined ${inWatchlist ? 'fill-icon text-primary' : ''}`} style={{fontSize:20}}>bookmark</span>
          </button>
        </div>

        <div className="px-5 space-y-8 mt-6">
          {/* Overview */}
          {show.overview && (
            <section>
              <div className="flex items-center gap-2 mb-2">
                <div className="w-0.5 h-4 gradient-cta rounded-full" />
                <h2 className="text-base font-headline font-bold">Storyline</h2>
              </div>
              <p className="text-sm text-on-surface-variant font-body leading-relaxed">{show.overview}</p>
            </section>
          )}

          {/* Cast */}
          {cast.length > 0 && (
            <section>
              <h2 className="text-base font-headline font-bold mb-3">Top Cast</h2>
              <div className="flex gap-3 overflow-x-auto pb-1">
                {cast.map(p => {
                  const photo = IMG.poster(p.profile_path)
                  return (
                    <div key={p.id} className="flex-none text-center w-16">
                      <div className="w-16 h-16 rounded-xl overflow-hidden bg-surface-container-high mb-1.5">
                        {photo
                          ? <Image src={photo} alt={p.name} width={64} height={64} className="w-full h-full object-cover"/>
                          : <div className="w-full h-full flex items-center justify-center"><span className="material-symbols-outlined fill-icon text-outline" style={{fontSize:28}}>person</span></div>}
                      </div>
                      <p className="text-[10px] font-headline font-semibold text-on-surface leading-tight truncate">{p.name}</p>
                      <p className="text-[9px] text-on-surface-variant font-label truncate">{p.character}</p>
                    </div>
                  )
                })}
              </div>
            </section>
          )}

          {/* Seasons & Episodes */}
          {seasons > 0 && (
            <section>
              <h2 className="text-base font-headline font-bold mb-3">Episodes</h2>
              <div className="flex gap-2 flex-wrap mb-4">
                {Array.from({ length: seasons }, (_, i) => (
                  <button key={i}
                    onClick={() => loadSeason(i + 1)}
                    className={`px-4 py-1.5 rounded-full text-xs font-bold font-label uppercase tracking-wide transition-colors
                      ${activeSeason === i + 1
                        ? 'bg-surface-container-highest text-on-surface'
                        : 'bg-surface-container-high text-on-surface-variant hover:bg-surface-container-highest'}`}>
                    Season {i + 1}
                  </button>
                ))}
              </div>

              {loadingEps ? (
                <div className="space-y-2">
                  {[...Array(4)].map((_, i) => <div key={i} className="skeleton h-16" />)}
                </div>
              ) : (
                <div className="space-y-2">
                  {(season?.episodes ?? []).map(ep => {
                    const still = IMG.poster(ep.still_path)
                    return (
                      <div key={ep.id} className="flex items-center gap-3 p-3 bg-surface-container-low rounded-xl">
                        <div className="w-16 h-10 rounded-lg overflow-hidden bg-surface-container-high flex-none">
                          {still
                            ? <Image src={still} alt={ep.name} width={64} height={40} className="w-full h-full object-cover"/>
                            : <div className="w-full h-full flex items-center justify-center"><span className="material-symbols-outlined text-outline" style={{fontSize:18}}>movie</span></div>}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-headline font-semibold text-on-surface truncate">{ep.name || `Episode ${ep.episode_number}`}</p>
                          <p className="text-[10px] text-on-surface-variant font-label">
                            {ep.runtime ? `${ep.runtime}m · ` : ''}Ep {ep.episode_number}
                          </p>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </section>
          )}

          {/* Details */}
          <section className="pb-4">
            <h2 className="text-base font-headline font-bold mb-3">Details</h2>
            <div className="space-y-0">
              {show.networks?.[0] && (
                <div className="flex justify-between py-2.5 border-b border-outline-variant/10">
                  <span className="text-xs text-on-surface-variant font-label">Network</span>
                  <span className="text-xs font-label text-on-surface">{show.networks[0].name}</span>
                </div>
              )}
              {show.first_air_date && (
                <div className="flex justify-between py-2.5 border-b border-outline-variant/10">
                  <span className="text-xs text-on-surface-variant font-label">First Aired</span>
                  <span className="text-xs font-label text-on-surface">{show.first_air_date}</span>
                </div>
              )}
              {show.number_of_episodes && (
                <div className="flex justify-between py-2.5 border-b border-outline-variant/10">
                  <span className="text-xs text-on-surface-variant font-label">Episodes</span>
                  <span className="text-xs font-label text-on-surface">{show.number_of_episodes}</span>
                </div>
              )}
              {show.vote_count && (
                <div className="flex justify-between py-2.5">
                  <span className="text-xs text-on-surface-variant font-label">TMDB Votes</span>
                  <span className="text-xs font-label text-on-surface">{show.vote_count.toLocaleString()}</span>
                </div>
              )}
            </div>
          </section>
        </div>
      </div>
    </div>
  )
}
