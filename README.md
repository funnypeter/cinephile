# Cinephile — TV Tracker

A Letterboxd-style TV tracker built with Next.js 15, Tailwind CSS, and the TMDB API.

## Setup

### 1. Install dependencies
```bash
npm install
```

### 2. Add your TMDB API key
Copy `.env.local.example` to `.env.local`:
```bash
cp .env.local.example .env.local
```
Then open `.env.local` and replace the placeholder with your real key:
```
TMDB_API_KEY=your_actual_key_here
```
Get a free key at: https://www.themoviedb.org/settings/api

### 3. Run the dev server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000)

## Features
- 🏠 **Home** — Trending shows, genre filter, popular grid, watchlist preview, weekly stats
- 🔍 **Search** — Instant search with debounce, trending shortcuts
- 📺 **Show Details** — Backdrop hero, cast, season/episode browser, network info
- 📝 **Log** — Rate (1–5 stars), write a review, toggle spoiler warning
- 📋 **Lists** — Watchlist grid + full watch diary
- 👤 **Profile** — Stats overview + recent activity feed

## Tech Stack
- **Next.js 15** (App Router, Server Components)
- **Tailwind CSS** — custom design system (dark cinema theme)
- **Zustand** — client state (watchlist + diary, persisted to localStorage)
- **TMDB API** — all show data via server-side proxy route (`/api/tmdb`)

## Project Structure
```
src/
  app/
    api/tmdb/route.ts   # Server-side TMDB proxy (keeps API key safe)
    page.tsx            # Home (server component)
    search/page.tsx     # Search
    show/[id]/page.tsx  # Show details (server component)
    log/page.tsx        # Log a show
    lists/page.tsx      # Watchlist + diary
    profile/page.tsx    # Profile + stats
  components/
    BottomNav.tsx
    HomeClient.tsx
    ShowClient.tsx
    PosterCard.tsx
  lib/
    tmdb.ts             # Server-side TMDB fetch (uses TMDB_API_KEY)
    api.ts              # Client-side fetch (calls /api/tmdb proxy)
    store.ts            # Zustand store
    types.ts            # TypeScript types
```
