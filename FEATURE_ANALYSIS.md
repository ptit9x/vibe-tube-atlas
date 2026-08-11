# Vibe Tube Atlas — Feature Gap Analysis & Development Plan

> **Objective**: Analyze VidIQ and TubeBuddy features, compare with current capabilities, and plan features to implement.

---

## 1. Current Vibe Tube Atlas Features

| # | Feature | Status | API Source |
|---|---------|--------|------------|
| 1 | Keyword Explorer — competition, engagement, avg views/likes/comments | ✅ | YouTube search.list + videos.list |
| 2 | Opportunity Score (0-100) — competition + views + engagement algorithm | ✅ | Computed from API data |
| 3 | Video Search/Analyzer — search by keyword, sort by views/date/rating | ✅ | YouTube search.list |
| 4 | Channel Analyzer — find channels by keyword, view stats | ✅ | search.list → channels.list |
| 5 | Trending — by country and category | ✅ | videos.list (chart=mostPopular) |
| 6 | Autocomplete/Suggestions — free keyword suggestions | ✅ | suggestqueries.google.com (0 quota) |
| 7 | Related Keywords — variations from autocomplete | ✅ | suggestqueries.google.com (0 quota) |
| 8 | Saved Items — bookmark keywords, videos, channels | ✅ | Supabase (PostgreSQL) |
| 9 | Search History — track past searches with quota usage | ✅ | Supabase (PostgreSQL) |
| 10 | Per-user API Keys — each user brings their own YouTube API key | ✅ | Supabase + Edge Function proxy |
| 11 | Quota Tracking — daily usage, remaining quota | ✅ | api_usage table |
| 12 | CSV Export — export keywords, videos, channels | ✅ | Client-side CSV generation |
| 13 | i18n — Vietnamese (default) + English | ✅ | Custom i18n system |
| 14 | Views Distribution Chart — visual bar chart of top videos | ✅ | Computed from API data |
| 15 | Dark mode + responsive (mobile-first PWA) | ✅ | TailwindCSS |

---

## 2. VidIQ & TubeBuddy Feature Analysis

### 2.1 Keyword Research (Both Tools)

| Feature | VidIQ | TubeBuddy | Difficulty | Feasibility |
|---------|-------|-----------|------------|-------------|
| **Search Volume Estimate** — monthly searches per keyword | ✅ (1-100 scale) | ✅ (exact numbers) | Hard | ⚠️ YouTube API has NO search volume. Workaround: Google Trends API + estimation from autocomplete frequency + top video view counts |
| **Keyword Difficulty/Competition Score** — numerical 0-100 | ✅ Vidor Score | ✅ Competition Score | Medium | ✅ Can build from result count, avg subscriber count of ranking channels, video age vs views |
| **Related Keywords** — keyword suggestions | ✅ Questions, Autosuggest | ✅ Keyword Explorer | Easy | ✅ Already have via autocomplete. Can enhance with question-based queries (how, what, why) |
| **Keyword Trend History** — is keyword growing/declining? | ✅ | ✅ | Medium | ✅ Google Trends API (free, unofficial) + store snapshots over time |
| **Search Volume Over Time** — seasonal trends | ✅ | ✅ | Medium | ⚠️ Same as above — Trends API proxy |
| **Long-tail keyword discovery** | ✅ | ✅ | Easy | ✅ Autocomplete prefix expansion (a-z recursion) |

### 2.2 Video SEO (Both Tools)

| Feature | VidIQ | TubeBuddy | Difficulty | Feasibility |
|---------|-------|-----------|------------|-------------|
| **Video SEO Scorecard** — score video's SEO quality (0-100) | ✅ (8-point checklist) | ✅ Best Practice Audit | Easy | ✅ Check: title length, description length, tag count, keyword in title/desc/tags, has thumbnail, duration category |
| **Title Analysis** — length, keyword position, power words | ✅ | ✅ | Easy | ✅ Title parsing + keyword density |
| **Description Analysis** — word count, links, hashtags | ✅ | ✅ | Easy | ✅ Description parsing |
| **Tag Analysis** — count, relevance, missing tags | ✅ | ✅ | Easy | ✅ Tag list analysis |
| **Thumbnail Analyzer** — quality, text detection | ✅ | ✅ | Hard | ⚠️ Needs image processing (OCR, face detection, text overlay detection) |
| **AI Title Generator** — generate optimized titles | ✅ AI Coach | ✅ (GPT-powered) | Medium | ✅ Need LLM API integration (OpenAI/Gemini/Claude) |
| **AI Description Generator** — SEO-optimized descriptions | ✅ | ✅ | Medium | ✅ Same LLM integration |
| **AI Tag Generator** — suggest tags from topic | ✅ | ✅ | Medium | ✅ Same LLM integration |
| **SEO Checklist** — actionable per-video tasks | ✅ | ✅ Best Practice Audit | Easy | ✅ Rule-based checklist engine |

