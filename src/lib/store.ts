'use client'
import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import type { DiaryEntry } from './types'

interface Store {
  diary: DiaryEntry[]
  addDiaryEntry: (entry: Omit<DiaryEntry, 'id' | 'date'>) => void
}

export const useStore = create<Store>()(
  persist(
    (set) => ({
      diary: [],

      addDiaryEntry: (entry) =>
        set((s) => ({
          diary: [
            { ...entry, id: crypto.randomUUID(), date: new Date().toISOString() },
            ...s.diary,
          ],
        })),
    }),
    {
      name: 'cinephile-store',
      storage: createJSONStorage(() => localStorage),
    }
  )
)

/** Derive unique logged shows to use as the watchlist */
export function useWatchlist() {
  const diary = useStore((s) => s.diary)
  const seen = new Set<number>()
  return diary.filter((d) => {
    if (seen.has(d.showId)) return false
    seen.add(d.showId)
    return true
  })
}
