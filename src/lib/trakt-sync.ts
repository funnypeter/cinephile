import { traktFetch } from './trakt-api'
import type { DiaryEntry, TraktHistoryItem, TraktRatingItem } from './types'

/** Push unsynced diary entries to Trakt */
export async function pushToTrakt(
  diary: DiaryEntry[],
  onUpdate: (id: string, patch: Partial<DiaryEntry>) => void
) {
  const unsynced = diary.filter((d) => !d.traktSyncedAt)
  if (unsynced.length === 0) return

  // Push watch history
  const shows = unsynced.map((d) => ({
    ids: { tmdb: d.showId },
    watched_at: d.date,
  }))

  const historyRes = await traktFetch<{ added: { shows: number } }>('/sync/history', {
    method: 'POST',
    body: { shows },
  })

  if (historyRes) {
    const now = new Date().toISOString()
    unsynced.forEach((d) => onUpdate(d.id, { traktSyncedAt: now }))
  }

  // Push ratings
  const withRatings = unsynced.filter((d) => d.rating > 0)
  if (withRatings.length > 0) {
    await traktFetch('/sync/ratings', {
      method: 'POST',
      body: {
        shows: withRatings.map((d) => ({
          ids: { tmdb: d.showId },
          rating: d.rating * 2, // 1-5 → 2-10
        })),
      },
    })
  }
}

/** Push a single new entry to Trakt (fire-and-forget) */
export async function pushSingleEntry(
  entry: DiaryEntry,
  onUpdate: (id: string, patch: Partial<DiaryEntry>) => void
) {
  const res = await traktFetch<{ added: { shows: number } }>('/sync/history', {
    method: 'POST',
    body: {
      shows: [{ ids: { tmdb: entry.showId }, watched_at: entry.date }],
    },
  })

  if (res) {
    onUpdate(entry.id, { traktSyncedAt: new Date().toISOString() })
  }

  if (entry.rating > 0) {
    await traktFetch('/sync/ratings', {
      method: 'POST',
      body: {
        shows: [{ ids: { tmdb: entry.showId }, rating: entry.rating * 2 }],
      },
    })
  }
}

/** Pull watch history from Trakt into local diary */
export async function pullFromTrakt(
  diary: DiaryEntry[],
  lastFullSync: string | undefined,
  onAdd: (entry: Omit<DiaryEntry, 'id' | 'date'> & { date: string }) => void
) {
  const params: Record<string, string> = { limit: '100' }
  if (lastFullSync) params.start_at = lastFullSync

  const history = await traktFetch<TraktHistoryItem[]>('/users/me/history/shows', {
    params,
  })
  if (!history) return

  const ratings = await traktFetch<TraktRatingItem[]>('/users/me/ratings/shows')
  const ratingMap = new Map<number, number>()
  if (ratings) {
    ratings.forEach((r) => ratingMap.set(r.show.ids.tmdb, Math.round(r.rating / 2)))
  }

  const existingShowDates = new Set(
    diary.map((d) => `${d.showId}-${d.date.slice(0, 10)}`)
  )

  for (const item of history) {
    const tmdbId = item.show.ids.tmdb
    if (!tmdbId) continue

    const dateKey = `${tmdbId}-${item.watched_at.slice(0, 10)}`
    if (existingShowDates.has(dateKey)) continue

    onAdd({
      showId: tmdbId,
      showName: item.show.title,
      poster: null, // We don't have poster from Trakt — TMDB would need a lookup
      year: String(item.show.year ?? ''),
      rating: ratingMap.get(tmdbId) ?? 0,
      review: '',
      spoiler: false,
      date: item.watched_at,
      traktHistoryId: item.id,
      traktSyncedAt: new Date().toISOString(),
    })
  }
}
