import Link from 'next/link'
import Image from 'next/image'
import { IMG, GENRE_MAP } from '@/lib/api'
import type { TVShow } from '@/lib/types'

interface Props {
  show: TVShow
  size?: 'sm' | 'md'
}

export default function PosterCard({ show, size = 'md' }: Props) {
  const poster = IMG.poster(show.poster_path)
  const genre = show.genre_ids?.[0] ? GENRE_MAP[show.genre_ids[0]] : ''
  const year = (show.first_air_date || '').slice(0, 4)

  if (size === 'sm') return (
    <Link href={`/show/${show.id}`} className="block flex-none w-28 group">
      <div className="relative w-28 h-40 rounded-2xl overflow-hidden bg-surface-container-high">
        {poster
          ? <Image src={poster} alt={show.name} fill className="object-cover group-hover:scale-105 transition-transform duration-300" sizes="112px"/>
          : <div className="w-full h-full flex items-center justify-center"><span className="material-symbols-outlined text-outline">movie</span></div>}
      </div>
      <p className="mt-1.5 text-[11px] font-headline font-semibold text-on-surface truncate">{show.name}</p>
    </Link>
  )

  return (
    <Link href={`/show/${show.id}`} className="block group">
      <div className="relative w-full aspect-[2/3] rounded-2xl overflow-hidden bg-surface-container-high">
        {poster
          ? <Image src={poster} alt={show.name} fill className="object-cover group-hover:scale-105 transition-transform duration-300" sizes="(max-width: 768px) 50vw, 200px"/>
          : <div className="w-full h-full flex items-center justify-center"><span className="material-symbols-outlined text-outline text-3xl">movie</span></div>}
        <div className="absolute top-2 right-2 flex items-center gap-0.5 bg-surface/80 backdrop-blur rounded-full px-1.5 py-0.5">
          <span className="material-symbols-outlined fill-icon text-tertiary" style={{fontSize:10}}>star</span>
          <span className="text-[9px] font-bold font-headline text-on-surface">{(show.vote_average||0).toFixed(1)}</span>
        </div>
      </div>
      <p className="mt-1.5 text-xs font-headline font-semibold text-on-surface truncate">{show.name}</p>
      <p className="text-[10px] text-on-surface-variant font-label">{[genre, year].filter(Boolean).join(' · ')}</p>
    </Link>
  )
}
