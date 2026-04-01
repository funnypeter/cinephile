'use client'
import { useEffect, useRef } from 'react'
import { useStore } from '@/lib/store'

export default function TraktSyncProvider() {
  const ranRef = useRef(false)

  useEffect(() => {
    if (ranRef.current) return
    ranRef.current = true
    // Only check connection status — no background sync
    useStore.getState().checkTraktStatus()
  }, [])

  return null
}
