'use client'
import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import type { DiaryEntry, WatchlistItem } from './types'

interface Store {
  watchlist: WatchlistItem[]
  diary: DiaryEntry[]
  addToWatchlist: (item: WatchlistItem) => void
  removeFromWatchlist: (id: number) => void
  isInWatchlist: (id: number) => boolean
  addDiaryEntry: (entry: Omit<DiaryEntry, 'id' | 'date'>) => void
  stats: () => { watched: number; avgRating: string; watchlistCount: number }
}

export const useStore = create<Store>()(
  persist(
    (set, get) => ({
      watchlist: [],
      diary: [],

      addToWatchlist: (item) =>
        set((s) => ({ watchlist: [item, ...s.watchlist.filter((w) => w.id !== item.id)] })),

      removeFromWatchlist: (id) =>
        set((s) => ({ watchlist: s.watchlist.filter((w) => w.id !== id) })),

      isInWatchlist: (id) => get().watchlist.some((w) => w.id === id),

      addDiaryEntry: (entry) =>
        set((s) => ({
          diary: [
            { ...entry, id: crypto.randomUUID(), date: new Date().toISOString() },
            ...s.diary,
          ],
        })),

      stats: () => {
        const { diary, watchlist } = get()
        const ratings = diary.filter((d) => d.rating > 0).map((d) => d.rating)
        const avg =
          ratings.length
            ? (ratings.reduce((a, b) => a + b, 0) / ratings.length).toFixed(1)
            : '—'
        return { watched: diary.length, avgRating: avg, watchlistCount: watchlist.length }
      },
    }),
    {
      name: 'cinephile-store',
      storage: createJSONStorage(() => localStorage),
    }
  )
)
