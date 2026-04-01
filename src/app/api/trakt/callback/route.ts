import { NextRequest, NextResponse } from 'next/server'
import { encrypt } from '@/lib/trakt-crypto'

export const runtime = 'nodejs'

export async function GET(req: NextRequest) {
  try {
    const code = req.nextUrl.searchParams.get('code')
    if (!code) {
      return redirectWithMessage(req, 'error', 'no_code')
    }

    const clientId = process.env.TRAKT_CLIENT_ID
    const clientSecret = process.env.TRAKT_CLIENT_SECRET
    if (!clientId || !clientSecret) {
      return redirectWithMessage(req, 'error', 'missing_env')
    }

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
      const err = await tokenRes.text()
      return redirectWithMessage(req, 'error', err.slice(0, 100))
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

    // Return HTML page that sets cookie via Set-Cookie header and redirects client-side
    // This avoids the Next.js/Vercel issue with cookies on redirect responses
    const html = `<!DOCTYPE html><html><head><meta http-equiv="refresh" content="0;url=/profile?trakt=connected"></head><body>Connecting...</body></html>`

    return new NextResponse(html, {
      status: 200,
      headers: {
        'Content-Type': 'text/html',
        'Set-Cookie': `trakt_session=${session}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${90 * 24 * 60 * 60}${process.env.NODE_ENV === 'production' ? '; Secure' : ''}`,
      },
    })
  } catch (e) {
    return redirectWithMessage(req, 'error', String(e).slice(0, 100))
  }
}

function redirectWithMessage(req: NextRequest, status: string, reason: string) {
  return NextResponse.redirect(
    new URL(`/profile?trakt=${status}&reason=${encodeURIComponent(reason)}`, req.nextUrl.origin)
  )
}
