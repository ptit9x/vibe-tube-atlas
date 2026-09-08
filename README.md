# ▶ Vibe Tube Atlas

YouTube keyword research tool — analyze keywords, discover trending videos and channels, assess competition and engagement metrics.

## ✨ Features

- **Keyword Explorer** — Analyze any keyword: competition level, avg views/likes/comments, engagement rate
- **Video Search** — Search videos by keyword, sort by views/date/rating
- **Channel Analyzer** — Find channels by keyword, view subscriber/video/total view counts
- **Trending** — Trending videos by country and category
- **Saved Items** — Bookmark keywords, videos, and channels
- **Search History** — Track past searches with quota usage
- **Per-user API Keys** — Each user provides their own YouTube Data API key (free 10,000 quota/day)
- **Autocomplete** — Free keyword suggestions via Google suggest endpoint (zero quota cost)
- **i18n** — Vietnamese (default) + English
- **Dark mode** + responsive (mobile-first)

## 🛠 Tech Stack

- **Frontend:** React 19 + Vite 8 + TypeScript 6 + TailwindCSS v4
- **UI:** shadcn/ui (new-york) + Lucide icons + Framer Motion
- **Backend:** Supabase (PostgreSQL + Auth + Edge Functions)
- **API:** YouTube Data API v3 (per-user keys)
- **State:** TanStack Query v5 (server data)

## 🏗 Architecture

```
User → React frontend → Supabase Edge Function (proxy) → YouTube Data API v3
                         ↓ reads user's API key from user_api_keys table
                         ↓ logs quota usage to api_usage table
                         ↓ saves search to search_history table
```

### Key Design Decisions

1. **Per-user API keys** — Each user brings their own YouTube API key. Stored in `user_api_keys` table.
2. **Edge Function proxy** (`youtube-search`) — Reads user's key server-side, proxies to YouTube API. Keeps keys out of client bundle.
3. **Free autocomplete** (`youtube-suggest`) — Uses `suggestqueries.google.com` (public, no key, zero quota).
4. **Estimated metrics** — Competition estimated from result count, engagement from average views/likes of top videos.

## 📁 Project Structure

```
src/
├── pages/
│   ├── Dashboard.tsx           # Overview: quota, recent searches, saved items
│   ├── KeywordExplorer.tsx     # Keyword analysis + metrics
│   ├── Trending.tsx            # Trending by country/category
│   ├── VideoAnalyzer.tsx       # Video search + stats
│   ├── ChannelAnalyzer.tsx     # Channel search + stats
│   ├── SearchHistory.tsx       # Past searches
│   ├── ApiKeySettings.tsx      # YouTube API key management
│   ├── Profile.tsx             # User profile + settings
│   ├── Login/Register/...      # Auth pages
│   └── NotFound/ServerError/...# Error pages
├── hooks/
│   ├── useKeywords.ts          # Keyword analysis + saved keywords
│   ├── useVideos.ts            # Video search + saved videos
│   ├── useChannels.ts          # Channel search + saved channels
│   ├── useApiKey.ts            # API key CRUD + quota tracking
│   └── useSearchHistory.ts     # History + clear
├── lib/
│   ├── youtube.ts              # YouTube API client (calls Edge Function proxy)
│   ├── csv.ts                  # CSV export utility
│   ├── dateUtils.ts            # Date formatting
│   ├── supabase.ts             # Supabase client
│   └── i18n/                   # Internationalization (vi/en)
├── constants/
│   └── youtube.ts              # Categories, countries, languages
├── types/
│   └── index.ts                # YouTube domain types
└── components/
    ├── ui/                     # shadcn/ui components
    ├── shared/                 # Shared components (Avatar, EmptyState, etc.)
    └── PageHeader.tsx          # Gradient page header
```

## 🚀 Setup

### 1. Install

```bash
npm install
```

### 2. Configure environment

```env
# .env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

### 3. Deploy backend

The schema and Edge Functions auto-deploy via GitHub Actions when you push to `main`.

**Required GitHub Secrets:**

| Secret | How to Get |
|--------|------------|
| `SUPABASE_ACCESS_TOKEN` | Supabase Dashboard → Settings → Access Tokens |
| `POSTGRES_PASSWORD` | Supabase Dashboard → Database → Connection string |
| `PROJECT_REF` | Supabase Dashboard → Settings → General → Project Ref |

### 4. Run

```bash
npm run dev      # Dev server (port 5173)
npm run build    # Production build
npm run lint     # ESLint
```

## 📊 YouTube API Quota

| Endpoint | Cost |
|----------|------|
| `search.list` | **100 units** |
| `videos.list` | 1 unit |
| `channels.list` | 1 unit |

Free tier: **10,000 units/day** per API key (~100 searches/day).

## 📡 Daily Niche Scan (Niche Radar)

Automated multi-market niche keyword discovery that runs **at zero API quota cost**
(Google Suggest + YouTube page scraping only — no `search.list` calls).

**How it works:**
1. `pg_cron` fires daily at 01:30 UTC (08:30 Vietnam) and posts one
   `daily-scan` Edge Function invocation per enabled user (via `pg_net`).
2. The function expands industry seed keywords (28 industries across 8
   RPM-weighted categories) through the free Google Suggest endpoint in the
   language of each selected market (vi/en/ja/ko).
3. Candidates are validated by scraping YouTube search results
   (`ytInitialData`), scored with the shared Difficulty/Niche formulas, and
   enriched with an estimated RPM (`market baseRpm × category multiplier`).
4. Results land in `discovered_keywords` and surface in the **Niche Radar**
   page with a "Recommended markets" analysis ranked by `est. RPM × niche score`.

**Setup (one-time, after deploying):**
1. Generate a random secret, then in Supabase Dashboard → SQL Editor run:
   `ALTER DATABASE postgres SET app.cron_secret TO '<your-secret>';`
2. Add the same value as an Edge Function secret `CRON_SECRET` (Dashboard →
   Edge Functions → Secrets). To rotate, change both places.
3. Trigger a manual run to verify:
   `curl -X POST https://<ref>.supabase.co/functions/v1/daily-scan -H "Authorization: Bearer <secret>" -H "Content-Type: application/json" -d '{"user_id":"<auth-uid>"}'`

**RPM disclaimer:** market/category RPM values are heuristic estimates from
public creator reports, not YouTube-published data. They are constants in
`supabase/functions/_shared/markets.ts` — tune them in one place.

## 📝 License

MIT
