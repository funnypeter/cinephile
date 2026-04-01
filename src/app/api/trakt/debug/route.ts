import { NextRequest, NextResponse } from 'next/server'
import { decrypt } from '@/lib/trakt-crypto'
import { TRAKT_HEADERS } from '@/lib/trakt-headers'

export const runtime = 'nodejs'

export async function GET(req: NextRequest) {
  const cookie = req.cookies.get('trakt_session')?.value
  if (!cookie) return NextResponse.json({ error: 'not connected' })

  const raw = decrypt(cookie)
  if (!raw) return NextResponse.json({ error: 'invalid session' })

  const session = JSON.parse(raw)
  const clientId = process.env.TRAKT_CLIENT_ID!

  const twoWeeksAgo = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString()

  // Try episodes history
  const epRes = await fetch(`https://api.trakt.tv/users/me/history/episodes?start_at=${twoWeeksAgo}&limit=10`, {
    headers: {
      ...TRAKT_HEADERS,
      'trakt-api-version': '2',
      'trakt-api-key': clientId,
      'Authorization': `Bearer ${session.access_token}`,
    },
  })
  const epBody = epRes.ok ? await epRes.json() : await epRes.text()

  // Try shows history
  const showRes = await fetch(`https://api.trakt.tv/users/me/history/shows?start_at=${twoWeeksAgo}&limit=10`, {
    headers: {
      ...TRAKT_HEADERS,
      'trakt-api-version': '2',
      'trakt-api-key': clientId,
      'Authorization': `Bearer ${session.access_token}`,
    },
  })
  const showBody = showRes.ok ? await showRes.json() : await showRes.text()

  // Try all history
  const allRes = await fetch(`https://api.trakt.tv/users/me/history?limit=10`, {
    headers: {
      ...TRAKT_HEADERS,
      'trakt-api-version': '2',
      'trakt-api-key': clientId,
      'Authorization': `Bearer ${session.access_token}`,
    },
  })
  const allBody = allRes.ok ? await allRes.json() : await allRes.text()

  return NextResponse.json({
    username: session.username,
    episodes: { status: epRes.status, count: Array.isArray(epBody) ? epBody.length : 'not array', preview: JSON.stringify(epBody).slice(0, 500) },
    shows: { status: showRes.status, count: Array.isArray(showBody) ? showBody.length : 'not array', preview: JSON.stringify(showBody).slice(0, 500) },
    all: { status: allRes.status, count: Array.isArray(allBody) ? allBody.length : 'not array', preview: JSON.stringify(allBody).slice(0, 500) },
  })
}
