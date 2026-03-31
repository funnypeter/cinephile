import { tmdbFetch, IMG } from '@/lib/tmdb'
import type { TVShow } from '@/lib/types'
import ShowClient from '@/components/ShowClient'
import { notFound } from 'next/navigation'

interface Props { params: Promise<{ id: string }> }

export default async function ShowPage({ params }: Props) {
  const { id } = await params
  const show = await tmdbFetch<TVShow>(`/tv/${id}`, {
    append_to_response: 'credits',
  }).catch(() => null)

  if (!show || !show.id) notFound()

  return <ShowClient show={show} />
}

export async function generateMetadata({ params }: Props) {
  const { id } = await params
  const show = await tmdbFetch<TVShow>(`/tv/${id}`).catch(() => null)
  return { title: show ? `${show.name} — Cinephile` : 'Show — Cinephile' }
}
