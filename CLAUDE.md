# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What This Is

YouTube keyword research tool (Vietnamese-first, i18n vi/en). React SPA on Vercel + Supabase backend. Users bring their own YouTube Data API key.

## Commands

```bash
npm run dev              # Vite dev server (port 5173)
npm run build            # tsc -b && vite build
npm run lint             # ESLint with --fix
npm test                 # Vitest (watch mode)
npx vitest run           # All tests once
npx vitest run src/hooks/useOnlineStatus.test.ts   # Single test file
npm run test:coverage    # Coverage — 80% thresholds enforced on lines/functions/branches/statements
npm run doctor           # react-doctor (also runs in CI on every PR/push to main)
```

Supabase backend (migrations + Edge Functions) auto-deploys via GitHub Actions on push to `main` when `supabase/**` changes. Requires secrets: `SUPABASE_ACCESS_TOKEN`, `POSTGRES_PASSWORD`, `PROJECT_REF`. Frontend deploys to Vercel on push.

## Architecture

### Data flow (the core thing to understand)

```
React (src/lib/youtube.ts)
  → supabase.functions.invoke('youtube-search', { action, params })
    → Edge Function (supabase/functions/youtube-search/index.ts)
      - verifies user JWT
      - reads user's YouTube API key from user_api_keys table (api_key_encrypted)
      - proxies to YouTube Data API v3
      - logs quota to api_usage, search queries to search_history (fire-and-forget)
  ← { data, totalResults } envelope
```

The client never holds the YouTube API key. `src/lib/youtube.ts` is the only file that talks to the proxy; pages/hooks call its exported functions (`searchVideos`, `getVideoStats`, `getTrendingVideos`, `getChannelStats`, `analyzeKeyword`, `getSuggestions`).

- `youtube-search` actions: `search` | `videos` | `channels` | `videoCategories`. Quota costs: search=100, others=1 (free tier 10k/day ≈ 100 searches).
- `youtube-suggest` Edge Function (no JWT) → `suggestqueries.google.com`, free autocomplete, zero quota.
- Keyword "analysis" is computed client-side in `analyzeKeyword` from top-video stats (competition = f(resultCount), engagement = (likes+comments)/views).
- Channel search has no native YouTube endpoint — `searchChannelsByKeyword` searches videos then batch-fetches channel stats.

### Quota cost of every change

Any feature that adds a `search` call costs 100 units of the user's daily 10k. `videos`/`channels` calls cost 1. Batch by design (50 IDs per call). Prefer caching (React Query) over re-searching.

### Frontend structure

- State: TanStack Query v5 for ALL server data. Cache persisted to IndexedDB (`src/lib/queryPersister.ts`, 24h maxAge, `auth` queryKey never persisted, only successful queries persisted) — this is the offline/PWA story together with the custom service worker `src/sw.ts` (injectManifest strategy, not auto-generated).
- Pattern: `src/hooks/use*.ts` wrap supabase calls + React Query. Mutations invalidate query keys they affect. Global defaults in `src/main.tsx`: staleTime 60s, keepPreviousData.
- Auth: Supabase email/password (email confirmation disabled — users treated as confirmed immediately). `useAuth`/`requireAuth` in `src/lib/supabase.ts`. Dev-only mock auth fallback (`dev@example.com` / `password`) when env vars are placeholder; production never falls back.
- All routes lazy-loaded in `src/App.tsx`, wrapped by `AuthLayout` (auth pages) or `MainLayout` (app pages). Pages in `src/pages/`, one per route.
- UI: shadcn/ui new-york style in `src/components/ui/` (Radix + Tailwind v4, `components.json`). Path alias `@/` → `src/`.
- i18n: context provider in `src/lib/i18n/` with `translations.ts` (vi/en). Vietnamese is default locale — new UI strings need both.
- CSP and SPA rewrites live in `vercel.json`. If you add a new external domain the client talks to, it must be added to the CSP `connect-src` there.

### Database (supabase/migrations/)

Single schema file: `20260728000000_tube_atlas_schema.sql`. Tables: `profiles`, `user_api_keys` (unique per user_id+provider), `search_history`, `saved_keywords`, `saved_videos` (unique user_id+video_id), `saved_channels`, `api_usage`. Every table has RLS with `auth.uid() = user_id` policies — the anon key is public by design, so RLS is the only data protection. Any new table MUST have RLS policies.

### Conventions

- `api_key_encrypted` is stored as plaintext despite the name (no encryption layer) — don't assume decryption exists.
- `drop policy if exists` + recreate pattern in migrations keeps the schema file idempotent; follow it.
- Tailwind v4 (CSS-based config in `src/index.css`, no tailwind.config.js).