### 2.3 Channel Analytics & Competitor Analysis

| Feature | VidIQ | TubeBuddy | Difficulty | Feasibility |
|---------|-------|-----------|------------|-------------|
| **Competitor Tracking** — monitor specific channels | ✅ | ✅ Competitor Scorecard | Medium | ✅ Store channel IDs, fetch latest videos + stats periodically |
| **Channel Audit** — comprehensive channel health report | ✅ | ✅ Health Report | Medium | ✅ Aggregate: upload frequency, avg views, engagement, subscriber growth, best/worst videos |
| **Channel Comparison** — side-by-side stats | ✅ | ✅ | Easy | ✅ Already have channel search, add compare view |
| **Subscriber Growth Tracking** — track subscriber count over time | ✅ | ✅ | Medium | ✅ Store daily/weekly snapshots in DB |
| **Upload Schedule Analysis** — best days/times to publish | ✅ | ✅ | Medium | ✅ Analyze publishAt timestamps of top videos |
| **Views Per Hour (VPH)** — video momentum metric | ✅ | ✅ | Easy | ✅ viewCount / hours since publish |
| **Outlier Videos** — videos that over/underperform channel average | ✅ | ✅ | Easy | ✅ Compare individual video views vs channel average |
| **Channel Milestone Tracking** | ✅ | ✅ | Low | ✅ Track subscriber milestones |

### 2.4 Content Ideation & Trends

| Feature | VidIQ | TubeBuddy | Difficulty | Feasibility |
|---------|-------|-----------|------------|-------------|
| **Daily Content Ideas** — AI-suggested topics | ✅ Daily Ideas | ❌ | Medium | ✅ Combine: trending keywords + autocomplete + niche analysis → LLM generates ideas |
| **Trend Alerts** — real-time trending topic notifications | ✅ | ❌ | Medium | ✅ Cron job + push notifications (PWA) |
| **Rising Keywords** — keywords growing in popularity | ✅ | ✅ | Medium | ⚠️ Needs Trends API + historical tracking |
| **Niche Explorer** — explore profitable niches | ✅ | ❌ | Hard | ⚠️ Requires aggregate data across many searches |
| **Question Keywords** — "how to", "what is" queries | ✅ | ❌ | Easy | ✅ Autocomplete with question prefixes |
| **Content Gap Analysis** — topics competitors cover that you don't | ✅ | ❌ | Hard | ⚠️ Requires competitor video catalog comparison |

### 2.5 Productivity & Management Tools

| Feature | VidIQ | TubeBuddy | Difficulty | Feasibility |
|---------|-------|-----------|------------|-------------|
| **Bulk Title/Description/Tag Update** | ❌ | ✅ | Hard | ❌ Requires YouTube Content Manager API (OAuth, partner access). Not feasible for BYO-key model. |
| **Comment Management** | ✅ | ✅ | Hard | ❌ Requires YouTube Data API comment moderation (separate OAuth scope, daily management) |
| **A/B Testing** (titles, thumbnails) | ❌ | ✅ | Very Hard | ❌ Requires YouTube Content API for experiment management. Can only recommend, not execute. |
| **Bulk Card/End Screen Management** | ❌ | ✅ | Hard | ❌ Same limitation — requires channel-level OAuth |
| **Video Scheduling** | ❌ | ✅ | Hard | ❌ Same limitation |

> **Key Constraint**: Features that modify a user's YouTube channel (bulk updates, A/B testing, comment management) require **YouTube Content Manager API** with OAuth2 — not compatible with our "bring-your-own-API-key" architecture. These are browser extension features by nature.

### 2.6 Keyword Rank Tracking

| Feature | VidIQ | TubeBuddy | Difficulty | Feasibility |
|---------|-------|-----------|------------|-------------|
| **Video Rank Tracking** — where your video ranks for a keyword | ✅ | ✅ | Medium | ✅ search.list ordered by relevance → find video position |
| **Historical Rank Tracking** — rank changes over time | ✅ | ✅ | Medium | ✅ Store daily rank snapshots in DB |
| **Competitor Rank Tracking** | ✅ | ✅ | Medium | ✅ Track competitor video positions |

