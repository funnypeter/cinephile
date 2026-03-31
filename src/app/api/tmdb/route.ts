import { NextRequest, NextResponse } from 'next/server'

const TMDB_BASE = 'https://api.themoviedb.org/3'

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl
  const endpoint = searchParams.get('endpoint')
  if (!endpoint) return NextResponse.json({ error: 'Missing endpoint' }, { status: 400 })

  const key = process.env.TMDB_API_KEY
  if (!key) return NextResponse.json({ error: 'TMDB_API_KEY not configured' }, { status: 500 })

  const url = new URL(TMDB_BASE + endpoint)
  url.searchParams.set('api_key', key)

  searchParams.forEach((value, name) => {
    if (name !== 'endpoint') url.searchParams.set(name, value)
  })

  const res = await fetch(url.toString(), { next: { revalidate: 3600 } })
  const data = await res.json()
  return NextResponse.json(data, { status: res.status })
}
