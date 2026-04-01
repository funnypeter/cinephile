'use client'
import Link from 'next/link'
import Image from 'next/image'
import { useStore } from '@/lib/store'
import { useHydrated } from '@/lib/useHydrated'
import { IMG } from '@/lib/api'

export default function ListsPage() {
  const { watchlist, diary, removeFromWatchlist } = useStore()
  const hydrated = useHydrated()
  const liveWatchlist = hydrated ? watchlist : []
  const liveDiary = hydrated ? diary : []

  return (
    <div>
      <header className="sticky top-0 z-40 glass shadow-[0px_8px_32px_rgba(0,0,0,0.5)]">
        <div className="flex justify-between items-center px-5 h-14 max-w-md mx-auto">
          <span className="text-xl font-headline font-bold tracking-tight text-on-surface">My Lists</span>
          <Link href="/search" className="p-2 hover:bg-surface-container-high rounded-full">
            <span className="material-symbols-outlined text-on-surface-variant" style={{fontSize:22}}>add</span>
          </Link>
        </div>
      </header>

      <div className="px-5 pt-5 space-y-8">
        {/* Watchlist */}
        <section>
          <div className="flex items-end justify-between mb-3">
            <h2 className="text-lg font-headline font-bold">Watchlist</h2>
            <span className="text-xs text-on-surface-variant font-label">{liveWatchlist.length} show{liveWatchlist.length !== 1 ? 's' : ''}</span>
          </div>
          {liveWatchlist.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 bg-surface-container-low rounded-2xl gap-3">
              <span className="material-symbols-outlined text-outline text-4xl">bookmark</span>
              <p className="text-sm text-on-surface-variant font-label">Nothing saved yet</p>
              <Link href="/search" className="px-4 py-2 gradient-cta text-on-primary text-xs font-bold font-label rounded-full">
                Discover Shows
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-2">
              <Link href="/search"
                className="flex flex-col items-center justify-center h-36 bg-surface-container-low rounded-2xl border border-dashed border-outline-variant gap-2">
                <span className="material-symbols-outlined text-outline text-2xl">add</span>
                <span className="text-[10px] text-outline font-label uppercase tracking-wide">Add</span>
              </Link>
              {liveWatchlist.map(w => {
                const p = IMG.poster(w.poster)
                return (
                  <div key={w.id} className="relative group">
                    <Link href={`/show/${w.id}`}>
                      <div className="relative h-36 rounded-2xl overflow-hidden bg-surface-container-high">
                        {p
                          ? <Image src={p} alt={w.name} fill className="object-cover group-hover:scale-105 transition-transform" sizes="33vw"/>
                          : <div className="w-full h-full flex items-center justify-center"><span className="material-symbols-outlined text-outline">movie</span></div>}
                      </div>
                      <p className="mt-1 text-[10px] font-label text-on-surface-variant truncate">{w.name}</p>
                    </Link>
                    <button
                      onClick={() => removeFromWatchlist(w.id)}
                      className="absolute top-1.5 right-1.5 w-6 h-6 bg-surface/80 backdrop-blur rounded-full hidden group-hover:flex items-center justify-center">
                      <span className="material-symbols-outlined text-on-surface" style={{fontSize:14}}>close</span>
                    </button>
                  </div>
                )
              })}
            </div>
          )}
        </section>

        {/* Diary */}
        <section className="pb-4">
          <div className="flex items-end justify-between mb-3">
            <h2 className="text-lg font-headline font-bold">Watch Diary</h2>
            <span className="text-xs text-on-surface-variant font-label">{liveDiary.length} entr{liveDiary.length !== 1 ? 'ies' : 'y'}</span>
          </div>
          {liveDiary.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 bg-surface-container-low rounded-2xl gap-3">
              <span className="material-symbols-outlined text-outline text-4xl">menu_book</span>
              <p className="text-sm text-on-surface-variant font-label">No entries yet</p>
              <Link href="/log" className="px-4 py-2 gradient-cta text-on-primary text-xs font-bold font-label rounded-full">
                Log a Show
              </Link>
            </div>
          ) : (
            <div className="space-y-2">
              {liveDiary.map(entry => {
                const p = IMG.poster(entry.poster)
                const date = new Date(entry.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
                return (
                  <div key={entry.id} className="flex gap-3 p-3 bg-surface-container-low rounded-xl">
                    <Link href={`/show/${entry.showId}`} className="flex-none">
                      <div className="w-10 h-14 rounded-lg overflow-hidden bg-surface-container-high">
                        {p
                          ? <Image src={p} alt={entry.showName} width={40} height={56} className="w-full h-full object-cover"/>
                          : <div className="w-full h-full flex items-center justify-center"><span className="material-symbols-outlined text-outline" style={{fontSize:16}}>movie</span></div>}
                      </div>
                    </Link>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <p className="font-headline font-semibold text-on-surface text-sm truncate">{entry.showName}</p>
                        <span className="text-[10px] text-on-surface-variant font-label flex-none">{date}</span>
                      </div>
                      <div className="flex items-center gap-0.5 mt-0.5">
                        {[1,2,3,4,5].map(n => (
                          <span key={n} className={`material-symbols-outlined ${n <= entry.rating ? 'fill-icon text-tertiary' : 'text-outline'}`} style={{fontSize:11}}>star</span>
                        ))}
                      </div>
                      {entry.review && (
                        <p className="text-[11px] text-on-surface-variant font-label mt-1 line-clamp-2">{entry.review}</p>
                      )}
                      {entry.spoiler && (
                        <span className="inline-block mt-1 px-1.5 py-0.5 bg-error-container text-error text-[9px] font-bold uppercase tracking-wide rounded">Spoilers</span>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </section>
      </div>
    </div>
  )
}
