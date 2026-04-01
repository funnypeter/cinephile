import { useState, useEffect } from 'react'
import { useStore } from './store'

export function useHydrated() {
  const [hydrated, setHydrated] = useState(false)

  useEffect(() => {
    if (useStore.persist.hasHydrated()) {
      setHydrated(true)
    }
    const unsub = useStore.persist.onFinishHydration(() => setHydrated(true))
    return unsub
  }, [])

  return hydrated
}
