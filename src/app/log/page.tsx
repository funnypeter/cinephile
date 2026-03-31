'use client'
import { useState, useRef, Suspense } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useRouter, useSearchParams } from 'next/navigation'
import { useStore } from '@/lib/store'
import { apiFetch, IMG } from '@/lib/api'
import type { TVShow, SearchResult } from '@/lib/types'

function LogForm() {
  const router = useRouter()
  const params = useSearchParams()
  const { addDiaryEntry } = useStore()

  const [query, setQuery] = useState('')
  const [suggestions, setSuggestions] = useState<TVShow[]>([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [selected, setSelected] = useState<{ id: number; name: string; poster: string | null; year: string } | null>(() => {
    const id = params.get('id')
    const name = params.get('name')
    if (id && name) return {
      id: parseInt(id),
      name,
      poster: params.get('poster') || null,
      year: params.get('year') || '',
    }
    return null
  })
  const [rating, setRating] = useState(0)
  const [review, setReview] = useState('')
  const [spoiler, setSpoiler] = useState(false)
  const [saved, setSaved] = useState(false)
  const timerRef = useRef<ReturnType<typeof setTimeout>>(undefined)

  function handleInput(val: string) {
    setQuery(val)
    clearTimeout(timerRef.current)
    if (!val.trim()) { setSuggestions([]); setShowSuggestions(false); return }
    timerRef.current = setTimeout(async () => {
      const data = await apiFetch<SearchResult>('/search/tv', { query: val })
      setSuggestions(data.results?.slice(0, 5) ?? [])
      setShowSuggestions(true)
    }, 350)
  }

  function selectShow(show: TVShow) {
    setSelected({ id: show.id, name: show.name, poster: show.poster_path, year: (show.first_air_date||'').slice(0,4) })
    setQuery(show.name)
    setShowSuggestions(false)
  }

  function handleSave() {
    if (!selected) return
    addDiaryEntry({ showId: selected.id, showName: selected.name, poster: selected.poster, year: selected.year, rating, review, spoiler })
    setSaved(true)
    setTimeout(() => router.push('/'), 1200)
  }

  if (saved) return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
      <div className="w-16 h-16 gradient-cta rounded-full flex items-center justify-center">
        <span className="material-symbols-outlined fill-icon text-on-primary text-3xl">check</span>
      </div>
      <p className="font-headline font-bold text-lg">Show Logged!</p>
      <p className="text-on-surface-variant font-label text-sm">Redirecting home…</p>
    </div>
  )

  const today = new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })

  return (
    <div className="px-5 pt-5">
      <h1 className="text-2xl font-headline font-bold tracking-tight">Log Show</h1>
      <p className="text-[10px] font-bold tracking-widest uppercase text-on-surface-variant font-label mt-0.5 mb-5">Sharing Your Cinematic Journey</p>

      {/* Search */}
      <div className="relative">
        <div className="flex items-center gap-2 bg-surface-container-lowest rounded-xl px-3 py-2.5 focus-within:ring-1 focus-within:ring-primary/30">
          <span className="material-symbols-outlined text-outline" style={{fontSize:18}}>search</span>
          <input
            type="text"
            value={query}
            placeholder="Search for a show..."
            className="flex-1 bg-transparent text-on-surface text-sm placeholder:text-outline outline-none font-body"
            onChange={e => handleInput(e.target.value)}
            onFocus={() => suggestions.length && setShowSuggestions(true)}
          />
        </div>
        {showSuggestions && suggestions.length > 0 && (
          <div className="absolute top-full left-0 right-0 mt-1 bg-surface-container-high rounded-xl overflow-hidden z-10 shadow-[0px_8px_24px_rgba(0,0,0,0.5)]">
            {suggestions.map(s => {
              const p = IMG.poster(s.poster_path)
              return (
                <button key={s.id} onClick={() => selectShow(s)}
                  className="w-full flex gap-3 items-center p-3 hover:bg-surface-container-highest transition-colors text-left">
                  <div className="w-8 h-11 rounded-lg overflow-hidden bg-surface-container-highest flex-none">
                    {p ? <Image src={p} alt={s.name} width={32} height={44} className="w-full h-full object-cover"/> : null}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-headline font-semibold text-on-surface truncate">{s.name}</p>
                    <p className="text-[10px] text-on-surface-variant font-label">{(s.first_air_date||'').slice(0,4)}</p>
                  </div>
                </button>
              )
            })}
          </div>
        )}
      </div>

      {/* Selected show */}
      {selected && (
        <div className="mt-4 p-4 bg-surface-container-low rounded-xl slide-up">
          <p className="text-[10px] font-bold tracking-widest uppercase text-primary font-label mb-2">Selected Show</p>
          <div className="flex gap-3 items-center">
            <div className="w-14 h-20 rounded-xl overflow-hidden bg-surface-container-high flex-none">
              {selected.poster && IMG.poster(selected.poster)
                ? <Image src={IMG.poster(selected.poster)!} alt={selected.name} width={56} height={80} className="w-full h-full object-cover"/>
                : <div className="w-full h-full flex items-center justify-center"><span className="material-symbols-outlined text-outline">movie</span></div>}
            </div>
            <div>
              <p className="font-headline font-bold text-on-surface">{selected.name}</p>
              <p className="text-xs text-on-surface-variant font-label mt-0.5">{selected.year}</p>
            </div>
          </div>
        </div>
      )}

      {selected && (
        <div className="slide-up space-y-6 mt-6">
          {/* Stars */}
          <div className="text-center">
            <p className="text-[10px] font-bold tracking-widest uppercase text-on-surface-variant font-label mb-3">Your Rating</p>
            <div className="flex justify-center gap-3">
              {[1,2,3,4,5].map(n => (
                <button key={n} onClick={() => setRating(n === rating ? 0 : n)}
                  className="transition-transform hover:scale-110 active:scale-95">
                  <span className={`material-symbols-outlined text-4xl ${n <= rating ? 'fill-icon text-tertiary' : 'text-outline'}`}>star</span>
                </button>
              ))}
            </div>
          </div>

          {/* Review */}
          <div>
            <div className="flex justify-between items-center mb-2">
              <p className="text-[10px] font-bold tracking-widest uppercase text-on-surface-variant font-label">Add Review</p>
              <p className="text-[10px] text-outline font-label">Optional</p>
            </div>
            <textarea
              rows={4}
              value={review}
              onChange={e => setReview(e.target.value)}
              placeholder="What did you think of this masterpiece?"
              className="w-full bg-surface-container-lowest rounded-xl px-4 py-3 text-sm text-on-surface placeholder:text-outline outline-none resize-none font-body focus:ring-1 focus:ring-primary/30"
            />
          </div>

          {/* Options */}
          <div className="space-y-2">
            <div className="flex items-center justify-between p-4 bg-surface-container-low rounded-xl">
              <div className="flex items-center gap-3">
                <span className="material-symbols-outlined text-on-surface-variant" style={{fontSize:20}}>calendar_today</span>
                <span className="text-sm text-on-surface font-label">Watched date</span>
              </div>
              <span className="text-sm text-on-surface-variant font-label">{today}</span>
            </div>
            <div className="flex items-center justify-between p-4 bg-surface-container-low rounded-xl">
              <div className="flex items-center gap-3">
                <span className="material-symbols-outlined text-on-surface-variant" style={{fontSize:20}}>warning</span>
                <span className="text-sm text-on-surface font-label">Contains Spoilers</span>
              </div>
              <button onClick={() => setSpoiler(!spoiler)}
                className={`w-11 h-6 rounded-full relative transition-colors ${spoiler ? 'bg-primary' : 'bg-outline'}`}>
                <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-surface rounded-full shadow transition-transform ${spoiler ? 'translate-x-5' : ''}`} />
              </button>
            </div>
          </div>

          {/* Save */}
          <div className="space-y-3 pb-4">
            <button onClick={handleSave}
              className="w-full h-12 gradient-cta text-on-primary font-headline font-bold rounded-xl text-sm active:scale-95 transition-transform shadow-[0px_10px_20px_rgba(0,209,255,0.2)]">
              Save Log
            </button>
            <Link href="/" className="block text-center text-[11px] font-bold tracking-widest uppercase text-outline font-label py-2">
              Cancel and Discard
            </Link>
          </div>
        </div>
      )}
    </div>
  )
}

export default function LogPage() {
  return (
    <div>
      <header className="sticky top-0 z-40 glass shadow-[0px_8px_32px_rgba(0,0,0,0.5)]">
        <div className="flex items-center justify-between px-5 h-14 max-w-md mx-auto">
          <Link href="/" className="p-1.5 hover:bg-surface-container-high rounded-full">
            <span className="material-symbols-outlined text-on-surface-variant" style={{fontSize:20}}>arrow_back_ios_new</span>
          </Link>
          <span className="font-headline font-bold text-on-surface">Log Show</span>
          <div className="w-8" />
        </div>
      </header>
      <Suspense>
        <LogForm />
      </Suspense>
    </div>
  )
}
