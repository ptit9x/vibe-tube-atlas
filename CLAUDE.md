# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Vibe Tube Atlas is a YouTube keyword research tool targeting Vietnamese users. Mobile-first SPA with desktop sidebar support. Default language is Vietnamese (`vi`).

**Stack**: React 19 + Vite 8 + TypeScript 6 + TailwindCSS v4 + Supabase (PostgreSQL + Auth + Edge Functions) + YouTube Data API v3

## Commands

```bash
npm run dev              # Start dev server (Vite, port 5173)
npm run build            # TypeScript check + production build
npm run lint             # ESLint with --fix (includes security plugin)
npm run preview          # Preview production build
```

## Architecture

### Provider Hierarchy (main.tsx)
`StrictMode > QueryClientProvider > ThemeProvider > I18nProvider > ErrorBoundary > Router > App`

### Routing (react-router-dom v7)
- **Auth routes** (`/login`, `/register`, `/forgot-password`, `/reset-password`) → `AuthLayout`
- **Standalone**: `/verify-email` (no layout wrapper)
- **App routes** (`/dashboard`, `/keywords`, `/trending`, `/videos`, `/channels`, `/history`, `/settings/api-key`, `/settings/language`, `/settings/password`, `/profile`) → `MainLayout` (auth guard + email confirmation guard, bottom nav on mobile, `DesktopSidebar` on `lg:` breakpoint)
- All pages are lazy-loaded via `React.lazy()`

### State Management
- **TanStack Query v5** (`src/hooks/`) — all server data (YouTube API calls, Supabase queries)
- **No Zustand stores** — UI state is local to components

### Data Flow Pattern
```
User → React frontend → Supabase Edge Function (proxy) → YouTube Data API v3
                         ↓ reads user's API key from user_api_keys table
                         ↓ logs quota usage to api_usage table
                         ↓ saves search to search_history table
```

### YouTube API Integration
- **Per-user API keys** — Each user brings their own YouTube Data API key (free 10,000 quota/day). Stored in `user_api_keys` table.
- **Edge Function proxy** (`youtube-search`) — Reads user's key server-side, proxies to YouTube API. Keeps keys out of client bundle.
- **Free autocomplete** (`youtube-suggest`) — Uses `suggestqueries.google.com` (public, no key, zero quota).
- **Estimated metrics** — Competition from result count, engagement from avg views/likes.

### Path Aliases
`@/` maps to `src/` (configured in `vite.config.ts` and `tsconfig.app.json`).

### Component Library
shadcn/ui (new-york style, Radix primitives) in `src/components/ui/`. Custom shared components in `src/components/shared/`. Icons: Lucide React. Animations: Framer Motion.

### Internationalization
Custom i18n in `src/lib/i18n/` — React context provider with `useI18n()` hook. Translations in `src/lib/i18n/translations.ts`. Default language: Vietnamese (`vi`).

## Backend (Supabase)

### Database
- Migrations in `supabase/migrations/` — auto-deployed via GitHub Actions on push to `main` when `supabase/**` changes
- RLS (Row Level Security) on all tables — `auth.uid() = user_id` policies
- Key tables: `user_api_keys`, `search_history`, `saved_keywords`, `saved_videos`, `saved_channels`, `api_usage`

### Edge Functions
- `supabase/functions/youtube-search/` — Proxy for YouTube Data API v3 (search, videos, channels, videoCategories)
- `supabase/functions/youtube-suggest/` — Free autocomplete via Google suggest endpoint

## Deployment
- **Frontend**: Vercel (SPA rewrite in vercel.json)
- **Database/Edge Functions**: Supabase CLI via GitHub Actions (`.github/workflows/deploy-supabase.yml`)
- CI triggers when `supabase/**` changes on branch `main`

## Key Files
- `src/types/index.ts` — YouTube domain types
- `src/lib/youtube.ts` — YouTube API client (calls Edge Function proxy)
- `src/constants/youtube.ts` — Category/country/language lists
- `src/hooks/useKeywords.ts` — Keyword analysis + saved keywords
- `src/hooks/useVideos.ts` — Video search + saved videos
- `src/hooks/useChannels.ts` — Channel search + saved channels
- `src/hooks/useApiKey.ts` — API key CRUD + quota tracking
