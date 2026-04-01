'use client'
import { useEffect } from 'react'
import { useStore } from '@/lib/store'

export default function TraktSyncProvider() {
  const checkTraktStatus = useStore((s) => s.checkTraktStatus)
  const syncWithTrakt = useStore((s) => s.syncWithTrakt)
  const connected = useStore((s) => s.trakt.connected)

  useEffect(() => {
    checkTraktStatus().then(() => {
      if (useStore.getState().trakt.connected) {
        syncWithTrakt()
      }
    })
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  return null
}
