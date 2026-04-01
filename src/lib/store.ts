'use client'
import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import type { DiaryEntry, TraktSyncState } from './types'
import { pushToTrakt, pullFromTrakt, pushSingleEntry } from './trakt-sync'
import { getTraktStatus } from './trakt-api'

interface Store {
  diary: DiaryEntry[]
  trakt: TraktSyncState

  addDiaryEntry: (entry: Omit<DiaryEntry, 'id' | 'date'> & { date?: string }) => void
  updateDiaryEntry: (id: string, patch: Partial<DiaryEntry>) => void
  removeShowFromDiary: (showId: number) => void

  setTraktConnected: (username: string) => void
  setTraktDisconnected: () => void
  checkTraktStatus: () => Promise<void>
  syncWithTrakt: () => Promise<void>
}

export const useStore = create<Store>()(
  persist(
    (set, get) => ({
      diary: [],
      trakt: { connected: false, syncInProgress: false },

      addDiaryEntry: (entry) => {
        const newEntry: DiaryEntry = {
          ...entry,
          id: crypto.randomUUID(),
          date: entry.date ?? new Date().toISOString(),
        }
        set((s) => ({ diary: [newEntry, ...s.diary] }))

        // Fire-and-forget push to Trakt if connected
        if (get().trakt.connected) {
          pushSingleEntry(newEntry, (id, patch) => {
            get().updateDiaryEntry(id, patch)
          }).catch(() => {})
        }
      },

      updateDiaryEntry: (id, patch) =>
        set((s) => ({
          diary: s.diary.map((d) => (d.id === id ? { ...d, ...patch } : d)),
        })),

      removeShowFromDiary: (showId) =>
        set((s) => ({
          diary: s.diary.filter((d) => d.showId !== showId),
        })),

      setTraktConnected: (username) =>
        set((s) => ({ trakt: { ...s.trakt, connected: true, username, syncError: undefined } })),

      setTraktDisconnected: () =>
        set({ trakt: { connected: false, syncInProgress: false } }),

      checkTraktStatus: async () => {
        try {
          const status = await getTraktStatus()
          if (status.connected) {
            set((s) => ({ trakt: { ...s.trakt, connected: true, username: status.username } }))
          } else {
            set((s) => ({ trakt: { ...s.trakt, connected: false, username: undefined } }))
          }
        } catch {
          // Silently fail — not connected
        }
      },

      syncWithTrakt: async () => {
        const { trakt, diary } = get()
        if (!trakt.connected || trakt.syncInProgress) return

        set((s) => ({ trakt: { ...s.trakt, syncInProgress: true, syncError: undefined } }))

        try {
          // Push unsynced local entries to Trakt
          await pushToTrakt(diary, (id, patch) => get().updateDiaryEntry(id, patch))

          // Pull new entries from Trakt
          await pullFromTrakt(
            get().diary,
            trakt.lastFullSync,
            (entry) => {
              const newEntry: DiaryEntry = {
                ...entry,
                id: crypto.randomUUID(),
              }
              set((s) => ({ diary: [...s.diary, newEntry] }))
            }
          )

          set((s) => ({
            trakt: { ...s.trakt, syncInProgress: false, lastFullSync: new Date().toISOString() },
          }))
        } catch (e) {
          set((s) => ({
            trakt: { ...s.trakt, syncInProgress: false, syncError: String(e) },
          }))
        }
      },
    }),
    {
      name: 'cinephile-store',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        diary: state.diary,
        trakt: {
          connected: state.trakt.connected,
          username: state.trakt.username,
          lastFullSync: state.trakt.lastFullSync,
          syncInProgress: false,
        },
      }),
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
