'use client'
import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import ShowClient from '@/components/ShowClient'
import type { TVShow } from '@/lib/types'
import { apiFetch } from '@/lib/api'

export default function ShowPage() {
  const params = useParams()
  const id = params.id as string
  const [show, setShow] = useState<TVShow | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    apiFetch<TVShow>(`/tv/${id}`, { append_to_response: 'credits' })
      .then(setShow)
      .catch(() => setShow(null))
      .finally(() => setLoading(false))
  }, [id])

  if (loading) return (
    <div className="px-5 pt-20 space-y-4">
      <div className="skeleton h-72 w-full" />
      <div className="skeleton h-6 w-2/3" />
      <div className="skeleton h-4 w-1/2" />
    </div>
  )

  if (!show) return (
    <div className="flex flex-col items-center justify-center min-h-screen gap-3">
      <span className="material-symbols-outlined text-outline text-5xl">error</span>
      <p className="text-on-surface-variant font-label">Show not found</p>
    </div>
  )

  return <ShowClient show={show} />
}
