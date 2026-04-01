'use client'
import { useStore } from '@/lib/store'

export default function TraktConnectCard() {
  const trakt = useStore((s) => s.trakt)
  const syncWithTrakt = useStore((s) => s.syncWithTrakt)
  const setTraktDisconnected = useStore((s) => s.setTraktDisconnected)

  async function handleDisconnect() {
    await fetch('/api/trakt/logout', { method: 'POST' })
    setTraktDisconnected()
  }

  if (!trakt.connected) {
    return (
      <div className="bg-surface-container-low rounded-2xl p-5">
        <div className="flex items-center gap-3 mb-3">
          <span className="material-symbols-outlined text-primary" style={{ fontSize: 24 }}>sync</span>
          <div>
            <p className="font-headline font-bold text-on-surface text-sm">Connect Trakt.tv</p>
            <p className="text-[10px] text-on-surface-variant font-label">Sync your watch history across devices</p>
          </div>
        </div>
        <a
          href="/api/trakt/auth"
          className="block w-full h-10 gradient-cta text-on-primary font-headline font-bold rounded-xl text-sm flex items-center justify-center gap-2 active:scale-95 transition-transform"
        >
          <span className="material-symbols-outlined" style={{ fontSize: 16 }}>link</span>
          Connect Account
        </a>
      </div>
    )
  }

  return (
    <div className="bg-surface-container-low rounded-2xl p-5">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3">
          <span className="material-symbols-outlined text-primary" style={{ fontSize: 24 }}>check_circle</span>
          <div>
            <p className="font-headline font-bold text-on-surface text-sm">Trakt Connected</p>
            <p className="text-[10px] text-on-surface-variant font-label">@{trakt.username}</p>
          </div>
        </div>
      </div>

      {trakt.lastFullSync && (
        <p className="text-[10px] text-on-surface-variant font-label mb-3">
          Last synced: {new Date(trakt.lastFullSync).toLocaleString()}
        </p>
      )}

      {trakt.syncError && (
        <p className="text-[10px] text-error font-label mb-3">Sync error — try again</p>
      )}

      <div className="flex gap-2">
        <button
          onClick={() => syncWithTrakt()}
          disabled={trakt.syncInProgress}
          className="flex-1 h-9 bg-surface-container-high text-on-surface font-headline font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 active:scale-95 transition-transform disabled:opacity-50"
        >
          <span className={`material-symbols-outlined ${trakt.syncInProgress ? 'animate-spin' : ''}`} style={{ fontSize: 14 }}>sync</span>
          {trakt.syncInProgress ? 'Syncing...' : 'Sync Now'}
        </button>
        <button
          onClick={handleDisconnect}
          className="h-9 px-4 bg-surface-container-high text-on-surface-variant font-label text-xs rounded-xl active:scale-95 transition-transform"
        >
          Disconnect
        </button>
      </div>
    </div>
  )
}
