import { NextRequest, NextResponse } from 'next/server'
import { encrypt } from '@/lib/trakt-crypto'

export async function GET(req: NextRequest) {
  const code = req.nextUrl.searchParams.get('code')
  if (!code) return NextResponse.redirect(new URL('/profile?trakt=error', req.nextUrl.origin))

  const clientId = process.env.TRAKT_CLIENT_ID!
  const clientSecret = process.env.TRAKT_CLIENT_SECRET!
  const redirectUri = `${req.nextUrl.origin}/api/trakt/callback`

  const tokenRes = await fetch('https://api.trakt.tv/oauth/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      code,
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: redirectUri,
      grant_type: 'authorization_code',
    }),
  })

  if (!tokenRes.ok) {
    return NextResponse.redirect(new URL('/profile?trakt=error', req.nextUrl.origin))
  }

  const tokens = await tokenRes.json()

  // Fetch username
  const userRes = await fetch('https://api.trakt.tv/users/me', {
    headers: {
      'Content-Type': 'application/json',
      'trakt-api-version': '2',
      'trakt-api-key': clientId,
      'Authorization': `Bearer ${tokens.access_token}`,
    },
  })
  const user = userRes.ok ? await userRes.json() : null

  const session = encrypt(JSON.stringify({
    access_token: tokens.access_token,
    refresh_token: tokens.refresh_token,
    expires_at: Date.now() + tokens.expires_in * 1000,
    username: user?.username ?? 'unknown',
  }))

  const response = NextResponse.redirect(new URL('/profile?trakt=connected', req.nextUrl.origin))
  response.cookies.set('trakt_session', session, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 90 * 24 * 60 * 60, // 90 days
  })

  return response
}
