'use client'
import { useEffect, useRef } from 'react'
import { useStore } from '@/lib/store'

export default function TraktSyncProvider() {
  const ranRef = useRef(false)

  useEffect(() => {
    if (ranRef.current) return
    ranRef.current = true

    const { checkTraktStatus, syncWithTrakt } = useStore.getState()
    checkTraktStatus().then(() => {
      if (useStore.getState().trakt.connected) {
        syncWithTrakt()
      }
    })
  }, [])

  return null
}