### 2.7 Data Visualization & Reporting

| Feature | VidIQ | TubeBuddy | Difficulty | Feasibility |
|---------|-------|-----------|------------|-------------|
| **Dashboard Charts** — visual analytics | ✅ | ✅ | Medium | ✅ Already have bar charts, add line/pie charts (recharts/visx) |
| **Export Reports** — PDF/CSV | ✅ | ✅ | Easy | ✅ Already have CSV, add PDF export |
| **Scheduled Email Reports** | ✅ | ❌ | Medium | ✅ Supabase Edge Function + cron + email |
| **Comparison Graphs** — before/after, multi-channel | ✅ | ✅ | Medium | ✅ Chart library integration |

---

## 3. Feasibility Assessment

### 3.1 Architecture Constraints

| Constraint | Impact | Mitigation |
|------------|--------|------------|
| **BYO API Key** (10K quota/day = ~100 searches) | Limits data-intensive features | Smart caching, quota-aware features, 0-quota autocomplete-first approach |
| **YouTube Data API v3 only** | No search volume, no real-time analytics | Google Trends API (free) for trends; estimation algorithms |
| **Web app (not browser extension)** | Can't inject into YouTube UI | Standalone dashboard experience; competitive differentiation |
| **No YouTube OAuth** | Can't manage user's channel/videos | Focus on research/analysis rather than channel management |
| **Supabase Edge Functions** (Deno) | Limited runtime | All heavy computation client-side or in Edge Functions |

### 3.2 Free/Alternative Data Sources (Zero Quota)

| Source | URL | Cost | Use Case |
|--------|-----|------|----------|
| Google Autocomplete | `suggestqueries.google.com` | Free | Keyword suggestions, related keywords, long-tail discovery |
| Google Trends (unofficial) | `trends.google.com/trends/api` | Free | Search interest over time, related queries, rising keywords |
| YouTube RSS feeds | `youtube.com/feeds/videos.xml?channel_id=` | Free | Latest video uploads (faster than search API for monitoring) |
| YouTube oEmbed | `youtube.com/oembed` | Free | Video metadata without API key |

---

## 4. Development Roadmap

### Phase 1: Enhanced Keyword Research (High Value, Low-Medium Effort)
**Goal**: Match VidIQ/TubeBuddy keyword research core capabilities

| # | Feature | Effort | Quota Impact | Priority |
|---|---------|--------|--------------|----------|
| 1.1 | **Enhanced Keyword Difficulty Score** — 0-100 numerical score using competition + channel authority + video age metrics | S (2h) | 0 extra | P0 |
| 1.2 | **Question Keywords** — autocomplete with "how/what/why/when/where" prefixes | S (1h) | 0 | P0 |
| 1.3 | **Long-tail Keyword Expansion** — a-z prefix sweep on autocomplete | M (3h) | 0 | P1 |
| 1.4 | **Google Trends Integration** — search interest chart, rising/related queries | M (4h) | 0 | P1 |
| 1.5 | **Keyword Multi-Compare** — side-by-side comparison of 2-5 keywords | S (2h) | Same as single | P1 |
| 1.6 | **Search Volume Estimation** — algorithm using Trends + top video views + result count | M (4h) | 0 | P2 |

### Phase 2: Video SEO Tools (High Value, Low Effort)
**Goal**: Video audit capabilities matching VidIQ/TubeBuddy SEO scorecards

| # | Feature | Effort | Quota Impact | Priority |
|---|---------|--------|--------------|----------|
| 2.1 | **Video SEO Scorecard** — title/description/tag analysis, keyword presence, SEO score (0-100) | M (4h) | 1 (videos.list) | P0 |
| 2.2 | **SEO Checklist** — actionable improvement suggestions per video | S (2h) | 0 (client-side) | P0 |
| 2.3 | **AI Title/Description/Tag Generator** — LLM-powered suggestions | M (4h) | 1 (videos.list) | P1 |
| 2.4 | **Tag Extractor** — extract and analyze tags from any video | S (1h) | 1 | P1 |
| 2.5 | **Title Analyzer** — power words, length, keyword position analysis | S (2h) | 0 | P2 |

### Phase 3: Channel Intelligence (High Value, Medium Effort)
**Goal**: Competitor tracking and channel analytics

