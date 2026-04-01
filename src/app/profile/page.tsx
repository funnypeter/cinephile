'use client'
import Link from 'next/link'
import Image from 'next/image'
import { useStore, useWatchlist } from '@/lib/store'
import { IMG } from '@/lib/api'

export default function ProfilePage() {
  const watchlist = useWatchlist()
  const diary = useStore((s) => s.diary)

  const ratings = diary.filter(d => d.rating > 0).map(d => d.rating)
  const avgRating = ratings.length
    ? (ratings.reduce((a, b) => a + b, 0) / ratings.length).toFixed(1)
    : null

  const topGenres = (() => {
    const map: Record<string, number> = {}
    // placeholder — real impl would look up genres per show
    return []
  })()

  return (
    <div>
      <header className="sticky top-0 z-40 glass shadow-[0px_8px_32px_rgba(0,0,0,0.5)]">
        <div className="flex justify-between items-center px-5 h-14 max-w-md mx-auto">
          <span className="text-xl font-headline font-bold tracking-tight text-on-surface">Profile</span>
          <button className="p-2 hover:bg-surface-container-high rounded-full">
            <span className="material-symbols-outlined text-on-surface-variant" style={{fontSize:22}}>settings</span>
          </button>
        </div>
      </header>

      <div className="px-5 pt-6 space-y-6">
        {/* Avatar + info */}
        <div className="flex items-start gap-4">
          <div className="relative">
            <div className="w-20 h-20 rounded-2xl bg-surface-container-high flex items-center justify-center">
              <span className="material-symbols-outlined fill-icon text-on-surface-variant" style={{fontSize:40}}>person</span>
            </div>
            <div className="absolute -bottom-1 -right-1 w-6 h-6 gradient-cta rounded-full flex items-center justify-center">
              <span className="material-symbols-outlined text-on-primary" style={{fontSize:14}}>edit</span>
            </div>
          </div>
          <div className="flex-1 pt-1">
            <h1 className="text-xl font-headline font-bold tracking-tight">Cinephile User</h1>
            <div className="inline-flex items-center gap-1 mt-1 px-2 py-0.5 bg-secondary-container rounded-full">
              <span className="material-symbols-outlined fill-icon text-on-secondary-container" style={{fontSize:10}}>star</span>
              <span className="text-[10px] font-bold font-label text-on-secondary-container uppercase tracking-wide">Member</span>
            </div>
            <p className="text-xs text-on-surface-variant font-label mt-2 leading-relaxed">
              Your cinematic journey starts here. Log shows, build your diary, discover new favorites.
            </p>
          </div>
        </div>

        {/* Stats grid */}
        <div className="grid grid-cols-2 gap-2">
          {[
            { label: 'Logged', value: diary.length },
            { label: 'Diary Entries', value: diary.length },
            { label: 'Watchlist', value: watchlist.length },
            { label: 'Avg Rating', value: avgRating ? `★ ${avgRating}` : '—', gold: true },
          ].map(s => (
            <div key={s.label} className="bg-surface-container-low rounded-xl p-4 text-center">
              <p className={`text-2xl font-headline font-bold ${s.gold ? 'text-tertiary' : 'gradient-text'}`}>{s.value}</p>
              <p className="text-[10px] text-on-surface-variant uppercase tracking-wide font-label mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Recent activity */}
        <section className="pb-6">
          <div className="flex items-end justify-between mb-3">
            <h2 className="text-lg font-headline font-bold">Recent Activity</h2>
            <Link href="/lists" className="text-primary text-xs font-bold font-headline uppercase tracking-wide">View All →</Link>
          </div>
          {diary.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 bg-surface-container-low rounded-2xl gap-3">
              <span className="material-symbols-outlined text-outline text-4xl">play_circle</span>
              <p className="text-sm text-on-surface-variant font-label">No activity yet</p>
              <Link href="/log" className="px-4 py-2 gradient-cta text-on-primary text-xs font-bold font-label rounded-full">
                Log Your First Show
              </Link>
            </div>
          ) : (
            <div className="space-y-2">
              {diary.slice(0, 8).map(entry => {
                const p = IMG.poster(entry.poster)
                const date = new Date(entry.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
                return (
                  <Link key={entry.id} href={`/show/${entry.showId}`}
                    className="flex gap-3 items-center p-3 bg-surface-container-low rounded-xl hover:bg-surface-container-high transition-colors">
                    <div className="w-9 h-12 rounded-lg overflow-hidden bg-surface-container-high flex-none">
                      {p
                        ? <Image src={p} alt={entry.showName} width={36} height={48} className="w-full h-full object-cover"/>
                        : <div className="w-full h-full flex items-center justify-center"><span className="material-symbols-outlined text-outline" style={{fontSize:14}}>movie</span></div>}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-label font-semibold text-on-surface text-sm truncate">{entry.showName}</p>
                      <div className="flex items-center gap-0.5 mt-0.5">
                        {[1,2,3,4,5].map(n => (
                          <span key={n} className={`material-symbols-outlined ${n <= entry.rating ? 'fill-icon text-tertiary' : 'text-outline'}`} style={{fontSize:10}}>star</span>
                        ))}
                      </div>
                    </div>
                    <span className="text-[10px] text-on-surface-variant font-label flex-none">{date}</span>
                  </Link>
                )
              })}
            </div>
          )}
        </section>
      </div>
    </div>
  )
}
