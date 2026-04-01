import { NextRequest, NextResponse } from 'next/server'
import { decrypt } from '@/lib/trakt-crypto'
import { TRAKT_HEADERS } from '@/lib/trakt-headers'

export const runtime = 'nodejs'

export async function POST(req: NextRequest) {
  const cookie = req.cookies.get('trakt_session')?.value
  if (cookie) {
    const raw = decrypt(cookie)
    if (raw) {
      const session = JSON.parse(raw)
      await fetch('https://api.trakt.tv/oauth/revoke', {
        method: 'POST',
        headers: { ...TRAKT_HEADERS },
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
