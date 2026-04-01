import { NextRequest, NextResponse } from 'next/server'
import { decrypt } from '@/lib/trakt-crypto'

export const runtime = 'nodejs'

export async function POST(req: NextRequest) {
  const cookie = req.cookies.get('trakt_session')?.value
  if (cookie) {
    const raw = decrypt(cookie)
    if (raw) {
      const session = JSON.parse(raw)
      // Best-effort revoke — don't fail if this errors
      await fetch('https://api.trakt.tv/oauth/revoke', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'User-Agent': 'Cinephile/1.0' },
        body: JSON.stringify({
          token: session.access_token,
          client_id: process.env.TRAKT_CLIENT_ID,
          client_secret: process.env.TRAKT_CLIENT_SECRET,
        }),
      }).catch(() => {})
    }
  }

  const response = NextResponse.json({ ok: true })
  response.cookies.delete('trakt_session')
  return response
}