| # | Feature | Effort | Quota Impact | Priority |
|---|---------|--------|--------------|----------|
| 3.1 | **Competitor Channel Tracking** — save channels, periodic stat snapshots | M (4h) | 1/channel/snapshot | P0 |
| 3.2 | **Channel Health Report** — upload frequency, avg views, engagement, best/worst videos | M (4h) | 1-3 calls | P0 |
| 3.3 | **Views Per Hour (VPH)** — momentum metric for each video | S (1h) | 0 (client-side) | P1 |
| 3.4 | **Outlier Detection** — videos that over/underperform channel average | S (2h) | 0 | P1 |
| 3.5 | **Upload Schedule Analysis** — best days/times, frequency | S (2h) | 1 (search.list) | P1 |
| 3.6 | **Channel Comparison** — side-by-side comparison view | S (2h) | 1-2 calls | P2 |
| 3.7 | **Subscriber Growth Tracking** — store and chart subscriber count over time | M (4h) | DB storage only | P2 |

### Phase 4: Content Ideation (Medium Value, Medium Effort)
**Goal**: AI-powered content discovery

| # | Feature | Effort | Quota Impact | Priority |
|---|---------|--------|--------------|----------|
| 4.1 | **Daily Content Ideas** — combine trending + autocomplete + niche → AI ideas | L (8h) | Mixed | P1 |
| 4.2 | **Content Gap Analysis** — compare competitor video catalogs | M (4h) | 2-3 calls | P2 |
| 4.3 | **Rising Keywords** — track keyword popularity trends over time | M (4h) | DB storage | P2 |
| 4.4 | **Niche Explorer** — aggregate keyword analysis for niches | L (6h) | Multiple | P3 |

### Phase 5: Rank Tracking (Medium Value, Medium Effort)
**Goal**: Track keyword rankings over time

| # | Feature | Effort | Quota Impact | Priority |
|---|---------|--------|--------------|----------|
| 5.1 | **Video Rank Checker** — find where a video ranks for a keyword | M (3h) | 100 (search.list) | P2 |
| 5.2 | **Historical Rank Tracking** — store daily rank snapshots | M (4h) | DB storage | P2 |
| 5.3 | **Rank Alerts** — notify when rank changes significantly | S (2h) | DB storage | P3 |

### Phase 6: Polish & Pro Features
**Goal**: Competitive differentiation

| # | Feature | Effort | Priority |
|---|---------|--------|----------|
| 6.1 | **Enhanced Dashboard** — charts, trends, insights overview | M (4h) | P1 |
| 6.2 | **PDF Reports** — export analysis as PDF | S (2h) | P2 |
| 6.3 | **Scheduled Email Reports** — Supabase cron + email | M (4h) | P2 |
| 6.4 | **PWA Push Notifications** — trend alerts, rank changes | M (6h) | P3 |
| 6.5 | **Multi-channel Bulk Analysis** — analyze multiple channels at once | M (4h) | P3 |

---

## 5. Recommended Implementation Order

```
Phase 1 (Week 1-2): Enhanced Keyword Research
  ├── 1.1 Enhanced Difficulty Score  ⚡ Quick win
  ├── 1.2 Question Keywords          ⚡ Quick win  
  ├── 2.1 Video SEO Scorecard        ⚡ High impact
  └── 2.2 SEO Checklist              ⚡ Quick win

Phase 2 (Week 3-4): Video SEO + Channel Intelligence
  ├── 1.4 Google Trends Integration
  ├── 2.3 AI Title/Description Gen
  ├── 3.1 Competitor Tracking
  ├── 3.2 Channel Health Report
  └── 3.3 VPH + 3.4 Outlier Detection

Phase 3 (Week 5-6): Content Discovery
  ├── 1.3 Long-tail Expansion
  ├── 1.5 Keyword Multi-Compare
  ├── 3.5 Upload Schedule Analysis
  ├── 4.1 Daily Content Ideas
  └── 6.1 Enhanced Dashboard

Phase 4 (Week 7-8): Rank Tracking + Pro
  ├── 5.1 Video Rank Checker
  ├── 3.6 Channel Comparison
  ├── 3.7 Subscriber Growth Tracking
  ├── 6.2 PDF Reports
  └── 6.3 Email Reports
```

---

## 6. Technical Implementation Notes

### 6.1 New Edge Functions Needed

