import { NextRequest, NextResponse } from 'next/server'
import { decrypt, encrypt } from '@/lib/trakt-crypto'

export const runtime = 'nodejs'

const TRAKT_BASE = 'https://api.trakt.tv'

async function getSession(req: NextRequest) {
  const cookie = req.cookies.get('trakt_session')?.value
  if (!cookie) return null
  const raw = decrypt(cookie)
  if (!raw) return null
  return JSON.parse(raw) as {
    access_token: string
    refresh_token: string
    expires_at: number
    username: string
  }
}

async function refreshToken(session: { refresh_token: string; username: string }) {
  const res = await fetch('https://api.trakt.tv/oauth/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'User-Agent': 'Cinephile/1.0' },
    body: JSON.stringify({
      refresh_token: session.refresh_token,
      client_id: process.env.TRAKT_CLIENT_ID,
      client_secret: process.env.TRAKT_CLIENT_SECRET,
      grant_type: 'refresh_token',
    }),
  })
  if (!res.ok) return null
  const tokens = await res.json()
  return {
    access_token: tokens.access_token,
    refresh_token: tokens.refresh_token,
    expires_at: Date.now() + tokens.expires_in * 1000,
    username: session.username,
  }
}

async function handleRequest(req: NextRequest, method: string) {
  const endpoint = req.nextUrl.searchParams.get('endpoint')
  if (!endpoint) return NextResponse.json({ error: 'Missing endpoint' }, { status: 400 })

  let session = await getSession(req)
  if (!session) return NextResponse.json({ error: 'not_authenticated' }, { status: 401 })

  const clientId = process.env.TRAKT_CLIENT_ID!
  let updatedCookie: string | null = null

  // Refresh if expired
  if (Date.now() >= session.expires_at) {
    const refreshed = await refreshToken(session)
    if (!refreshed) {
      const res = NextResponse.json({ error: 'not_authenticated' }, { status: 401 })
      res.cookies.delete('trakt_session')
      return res
    }
    session = refreshed
    updatedCookie = encrypt(JSON.stringify(session))
  }

  const url = new URL(TRAKT_BASE + endpoint)
  req.nextUrl.searchParams.forEach((value, name) => {
    if (name !== 'endpoint') url.searchParams.set(name, value)
  })

  const fetchOptions: RequestInit = {
    method,
    headers: {
      'Content-Type': 'application/json',
      'User-Agent': 'Cinephile/1.0',
      'trakt-api-version': '2',
      'trakt-api-key': clientId,
      'Authorization': `Bearer ${session.access_token}`,
    },
  }

  if (method === 'POST' || method === 'DELETE') {
    fetchOptions.body = await req.text()
  }

  const traktRes = await fetch(url.toString(), fetchOptions)
  const data = traktRes.headers.get('content-type')?.includes('json')
    ? await traktRes.json()
    : null

  const response = NextResponse.json(data, { status: traktRes.status })

  if (updatedCookie) {
    response.cookies.set('trakt_session', updatedCookie, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 90 * 24 * 60 * 60,
    })
  }

  return response
}

export async function GET(req: NextRequest) {
  return handleRequest(req, 'GET')
}

export async function POST(req: NextRequest) {
  return handleRequest(req, 'POST')
}
