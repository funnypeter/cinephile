import { NextRequest, NextResponse } from 'next/server'

export const runtime = 'nodejs'

export async function GET(req: NextRequest) {
  const clientId = process.env.TRAKT_CLIENT_ID
  const clientSecret = process.env.TRAKT_CLIENT_SECRET
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL

  // Test the token endpoint with a fake code to see what we get back
  const res = await fetch('https://api.trakt.tv/oauth/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'User-Agent': 'Cinephile/1.0' },
    body: JSON.stringify({
      code: 'debug_test',
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: `${baseUrl}/api/trakt/callback`,
      grant_type: 'authorization_code',
    }),
  })

  const contentType = res.headers.get('content-type')
  const body = await res.text()

  return NextResponse.json({
    env: {
      hasClientId: !!clientId,
      hasClientSecret: !!clientSecret,
      baseUrl,
    },
    response: {
      status: res.status,
      contentType,
      bodyPreview: body.slice(0, 300),
    },
  })
}
