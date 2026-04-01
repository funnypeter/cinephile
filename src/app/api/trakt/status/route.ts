import { NextRequest, NextResponse } from 'next/server'
import { decrypt } from '@/lib/trakt-crypto'

export async function GET(req: NextRequest) {
  const cookie = req.cookies.get('trakt_session')?.value
  if (!cookie) return NextResponse.json({ connected: false })

  const raw = decrypt(cookie)
  if (!raw) return NextResponse.json({ connected: false })

  const session = JSON.parse(raw)
  return NextResponse.json({
    connected: true,
    username: session.username,
  })
}