```
supabase/functions/
├── youtube-search/        # ✅ Exists
├── youtube-suggest/       # ✅ Exists
├── google-trends/         # NEW — proxy for trends.google.com API
├── youtube-rss/           # NEW — fetch channel RSS feeds (0 quota video discovery)
└── ai-assistant/          # NEW — LLM proxy for title/desc/tag generation
```

### 6.2 New Database Tables

```sql
-- Competitor tracking
CREATE TABLE tracked_channels (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES auth.users,
  channel_id TEXT NOT NULL,
  channel_title TEXT,
  thumbnail_url TEXT,
  -- Latest snapshot
  subscriber_count INT,
  video_count INT,
  view_count INT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, channel_id)
);

-- Growth snapshots (daily)
CREATE TABLE channel_snapshots (
  id UUID PRIMARY KEY,
  channel_id TEXT NOT NULL,
  subscriber_count INT,
  video_count INT,
  view_count INT,
  captured_at TIMESTAMPTZ DEFAULT NOW()
);

-- Keyword rank tracking
CREATE TABLE tracked_keywords (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES auth.users,
  keyword TEXT NOT NULL,
  video_id TEXT,           -- which video to track
  current_rank INT,        -- position in search results
  best_rank INT,
  tracked_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, keyword, video_id)
);

-- Keyword volume trend data
CREATE TABLE keyword_trends (
  id UUID PRIMARY KEY,
  keyword TEXT NOT NULL,
  interest_value INT,      -- 0-100 from Google Trends
  related_queries JSONB,
  captured_at TIMESTAMPTZ DEFAULT NOW()
);
```

### 6.3 LLM Integration for AI Features

```
Options:
1. OpenAI GPT-4o-mini (cheap, fast, good for SEO content)
2. Google Gemini Flash (free tier, fast)
3. Anthropic Claude Haiku (high quality, low cost)

Recommended: Gemini Flash (free tier covers most usage)
→ Edge Function proxy with user's optional API key or platform key
```

### 6.4 Google Trends Integration (No Official API)

```typescript
// Unofficial Google Trends endpoint (free, no key)
// GET https://trends.google.com/trends/api/widgetdata/multiline
// Returns: interest over time (0-100), related queries, rising topics

// Edge Function approach:
// 1. Fetch widget tokens from trends.google.com
// 2. Fetch interest data using token
// 3. Parse and return as JSON
```

---

## 7. VidIQ & TubeBuddy Pricing Comparison

| Plan | VidIQ | TubeBuddy |
|------|-------|-----------|
| **Free** | $0 — 150 AI credits/mo, limited features | $0 — Basic tools, limited features |
| **Entry** | Boost: $16.58/mo — 2,000 AI credits, 30+ tools | Pro: ~$4-9/mo — Search optimization |
| **Mid** | Max: $39/mo — 6,000 AI credits, 5x AI | — |
| **Pro** | Boost+Coaching: Custom — 1-on-1 coaching | Legend: ~$29-89/mo — All 50+ tools, A/B testing |
| **Enterprise** | Custom — Multi-channel, teams | Custom — Multi-channel, teams |

> **VTA Advantage**: 100% free (BYO API key), no AI credit limits

## 8. Competitive Moats (What VTA Can't Easily Replicate)

| Moat | Owner | Why It's Hard |
|------|-------|---------------|
| **Search Volume Database** | Both | Years of scraping + ML models. YouTube doesn't expose search volume. |
| **A/B Testing Engine** | TubeBuddy | Requires YouTube Data API write access (OAuth `youtube.force-ssl` scope) |
| **Trend Detection Infrastructure** | Both | Requires monitoring millions of channels 24/7 |
| **Thumbnail CV/ML Scoring** | Both | Computer vision models trained on thumbnail data |
| **Best Time to Publish** | Both | Requires YouTube Analytics API (authenticated, own channel only) |

## 9. Competitive Differentiation Strategy

Since vibe-tube-atlas can't compete on browser extension features (bulk management, A/B testing), focus on:

1. **Mobile-first experience** — VidIQ/TubeBuddy are desktop extensions; VTA is a PWA
2. **BYO API key = Unlimited usage** — No subscription tier limits
3. **Vietnamese-first** — Niche market with no Vietnamese-language competitor
4. **Transparent metrics** — Show exactly how scores are calculated (no black box)
5. **0-quota-first design** — Maximize free data sources before spending API quota
6. **AI-powered insights** — Modern LLM integration for content ideation
