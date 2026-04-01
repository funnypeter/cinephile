import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
  const clientId = process.env.TRAKT_CLIENT_ID
  if (!clientId) return NextResponse.json({ error: 'TRAKT_CLIENT_ID not configured' }, { status: 500 })

  const origin = process.env.NEXT_PUBLIC_BASE_URL || req.nextUrl.origin
  const redirectUri = `${origin}/api/trakt/callback`

  const url = new URL('https://trakt.tv/oauth/authorize')
  url.searchParams.set('response_type', 'code')
  url.searchParams.set('client_id', clientId)
  url.searchParams.set('redirect_uri', redirectUri)

  return NextResponse.redirect(url.toString())
}
