# Vibe Tube Atlas — YouTube Keyword Trend Research Tool Implementation Plan

> **For Hermes:** Use subagent-driven-development skill to implement this plan task-by-task.

**Goal:** Transform the cloned vibe-expense codebase into a web-based YouTube keyword trend research tool (similar to Tube Atlas), reusing the existing auth flow, UI components, and Supabase infrastructure.

**Architecture:** React 19 + Vite + TypeScript frontend (existing). Supabase Edge Functions (Deno) act as a proxy layer to YouTube Data API v3, keeping the API key server-side. New DB tables store search history, saved keywords, and keyword research results. Frontend replaces all finance-specific pages with YouTube research pages (Keyword Explorer, Trending Dashboard, Video Analyzer, Channel Analyzer).

**Tech Stack:** React 19, Vite, TypeScript, TailwindCSS v4, Supabase (PostgreSQL + Auth + Edge Functions), TanStack Query v5, Zustand, Recharts, YouTube Data API v3

**Repository:** `ptit9x/vibe-tube-atlas` at `/home/vmo/vibe-coding/vibe-tube-atlas`

---

## Phase 0: Cleanup — Remove Finance-Specific Code

Remove all expense/finance domain code while **keeping**: auth flow, UI component library (shadcn/ui), shared components, layouts, i18n, theme provider, error boundaries, Supabase client setup, providers (QueryClient, Theme, I18n, ErrorBoundary, Router).

### Task 0.1: Remove finance-specific pages

**Files to delete:**
```
src/pages/Dashboard.tsx
src/pages/Transactions.tsx
src/pages/AddTransaction.tsx
src/pages/EditTransaction.tsx
src/pages/Wallets.tsx
src/pages/Reports.tsx
src/pages/ExpenseReport.tsx
src/pages/IncomeReport.tsx
src/pages/DebtReport.tsx
src/pages/Categories.tsx
src/pages/Savings.tsx
src/pages/FinancialHealth.tsx
src/pages/CurrencySettings.tsx
src/pages/ExportData.tsx
```

**Keep:**
```
src/pages/Login.tsx
src/pages/Register.tsx
src/pages/ForgotPassword.tsx
src/pages/ResetPassword.tsx
src/pages/VerifyEmail.tsx
src/pages/Profile.tsx
src/pages/LanguageSettings.tsx
src/pages/PasswordSettings.tsx
src/pages/Notifications.tsx
src/pages/NotFound.tsx
src/pages/ServerError.tsx
src/pages/Forbidden.tsx
```

```bash
cd /home/vmo/vibe-coding/vibe-tube-atlas
rm src/pages/Dashboard.tsx src/pages/Transactions.tsx src/pages/AddTransaction.tsx \
   src/pages/EditTransaction.tsx src/pages/Wallets.tsx src/pages/Reports.tsx \
   src/pages/ExpenseReport.tsx src/pages/IncomeReport.tsx src/pages/DebtReport.tsx \
   src/pages/Categories.tsx src/pages/Savings.tsx src/pages/FinancialHealth.tsx \
   src/pages/CurrencySettings.tsx src/pages/ExportData.tsx
git add -A && git commit -m "chore: remove finance-specific pages"
```

### Task 0.2: Remove finance-specific components, hooks, stores, types, mocks, libs

**Delete entire directories:**
```bash
rm -rf src/components/add-transaction
rm -rf src/components/reports
rm -rf src/components/wallets
rm -rf src/components/dashboard
rm -rf src/components/savings
rm -rf src/components/transactions
rm -rf src/mocks/mockTransactions.ts
rm -rf src/mocks/mockWallets.ts
rm -rf src/mocks/mockCategories.ts
rm -rf src/mocks/mockSavings.ts
```

**Delete hooks:**
```bash
rm src/hooks/useTransactions.ts 2>/dev/null
rm src/hooks/useWallets.ts 2>/dev/null
rm src/hooks/useCategories.ts 2>/dev/null
rm src/hooks/useSavings.ts 2>/dev/null
rm src/hooks/useDashboard.ts 2>/dev/null
```

**Delete stores:**
```bash
rm src/stores/transactionFormStore.ts
rm src/stores/walletsStore.ts
rm src/stores/outboxStore.ts src/stores/outboxStore.test.ts
```

**Delete libs:**
```bash
rm src/lib/financialHealth.ts src/lib/walletBalance.ts src/lib/categories.ts
rm src/lib/computeMonthlyData.ts
```

**Simplify `src/types/index.ts`** — replace entire file, keep only `AuthUser`:
```typescript
// ===== Base Types =====
export type UUID = string
export type DateString = string

// ===== Auth =====
export interface AuthUser {
  id: UUID
  email: string
  full_name: string | null
  avatar_url: string | null
  confirmed: boolean
}
```

**Simplify `src/stores/uiStore.ts`** — remove currency/balance/transaction helpers, keep theme + language only:
```typescript
import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface UIState {
  theme: 'light' | 'dark'
  setTheme: (theme: 'light' | 'dark') => void
  toggleTheme: () => void
}

export const useUIStore = create<UIState>()(
  persist(
    (set) => ({
      theme: 'light',
      setTheme: (theme) => set({ theme }),
      toggleTheme: () => set((s) => ({ theme: s.theme === 'light' ? 'dark' : 'light' })),
    }),
    { name: 'vibe-tube-atlas-ui' }
  )
)
```

**Delete `src/hooks/useOutboxSync.ts` if it exists.**

```bash
git add -A && git commit -m "chore: remove finance-specific components, hooks, stores, types"
```

### Task 0.3: Rewrite App.tsx routing

**File:** `src/App.tsx` — replace entirely:

```tsx
import { useEffect } from 'react'
import { lazy, Suspense } from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom'
import AuthLayout from './layouts/AuthLayout'
import MainLayout from './layouts/MainLayout'

// Auth pages (lazy loaded)
const Login = lazy(() => import('./pages/Login'))
const Register = lazy(() => import('./pages/Register'))
const VerifyEmail = lazy(() => import('./pages/VerifyEmail'))
const ForgotPassword = lazy(() => import('./pages/ForgotPassword'))
const ResetPassword = lazy(() => import('./pages/ResetPassword'))

// App pages (lazy loaded)
const Dashboard = lazy(() => import('./pages/Dashboard'))
const KeywordExplorer = lazy(() => import('./pages/KeywordExplorer'))
const TrendingPage = lazy(() => import('./pages/Trending'))
const VideoAnalyzer = lazy(() => import('./pages/VideoAnalyzer'))
const ChannelAnalyzer = lazy(() => import('./pages/ChannelAnalyzer'))
const SearchHistory = lazy(() => import('./pages/SearchHistory'))

// Settings pages
const ProfilePage = lazy(() => import('./pages/Profile'))
const LanguageSettingsPage = lazy(() => import('./pages/LanguageSettings'))
const PasswordSettingsPage = lazy(() => import('./pages/PasswordSettings'))
const NotificationsPage = lazy(() => import('./pages/Notifications'))
const ApiKeySettings = lazy(() => import('./pages/ApiKeySettings'))

// Error pages
const NotFound = lazy(() => import('./pages/NotFound'))
const ServerError = lazy(() => import('./pages/ServerError'))
const Forbidden = lazy(() => import('./pages/Forbidden'))

import { Toaster } from '@/components/ui/sonner'
import { useAuthListener } from '@/hooks/useAuth'
import './App.css'
import ErrorBoundary from './components/ErrorBoundary'

function ScrollToTop() {
  const { pathname } = useLocation()
  useEffect(() => {
    const main = document.querySelector('main')
    if (main) { main.scrollTo({ top: 0 }) } else { window.scrollTo(0, 0) }
  }, [pathname])
  return null
}

function LoadingSpinner() {
  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-foreground" />
    </div>
  )
}

function AppContent() {
  useAuthListener()
  return (
    <ScrollToTop />
  )
}

export default function App() {
  return (
    <ErrorBoundary>
      <Router>
        <Suspense fallback={<LoadingSpinner />}>
          <Routes>
            {/* Auth routes */}
            <Route element={<AuthLayout />}>
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/forgot-password" element={<ForgotPassword />} />
              <Route path="/reset-password" element={<ResetPassword />} />
            </Route>
            <Route path="/verify-email" element={<VerifyEmail />} />

            {/* App routes */}
            <Route element={<MainLayout />}>
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/keywords" element={<KeywordExplorer />} />
              <Route path="/trending" element={<TrendingPage />} />
              <Route path="/video-analyzer" element={<VideoAnalyzer />} />
              <Route path="/channel-analyzer" element={<ChannelAnalyzer />} />
              <Route path="/history" element={<SearchHistory />} />
              <Route path="/profile" element={<ProfilePage />} />
              <Route path="/settings/language" element={<LanguageSettingsPage />} />
              <Route path="/settings/password" element={<PasswordSettingsPage />} />
              <Route path="/settings/api-key" element={<ApiKeySettings />} />
              <Route path="/notifications" element={<NotificationsPage />} />
            </Route>

            {/* Error routes */}
            <Route path="/500" element={<ServerError />} />
            <Route path="/403" element={<Forbidden />} />
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Suspense>
        <AppContent />
        <Toaster richColors position="top-center" />
      </Router>
    </ErrorBoundary>
  )
}
```

### Task 0.4: Rewrite MainLayout navigation

**File:** `src/layouts/MainLayout.tsx`

Update `bottomNavItems` and `DesktopSidebar` to reflect new navigation:

```typescript
import {
  LayoutDashboard, Search, TrendingUp, Youtube, Users, Menu, LogOut, Bell, History,
} from 'lucide-react'

const bottomNavItems = [
  { icon: LayoutDashboard, labelKey: 'nav.dashboard', href: '/dashboard' },
  { icon: Search, labelKey: 'nav.keywords', href: '/keywords' },
  { icon: TrendingUp, labelKey: 'nav.trending', href: '/trending', isPlus: true },
  { icon: Youtube, labelKey: 'nav.video', href: '/video-analyzer' },
  { icon: Menu, labelKey: 'nav.profile', href: '/profile' },
]

// Desktop sidebar links:
const sidebarLinks = [
  { icon: LayoutDashboard, labelKey: 'nav.dashboard', href: '/dashboard' },
  { icon: Search, labelKey: 'nav.keywords', href: '/keywords' },
  { icon: TrendingUp, labelKey: 'nav.trending', href: '/trending' },
  { icon: Youtube, labelKey: 'nav.video', href: '/video-analyzer' },
  { icon: Users, labelKey: 'nav.channel', href: '/channel-analyzer' },
  { icon: History, labelKey: 'nav.history', href: '/history' },
]
```

### Task 0.5: Update i18n translations

**File:** `src/lib/i18n/translations.ts`

Replace all finance-specific translation keys with YouTube research keys. Key sections:

```typescript
// Navigation
'nav.dashboard': { vi: 'Tổng quan', en: 'Dashboard' },
'nav.keywords': { vi: 'Từ khoá', en: 'Keywords' },
'nav.trending': { vi: 'Xu hướng', en: 'Trending' },
'nav.video': { vi: 'Phân tích Video', en: 'Video Analyzer' },
'nav.channel': { vi: 'Kênh', en: 'Channel' },
'nav.history': { vi: 'Lịch sử', en: 'History' },
'nav.profile': { vi: 'Cài đặt', en: 'Settings' },

// Keyword Explorer
'keywords.title': { vi: 'Khám phá từ khoá', en: 'Keyword Explorer' },
'keywords.searchPlaceholder': { vi: 'Nhập từ khoá...', en: 'Enter keyword...' },
'keywords.search': { vi: 'Tìm kiếm', en: 'Search' },
'keywords.results': { vi: 'Kết quả', en: 'Results' },
'keywords.relatedKeywords': { vi: 'Từ khoá liên quan', en: 'Related Keywords' },
'keywords.searchVolume': { vi: 'Lượt tìm kiếm ước tính', en: 'Est. Search Volume' },
'keywords.competition': { vi: 'Mức độ cạnh tranh', en: 'Competition' },
'keywords.saveKeyword': { vi: 'Lưu từ khoá', en: 'Save Keyword' },

// Trending
'trending.title': { vi: 'Chủ đề thịnh hành', en: 'Trending Topics' },
'trending.country': { vi: 'Quốc gia', en: 'Country' },
'trending.category': { vi: 'Danh mục', en: 'Category' },
'trending.timeRange': { vi: 'Khoảng thời gian', en: 'Time Range' },

// Video Analyzer
'video.title': { vi: 'Phân tích Video', en: 'Video Analyzer' },
'video.searchPlaceholder': { vi: 'Tìm video theo từ khoá...', en: 'Search videos by keyword...' },
'video.views': { vi: 'Lượt xem', en: 'Views' },
'video.likes': { vi: 'Thích', en: 'Likes' },
'video.comments': { vi: 'Bình luận', en: 'Comments' },
'video.duration': { vi: 'Thời lượng', en: 'Duration' },
'video.publishedAt': { vi: 'Ngày đăng', en: 'Published' },
'video.channel': { vi: 'Kênh', en: 'Channel' },
'video.tags': { vi: 'Thẻ', en: 'Tags' },

// Channel Analyzer
'channel.title': { vi: 'Phân tích Kênh', en: 'Channel Analyzer' },
'channel.searchPlaceholder': { vi: 'Tên kênh hoặc URL...', en: 'Channel name or URL...' },
'channel.subscribers': { vi: 'Người đăng ký', en: 'Subscribers' },
'channel.totalVideos': { vi: 'Tổng video', en: 'Total Videos' },
'channel.totalViews': { vi: 'Tổng lượt xem', en: 'Total Views' },

// Dashboard
'dashboard.title': { vi: 'Tổng quan', en: 'Dashboard' },
'dashboard.recentSearches': { vi: 'Tìm kiếm gần đây', en: 'Recent Searches' },
'dashboard.savedKeywords': { vi: 'Từ khoá đã lưu', en: 'Saved Keywords' },
'dashboard.quickStats': { vi: 'Thống kê nhanh', en: 'Quick Stats' },

// API Key Settings
'apiKey.title': { vi: 'Cài đặt YouTube API', en: 'YouTube API Settings' },
'apiKey.description': { vi: 'Nhập YouTube Data API key của bạn', en: 'Enter your YouTube Data API key' },
'apiKey.placeholder': { vi: 'AIza...', en: 'AIza...' },
'apiKey.save': { vi: 'Lưu', en: 'Save' },
'apiKey.quotaUsed': { vi: 'Đã dùng quota', en: 'Quota Used' },

// Common
'common.loading': { vi: 'Đang tải...', en: 'Loading...' },
'common.noResults': { vi: 'Không có kết quả', en: 'No results found' },
'common.error': { vi: 'Đã xảy ra lỗi', en: 'An error occurred' },
'common.export': { vi: 'Xuất CSV', en: 'Export CSV' },
'common.retry': { vi: 'Thử lại', en: 'Retry' },
```

### Task 0.6: Update index.html title and meta

**File:** `index.html`
```html
<title>Vibe Tube Atlas — YouTube Keyword Research</title>
<meta name="description" content="YouTube keyword trend research and video analysis tool" />
```

### Task 0.7: Stub placeholder pages

Create minimal placeholder pages so the app compiles. Each is a simple component:

```bash
# Create all new pages as stubs
for page in Dashboard KeywordExplorer Trending VideoAnalyzer ChannelAnalyzer SearchHistory ApiKeySettings; do
  cat > src/pages/${page}.tsx << 'EOF'
export default function ${page}Page() {
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold">Coming Soon</h1>
      <p className="text-muted-foreground mt-2">This page is under construction.</p>
    </div>
  )
}
EOF
done
```

(Write each file properly with the correct component name.)

```bash
npm run build
git add -A && git commit -m "chore: stub new pages, update routing, i18n, and navigation"
```

**Verification:** `npm run build` should pass with zero errors.

---

## Phase 1: Database & Backend

### Task 1.1: New Supabase migration — core tables

**File:** `supabase/migrations/20260728000000_tube_atlas_schema.sql`

```sql
-- Vibe Tube Atlas — Core Schema
-- Adds YouTube research tables alongside existing profiles table

-- ============================================
-- SEARCH HISTORY
-- ============================================
CREATE TABLE IF NOT EXISTS public.search_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  query TEXT NOT NULL,
  search_type TEXT NOT NULL CHECK (search_type IN ('keyword', 'trending', 'video', 'channel')),
  country TEXT DEFAULT 'VN',
  category_id TEXT,
  results_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.search_history ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can CRUD own search_history" ON public.search_history
  FOR ALL USING (auth.uid() = user_id);
CREATE INDEX idx_search_history_user ON public.search_history(user_id, created_at DESC);

-- ============================================
-- SAVED KEYWORDS
-- ============================================
CREATE TABLE IF NOT EXISTS public.saved_keywords (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  keyword TEXT NOT NULL,
  est_search_volume BIGINT,
  competition TEXT CHECK (competition IN ('low', 'medium', 'high')),
  country TEXT DEFAULT 'VN',
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.saved_keywords ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can CRUD own saved_keywords" ON public.saved_keywords
  FOR ALL USING (auth.uid() = user_id);
CREATE UNIQUE INDEX idx_saved_keywords_user_keyword ON public.saved_keywords(user_id, keyword, country);

-- ============================================
-- SAVED VIDEOS
-- ============================================
CREATE TABLE IF NOT EXISTS public.saved_videos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  video_id TEXT NOT NULL,
  title TEXT,
  channel_name TEXT,
  view_count BIGINT,
  like_count BIGINT,
  comment_count BIGINT,
  duration_seconds INTEGER,
  published_at TIMESTAMPTZ,
  thumbnail_url TEXT,
  tags TEXT[],
  raw_data JSONB,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.saved_videos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can CRUD own saved_videos" ON public.saved_videos
  FOR ALL USING (auth.uid() = user_id);
CREATE UNIQUE INDEX idx_saved_videos_user_video ON public.saved_videos(user_id, video_id);

-- ============================================
-- SAVED CHANNELS
-- ============================================
CREATE TABLE IF NOT EXISTS public.saved_channels (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  channel_id TEXT NOT NULL,
  title TEXT,
  subscriber_count BIGINT,
  video_count BIGINT,
  view_count BIGINT,
  thumbnail_url TEXT,
  raw_data JSONB,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.saved_channels ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can CRUD own saved_channels" ON public.saved_channels
  FOR ALL USING (auth.uid() = user_id);
CREATE UNIQUE INDEX idx_saved_channels_user_channel ON public.saved_channels(user_id, channel_id);

-- ============================================
-- YOUTUBE API USAGE TRACKING
-- ============================================
CREATE TABLE IF NOT EXISTS public.api_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  endpoint TEXT NOT NULL,
  quota_cost INTEGER DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.api_usage ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own api_usage" ON public.api_usage
  FOR SELECT USING (auth.uid() = user_id);
CREATE INDEX idx_api_usage_user_date ON public.api_usage(user_id, created_at DESC);

-- ============================================
-- API KEYS (encrypted at rest by Supabase, user provides own key)
-- ============================================
CREATE TABLE IF NOT EXISTS public.user_api_keys (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  youtube_api_key TEXT,
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.user_api_keys ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can CRUD own api_keys" ON public.user_api_keys
  FOR ALL USING (auth.uid() = user_id);
```

### Task 1.2: Edge Function — YouTube Search Proxy

**File:** `supabase/functions/youtube-search/index.ts`

This Edge Function acts as a proxy to YouTube Data API v3. It accepts the user's API key (stored in `user_api_keys` table) and makes the search call server-side.

```typescript
// supabase/functions/youtube-search/index.ts
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const YOUTUBE_API_BASE = "https://www.googleapis.com/youtube/v3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      {
        global: { headers: { Authorization: req.headers.get("Authorization")! } },
      }
    );

    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Get user's API key
    const { data: keyData } = await supabase
      .from("user_api_keys")
      .select("youtube_api_key")
      .eq("user_id", user.id)
      .single();

    const apiKey = keyData?.youtube_api_key;
    if (!apiKey) {
      return new Response(JSON.stringify({ error: "No YouTube API key configured. Go to Settings → API Key." }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.json();
    const { action, params } = body;

    let endpoint = "";
    let queryParams = new URLSearchParams({ key: apiKey, ...params });

    switch (action) {
      case "search":
        endpoint = "/search";
        queryParams.set("part", "snippet");
        break;
      case "videos":
        endpoint = "/videos";
        queryParams.set("part", "statistics,snippet,contentDetails");
        break;
      case "channels":
        endpoint = "/channels";
        queryParams.set("part", "statistics,snippet,contentDetails");
        break;
      case "videoCategories":
        endpoint = "/videoCategories";
        queryParams.set("part", "snippet");
        break;
      case "commentThreads":
        endpoint = "/commentThreads";
        queryParams.set("part", "snippet");
        break;
      default:
        return new Response(JSON.stringify({ error: "Invalid action" }), {
          status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
    }

    const url = `${YOUTUBE_API_BASE}${endpoint}?${queryParams}`;
    const response = await fetch(url);
    const data = await response.json();

    if (!response.ok) {
      // Track quota usage on error too
      return new Response(JSON.stringify({ error: data.error?.message || "YouTube API error", details: data }), {
        status: response.status, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Track API usage (rough quota cost)
    const quotaCost = action === "search" ? 100 : 1;
    await supabase.from("api_usage").insert({
      user_id: user.id,
      endpoint: action,
      quota_cost: quotaCost,
    });

    // Save search to history
    if (action === "search" && params.q) {
      await supabase.from("search_history").insert({
        user_id: user.id,
        query: params.q,
        search_type: "keyword",
        country: params.regionCode || "VN",
        results_count: data.pageInfo?.totalResults || 0,
      });
    }

    return new Response(JSON.stringify(data), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: "Internal error", details: String(err) }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
```

### Task 1.3: Edge Function — Keyword Suggestions (autocomplete)

**File:** `supabase/functions/youtube-suggest/index.ts`

Uses YouTube's public autocomplete endpoint (no API key needed — works like Google Suggest):

```typescript
// supabase/functions/youtube-suggest/index.ts

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const { query, hl = "vi", gl = "VN" } = body;

    if (!query) {
      return new Response(JSON.stringify({ suggestions: [] }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // YouTube autocomplete suggestion endpoint (public, no API key)
    const url = `https://suggestqueries.google.com/complete/search?client=youtube&ds=yt&q=${encodeURIComponent(query)}&hl=${hl}&gl=${gl}`;
    const response = await fetch(url);
    const text = await response.text();

    // Response is JSONP-like: window.google.ac.h([...])
    // Extract the JSON array inside
    const match = text.match(/\[.*\]/s);
    if (!match) {
      return new Response(JSON.stringify({ suggestions: [] }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const parsed = JSON.parse(match[0]);
    // Format: [searchTerm, [0, [suggestion1, suggestion2, ...]]]
    const suggestions: string[] = [];

    // The structure is nested arrays — the suggestions are in parsed[1]
    if (parsed[1] && Array.isArray(parsed[1])) {
      for (const item of parsed[1]) {
        if (Array.isArray(item) && typeof item[0] === "string") {
          suggestions.push(item[0]);
        }
      }
    }

    return new Response(JSON.stringify({ query, suggestions }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err), suggestions: [] }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
```

---

## Phase 2: Types & Lib Layer

### Task 2.1: Define YouTube domain types

**File:** `src/types/index.ts` — add YouTube types below auth types:

```typescript
// ===== YouTube Domain Types =====

export interface YouTubeSearchResult {
  videoId: string
  channelId: string
  title: string
  description: string
  channelTitle: string
  publishedAt: string
  thumbnailUrl: string
}

export interface YouTubeVideoStats {
  videoId: string
  title: string
  description: string
  channelTitle: string
  channelId: string
  publishedAt: string
  thumbnailUrl: string
  tags: string[]
  categoryId: string
  duration: string // ISO 8601 (e.g. PT4M13S)
  viewCount: number
  likeCount: number
  commentCount: number
  definition: string
  licensedContent: boolean
  defaultLanguage?: string
}

export interface YouTubeChannelStats {
  channelId: string
  title: string
  description: string
  customUrl?: string
  thumbnailUrl: string
  publishedAt: string
  country?: string
  viewCount: number
  subscriberCount: number
  hiddenSubscriberCount: boolean
  videoCount: number
}

export interface KeywordSuggestion {
  keyword: string
  suggestions: string[]
}

export interface KeywordMetric {
  keyword: string
  estSearchVolume: number      // estimated from result counts
  competition: 'low' | 'medium' | 'high'
  avgViewCount: number         // average views of top videos
  avgLikeCount: number
  topChannelsCount: number
  relatedKeywords: string[]
}

export interface SavedKeyword {
  id: UUID
  user_id: UUID
  keyword: string
  est_search_volume: number | null
  competition: 'low' | 'medium' | 'high' | null
  country: string
  notes: string | null
  created_at: DateString
}

export interface SavedVideo {
  id: UUID
  user_id: UUID
  video_id: string
  title: string | null
  channel_name: string | null
  view_count: number | null
  like_count: number | null
  comment_count: number | null
  duration_seconds: number | null
  published_at: DateString | null
  thumbnail_url: string | null
  tags: string[] | null
  created_at: DateString
}

export interface SavedChannel {
  id: UUID
  user_id: UUID
  channel_id: string
  title: string | null
  subscriber_count: number | null
  video_count: number | null
  view_count: number | null
  thumbnail_url: string | null
  created_at: DateString
}

export interface SearchHistoryItem {
  id: UUID
  user_id: UUID
  query: string
  search_type: 'keyword' | 'trending' | 'video' | 'channel'
  country: string
  category_id: string | null
  results_count: number
  created_at: DateString
}

export interface ApiUsageItem {
  id: UUID
  user_id: UUID
  endpoint: string
  quota_cost: number
  created_at: DateString
}

// YouTube video categories (common ones)
export const YOUTUBE_CATEGORIES: { id: string; label: string; labelVi: string }[] = [
  { id: '0', label: 'All', labelVi: 'Tất cả' },
  { id: '1', label: 'Film & Animation', labelVi: 'Phim ảnh' },
  { id: '2', label: 'Autos & Vehicles', labelVi: 'Ô tô' },
  { id: '10', label: 'Music', labelVi: 'Âm nhạc' },
  { id: '15', label: 'Pets & Animals', labelVi: 'Thú cưng' },
  { id: '17', label: 'Sports', labelVi: 'Thể thao' },
  { id: '19', label: 'Travel & Events', labelVi: 'Du lịch' },
  { id: '20', label: 'Gaming', labelVi: 'Game' },
  { id: '22', label: 'People & Blogs', labelVi: 'Đời sống' },
  { id: '23', label: 'Comedy', labelVi: 'Hài' },
  { id: '24', label: 'Entertainment', labelVi: 'Giải trí' },
  { id: '25', label: 'News & Politics', labelVi: 'Tin tức' },
  { id: '26', label: 'Howto & Style', labelVi: 'Cách làm' },
  { id: '27', label: 'Education', labelVi: 'Giáo dục' },
  { id: '28', label: 'Science & Tech', labelVi: 'Khoa học' },
  { id: '29', label: 'Nonprofits', labelVi: 'Phi lợi nhuận' },
]

export const COUNTRIES: { code: string; name: string }[] = [
  { code: 'VN', name: 'Việt Nam' },
  { code: 'US', name: 'United States' },
  { code: 'GB', name: 'United Kingdom' },
  { code: 'JP', name: 'Japan' },
  { code: 'KR', name: 'Korea' },
  { code: 'IN', name: 'India' },
  { code: 'TH', name: 'Thailand' },
  { code: 'ID', name: 'Indonesia' },
  { code: 'PH', name: 'Philippines' },
  { code: 'SG', name: 'Singapore' },
  { code: 'MY', name: 'Malaysia' },
  { code: 'BR', name: 'Brazil' },
  { code: 'DE', name: 'Germany' },
  { code: 'FR', name: 'France' },
  { code: 'CA', name: 'Canada' },
  { code: 'AU', name: 'Australia' },
]
```

### Task 2.2: Create YouTube API client lib

**File:** `src/lib/youtube.ts`

```typescript
import { supabase } from '@/lib/supabase'
import type {
  YouTubeSearchResult, YouTubeVideoStats, YouTubeChannelStats,
  KeywordSuggestion, KeywordMetric,
} from '@/types'

/**
 * Calls the youtube-search Edge Function (proxy to YouTube Data API v3).
 * The user's API key is stored server-side in user_api_keys table.
 */
async function callYoutubeApi(action: string, params: Record<string, string>) {
  const { data: session } = await supabase.auth.getSession()
  const accessToken = session.session?.access_token
  if (!accessToken) throw new Error('Not authenticated')

  const { data, error } = await supabase.functions.invoke('youtube-search', {
    body: { action, params },
    headers: { Authorization: `Bearer ${accessToken}` },
  })

  if (error) throw error
  if (data?.error) throw new Error(data.error)
  return data
}

/** Search videos by keyword */
export async function searchVideos(
  query: string,
  opts: { maxResults?: number; order?: string; publishedAfter?: string; videoCategoryId?: string; regionCode?: string } = {}
): Promise<{ results: YouTubeSearchResult[]; totalResults: number }> {
  const params: Record<string, string> = {
    q: query,
    type: 'video',
    maxResults: String(opts.maxResults || 25),
    order: opts.order || 'relevance',
    regionCode: opts.regionCode || 'VN',
    relevanceLanguage: opts.regionCode === 'US' ? 'en' : 'vi',
  }
  if (opts.publishedAfter) params.publishedAfter = opts.publishedAfter
  if (opts.videoCategoryId) params.videoCategoryId = opts.videoCategoryId

  const data = await callYoutubeApi('search', params)

  const results: YouTubeSearchResult[] = (data.items || []).map((item: any) => ({
    videoId: item.id?.videoId || '',
    channelId: item.snippet?.channelId || '',
    title: item.snippet?.title || '',
    description: item.snippet?.description || '',
    channelTitle: item.snippet?.channelTitle || '',
    publishedAt: item.snippet?.publishedAt || '',
    thumbnailUrl: item.snippet?.thumbnails?.medium?.url || item.snippet?.thumbnails?.default?.url || '',
  }))

  return { results, totalResults: data.pageInfo?.totalResults || 0 }
}

/** Get detailed video statistics (batch up to 50 IDs) */
export async function getVideoStats(videoIds: string[]): Promise<YouTubeVideoStats[]> {
  if (videoIds.length === 0) return []
  const data = await callYoutubeApi('videos', { id: videoIds.join(',') })

  return (data.items || []).map((item: any) => ({
    videoId: item.id,
    title: item.snippet?.title || '',
    description: item.snippet?.description || '',
    channelTitle: item.snippet?.channelTitle || '',
    channelId: item.snippet?.channelId || '',
    publishedAt: item.snippet?.publishedAt || '',
    thumbnailUrl: item.snippet?.thumbnails?.medium?.url || '',
    tags: item.snippet?.tags || [],
    categoryId: item.snippet?.categoryId || '',
    duration: item.contentDetails?.duration || '',
    viewCount: parseInt(item.statistics?.viewCount || '0'),
    likeCount: parseInt(item.statistics?.likeCount || '0'),
    commentCount: parseInt(item.statistics?.commentCount || '0'),
    definition: item.contentDetails?.definition || 'sd',
    licensedContent: item.contentDetails?.licensedContent || false,
  }))
}

/** Get channel statistics */
export async function getChannelStats(channelIds: string[]): Promise<YouTubeChannelStats[]> {
  if (channelIds.length === 0) return []
  const data = await callYoutubeApi('channels', { id: channelIds.join(',') })

  return (data.items || []).map((item: any) => ({
    channelId: item.id,
    title: item.snippet?.title || '',
    description: item.snippet?.description || '',
    customUrl: item.snippet?.customUrl,
    thumbnailUrl: item.snippet?.thumbnails?.medium?.url || '',
    publishedAt: item.snippet?.publishedAt || '',
    country: item.snippet?.country,
    viewCount: parseInt(item.statistics?.viewCount || '0'),
    subscriberCount: parseInt(item.statistics?.subscriberCount || '0'),
    hiddenSubscriberCount: item.statistics?.hiddenSubscriberCount || false,
    videoCount: parseInt(item.statistics?.videoCount || '0'),
  }))
}

/** Get keyword autocomplete suggestions (no API key needed) */
export async function getKeywordSuggestions(
  query: string, hl = 'vi', gl = 'VN'
): Promise<KeywordSuggestion> {
  const { data, error } = await supabase.functions.invoke('youtube-suggest', {
    body: { query, hl, gl },
  })
  if (error) throw error
  return { keyword: query, suggestions: data?.suggestions || [] }
}

/**
 * Analyze a keyword: search for top videos, compute metrics.
 * Combines search + video stats into a keyword intelligence report.
 */
export async function analyzeKeyword(
  keyword: string,
  opts: { regionCode?: string; maxResults?: number } = {}
): Promise<KeywordMetric> {
  const regionCode = opts.regionCode || 'VN'
  const maxResults = opts.maxResults || 25

  // 1. Search for videos
  const { results, totalResults } = await searchVideos(keyword, {
    maxResults,
    order: 'viewCount',
    regionCode,
  })

  if (results.length === 0) {
    return {
      keyword,
      estSearchVolume: 0,
      competition: 'low',
      avgViewCount: 0,
      avgLikeCount: 0,
      topChannelsCount: 0,
      relatedKeywords: [],
    }
  }

  // 2. Get video statistics
  const videoIds = results.map(r => r.videoId)
  const stats = await getVideoStats(videoIds)

  // 3. Compute metrics
  const totalViews = stats.reduce((sum, v) => sum + v.viewCount, 0)
  const totalLikes = stats.reduce((sum, v) => sum + v.likeCount, 0)
  const avgViews = Math.round(totalViews / stats.length)
  const avgLikes = Math.round(totalLikes / stats.length)
  const uniqueChannels = new Set(stats.map(v => v.channelId)).size

  // Estimate competition from result count
  let competition: 'low' | 'medium' | 'high'
  if (totalResults > 100000) competition = 'high'
  else if (totalResults > 10000) competition = 'medium'
  else competition = 'low'

  // 4. Get related keywords via autocomplete
  const related = await getKeywordSuggestions(keyword, regionCode === 'US' ? 'en' : 'vi', regionCode)
  const relatedKeywords = related.suggestions.filter(s => s !== keyword).slice(0, 15)

  return {
    keyword,
    estSearchVolume: totalResults,
    competition,
    avgViewCount: avgViews,
    avgLikeCount: avgLikes,
    topChannelsCount: uniqueChannels,
    relatedKeywords,
  }
}

/** Parse ISO 8601 duration to seconds */
export function parseDuration(isoDuration: string): number {
  const match = isoDuration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/)
  if (!match) return 0
  const hours = parseInt(match[1] || '0')
  const minutes = parseInt(match[2] || '0')
  const seconds = parseInt(match[3] || '0')
  return hours * 3600 + minutes * 60 + seconds
}

/** Format seconds to human-readable duration */
export function formatDuration(seconds: number): string {
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const s = seconds % 60
  if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
  return `${m}:${String(s).padStart(2, '0')}`
}

/** Format large numbers (e.g. 1.2M, 3.5K) */
export function formatCompact(num: number): string {
  if (num >= 1_000_000_000) return `${(num / 1_000_000_000).toFixed(1)}B`
  if (num >= 1_000_000) return `${(num / 1_000_000).toFixed(1)}M`
  if (num >= 1_000) return `${(num / 1_000).toFixed(1)}K`
  return String(num)
}
```

### Task 2.3: CSV export utility

**File:** `src/lib/csv.ts`

```typescript
/** Export array of objects to CSV and trigger download */
export function exportToCSV(data: Record<string, any>[], filename: string) {
  if (data.length === 0) return

  const headers = Object.keys(data[0])
  const csvRows = [
    headers.join(','),
    ...data.map(row =>
      headers.map(header => {
        const val = row[header]
        const str = Array.isArray(val) ? val.join('; ') : String(val ?? '')
        return `"${str.replace(/"/g, '""')}"`
      }).join(',')
    ),
  ]

  const csv = '\uFEFF' + csvRows.join('\n') // BOM for Excel UTF-8
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}
```

---

## Phase 3: Hooks (Data Layer)

### Task 3.1: Keyword research hooks

**File:** `src/hooks/useKeywords.ts`

```typescript
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { analyzeKeyword, getKeywordSuggestions, searchVideos, getVideoStats } from '@/lib/youtube'
import { supabase, requireAuth } from '@/lib/supabase'
import type { KeywordMetric, SavedKeyword } from '@/types'

export function useKeywordAnalysis(keyword: string | null, regionCode = 'VN') {
  return useQuery({
    queryKey: ['keyword-analysis', keyword, regionCode],
    queryFn: async (): Promise<KeywordMetric | null> => {
      if (!keyword) return null
      return analyzeKeyword(keyword, { regionCode })
    },
    enabled: !!keyword,
    staleTime: 1000 * 60 * 30, // 30 min cache
  })
}

export function useKeywordSuggestions(query: string, enabled = true) {
  return useQuery({
    queryKey: ['keyword-suggestions', query],
    queryFn: () => getKeywordSuggestions(query),
    enabled: enabled && query.length >= 2,
    staleTime: 1000 * 60 * 60, // 1 hour cache
  })
}

export function useSavedKeywords() {
  return useQuery({
    queryKey: ['saved-keywords'],
    queryFn: async (): Promise<SavedKeyword[]> => {
      const user = await requireAuth()
      const { data, error } = await supabase
        .from('saved_keywords')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
      if (error) throw error
      return data || []
    },
  })
}

export function useSaveKeyword() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (keyword: {
      keyword: string
      est_search_volume?: number | null
      competition?: 'low' | 'medium' | 'high' | null
      country?: string
      notes?: string
    }) => {
      const user = await requireAuth()
      const { data, error } = await supabase
        .from('saved_keywords')
        .upsert({ user_id: user.id, ...keyword })
        .select()
        .single()
      if (error) throw error
      return data
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['saved-keywords'] })
    },
  })
}

export function useDeleteKeyword() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const user = await requireAuth()
      const { error } = await supabase.from('saved_keywords').delete().eq('id', id).eq('user_id', user.id)
      if (error) throw error
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['saved-keywords'] }),
  })
}
```

### Task 3.2: Video analysis hooks

**File:** `src/hooks/useVideos.ts`

```typescript
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { searchVideos, getVideoStats } from '@/lib/youtube'
import { supabase, requireAuth } from '@/lib/supabase'
import type { YouTubeVideoStats, SavedVideo } from '@/types'

export function useVideoSearch(keyword: string | null, opts: {
  maxResults?: number; order?: string; regionCode?: string; enabled?: boolean
} = {}) {
  return useQuery({
    queryKey: ['video-search', keyword, opts],
    queryFn: async () => {
      if (!keyword) return { results: [], stats: [] as YouTubeVideoStats[] }
      const { results } = await searchVideos(keyword, opts)
      const videoIds = results.map(r => r.videoId)
      const stats = await getVideoStats(videoIds)
      return { results, stats }
    },
    enabled: opts.enabled !== false && !!keyword,
  })
}

export function useSavedVideos() {
  return useQuery({
    queryKey: ['saved-videos'],
    queryFn: async (): Promise<SavedVideo[]> => {
      const user = await requireAuth()
      const { data, error } = await supabase
        .from('saved_videos').select('*').eq('user_id', user.id)
        .order('created_at', { ascending: false })
      if (error) throw error
      return data || []
    },
  })
}

export function useSaveVideo() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (video: Partial<SavedVideo> & { video_id: string }) => {
      const user = await requireAuth()
      const { data, error } = await supabase
        .from('saved_videos')
        .upsert({ user_id: user.id, ...video })
        .select().single()
      if (error) throw error
      return data
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['saved-videos'] }),
  })
}

export function useDeleteVideo() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const user = await requireAuth()
      await supabase.from('saved_videos').delete().eq('id', id).eq('user_id', user.id)
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['saved-videos'] }),
  })
}
```

### Task 3.3: Channel analysis hooks

**File:** `src/hooks/useChannels.ts`

```typescript
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getChannelStats, searchVideos } from '@/lib/youtube'
import { supabase, requireAuth } from '@/lib/supabase'
import type { YouTubeChannelStats, SavedChannel } from '@/types'

/** Search channels by name via video search → extract channel IDs */
export function useChannelSearch(query: string | null, enabled = true) {
  return useQuery({
    queryKey: ['channel-search', query],
    queryFn: async (): Promise<YouTubeChannelStats[]> => {
      if (!query) return []
      // Search videos first to find channels
      const { results } = await searchVideos(query, { maxResults: 25, order: 'relevance' })
      const channelIds = [...new Set(results.map(r => r.channelId))].slice(0, 50)
      if (channelIds.length === 0) return []
      return getChannelStats(channelIds)
    },
    enabled: enabled && !!query,
  })
}

export function useSavedChannels() {
  return useQuery({
    queryKey: ['saved-channels'],
    queryFn: async (): Promise<SavedChannel[]> => {
      const user = await requireAuth()
      const { data, error } = await supabase
        .from('saved_channels').select('*').eq('user_id', user.id)
        .order('created_at', { ascending: false })
      if (error) throw error
      return data || []
    },
  })
}

export function useSaveChannel() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (channel: Partial<SavedChannel> & { channel_id: string }) => {
      const user = await requireAuth()
      const { data, error } = await supabase
        .from('saved_channels').upsert({ user_id: user.id, ...channel }).select().single()
      if (error) throw error
      return data
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['saved-channels'] }),
  })
}

export function useDeleteChannel() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const user = await requireAuth()
      await supabase.from('saved_channels').delete().eq('id', id).eq('user_id', user.id)
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['saved-channels'] }),
  })
}
```

### Task 3.4: Search history & API usage hooks

**File:** `src/hooks/useSearchHistory.ts`

```typescript
import { useQuery } from '@tanstack/react-query'
import { supabase, requireAuth } from '@/lib/supabase'
import type { SearchHistoryItem, ApiUsageItem } from '@/types'

export function useSearchHistory(limit = 50) {
  return useQuery({
    queryKey: ['search-history', limit],
    queryFn: async (): Promise<SearchHistoryItem[]> => {
      const user = await requireAuth()
      const { data, error } = await supabase
        .from('search_history').select('*').eq('user_id', user.id)
        .order('created_at', { ascending: false }).limit(limit)
      if (error) throw error
      return data || []
    },
  })
}

export function useApiUsage() {
  return useQuery({
    queryKey: ['api-usage'],
    queryFn: async (): Promise<{ totalQuota: number; todayQuota: number; calls: ApiUsageItem[] }> => {
      const user = await requireAuth()
      const today = new Date().toISOString().split('T')[0]
      const [all, todayData] = await Promise.all([
        supabase.from('api_usage').select('*').eq('user_id', user.id).order('created_at', { ascending: false }).limit(100),
        supabase.from('api_usage').select('*').eq('user_id', user.id).gte('created_at', today),
      ])
      const totalQuota = (all.data || []).reduce((sum, item) => sum + item.quota_cost, 0)
      const todayQuota = (todayData.data || []).reduce((sum, item) => sum + item.quota_cost, 0)
      return { totalQuota, todayQuota, calls: all.data || [] }
    },
  })
}
```

### Task 3.5: API key management hook

**File:** `src/hooks/useApiKey.ts`

```typescript
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase, requireAuth } from '@/lib/supabase'

export function useApiKey() {
  return useQuery({
    queryKey: ['api-key'],
    queryFn: async (): Promise<string | null> => {
      const user = await requireAuth()
      const { data } = await supabase
        .from('user_api_keys').select('youtube_api_key').eq('user_id', user.id).single()
      return data?.youtube_api_key || null
    },
  })
}

export function useSaveApiKey() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (apiKey: string) => {
      const user = await requireAuth()
      const { error } = await supabase
        .from('user_api_keys')
        .upsert({ user_id: user.id, youtube_api_key: apiKey, updated_at: new Date().toISOString() })
      if (error) throw error
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['api-key'] })
      qc.invalidateQueries({ queryKey: ['keyword-analysis'] })
      qc.invalidateQueries({ queryKey: ['video-search'] })
    },
  })
}
```

---

## Phase 4: Components

### Task 4.1: Keyword components

**File:** `src/components/keywords/KeywordSearchBar.tsx`

```tsx
import { useState, useEffect } from 'react'
import { Search, X } from 'lucide-react'
import { useKeywordSuggestions } from '@/hooks/useKeywords'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface Props {
  onSearch: (keyword: string) => void
  initialValue?: string
  placeholder?: string
}

export function KeywordSearchBar({ onSearch, initialValue = '', placeholder = 'Nhập từ khoá...' }: Props) {
  const [value, setValue] = useState(initialValue)
  const [showSuggestions, setShowSuggestions] = useState(false)
  const { data: suggestionsData, isLoading } = useKeywordSuggestions(value, value.length >= 2)

  useEffect(() => { setValue(initialValue) }, [initialValue])

  const suggestions = suggestionsData?.suggestions || []

  const handleSubmit = (kw?: string) => {
    const q = kw || value.trim()
    if (!q) return
    onSearch(q)
    setShowSuggestions(false)
  }

  return (
    <div className="relative w-full">
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={value}
            onChange={(e) => { setValue(e.target.value); setShowSuggestions(true) }}
            onFocus={() => setShowSuggestions(true)}
            onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
            onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
            placeholder={placeholder}
            className="pl-9 pr-9"
          />
          {value && (
            <button onClick={() => setValue('')} className="absolute right-3 top-1/2 -translate-y-1/2">
              <X className="h-4 w-4 text-muted-foreground hover:text-foreground" />
            </button>
          )}
        </div>
        <Button onClick={() => handleSubmit()}>Tìm kiếm</Button>
      </div>

      {showSuggestions && suggestions.length > 0 && (
        <div className="absolute z-50 mt-1 w-full rounded-md border bg-popover shadow-lg max-h-60 overflow-auto">
          {isLoading && <div className="px-3 py-2 text-sm text-muted-foreground">Đang tải...</div>}
          {suggestions.map((s) => (
            <button
              key={s}
              onMouseDown={() => handleSubmit(s)}
              className="flex w-full items-center gap-2 px-3 py-2 text-sm hover:bg-accent text-left"
            >
              <Search className="h-3 w-3 text-muted-foreground shrink-0" />
              <span className="truncate">{s}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
```

**File:** `src/components/keywords/KeywordMetricCard.tsx`

```tsx
import { TrendingUp, BarChart3, Eye, Heart, Users, Bookmark } from 'lucide-react'
import type { KeywordMetric } from '@/types'
import { formatCompact } from '@/lib/youtube'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface Props {
  metric: KeywordMetric
  onSave?: () => void
  isSaved?: boolean
}

export function KeywordMetricCard({ metric, onSave, isSaved }: Props) {
  const competitionColor = {
    low: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
    medium: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
    high: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  }

  return (
    <div className="rounded-xl border bg-card p-5 space-y-4">
      <div className="flex items-start justify-between">
        <div>
          <h3 className="text-lg font-semibold">{metric.keyword}</h3>
          <div className="flex items-center gap-2 mt-1">
            <span className={cn('text-xs px-2 py-0.5 rounded-full font-medium', competitionColor[metric.competition])}>
              {metric.competition === 'low' ? 'Thấp' : metric.competition === 'medium' ? 'Trung bình' : 'Cao'}
            </span>
          </div>
        </div>
        {onSave && (
          <Button variant={isSaved ? 'secondary' : 'outline'} size="sm" onClick={onSave}>
            <Bookmark className={cn('h-4 w-4', isSaved && 'fill-current')} />
          </Button>
        )}
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <MetricItem icon={BarChart3} label="Lượt tìm kiếm" value={formatCompact(metric.estSearchVolume)} />
        <MetricItem icon={Eye} label="TB Views" value={formatCompact(metric.avgViewCount)} />
        <MetricItem icon={Heart} label="TB Likes" value={formatCompact(metric.avgLikeCount)} />
        <MetricItem icon={Users} label="Kênh khác nhau" value={String(metric.topChannelsCount)} />
      </div>

      {metric.relatedKeywords.length > 0 && (
        <div>
          <p className="text-sm font-medium mb-2 text-muted-foreground">Từ khoá liên quan</p>
          <div className="flex flex-wrap gap-1.5">
            {metric.relatedKeywords.map((kw) => (
              <Badge key={kw} variant="secondary" className="cursor-pointer hover:bg-accent">
                {kw}
              </Badge>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

function MetricItem({ icon: Icon, label, value }: { icon: any; label: string; value: string }) {
  return (
    <div className="flex flex-col gap-1 rounded-lg bg-muted/50 p-3">
      <Icon className="h-4 w-4 text-muted-foreground" />
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className="text-sm font-semibold">{value}</span>
    </div>
  )
}
```

**File:** `src/components/keywords/index.ts`
```typescript
export { KeywordSearchBar } from './KeywordSearchBar'
export { KeywordMetricCard } from './KeywordMetricCard'
```

### Task 4.2: Video components

**File:** `src/components/videos/VideoCard.tsx`

```tsx
import { Eye, Heart, MessageCircle, Clock, Bookmark } from 'lucide-react'
import type { YouTubeVideoStats } from '@/types'
import { formatCompact, parseDuration, formatDuration } from '@/lib/youtube'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface Props {
  video: YouTubeVideoStats
  onSave?: () => void
  isSaved?: boolean
}

export function VideoCard({ video, onSave, isSaved }: Props) {
  const durationSeconds = parseDuration(video.duration)

  return (
    <div className="rounded-xl border bg-card overflow-hidden hover:shadow-md transition-shadow">
      <div className="flex gap-3 p-3">
        {/* Thumbnail */}
        <a href={`https://youtube.com/watch?v=${video.videoId}`} target="_blank" rel="noopener noreferrer" className="relative shrink-0">
          <img src={video.thumbnailUrl} alt={video.title} className="w-32 h-18 rounded-lg object-cover" />
          <span className="absolute bottom-1 right-1 bg-black/80 text-white text-xs px-1 rounded">
            {formatDuration(durationSeconds)}
          </span>
        </a>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <a href={`https://youtube.com/watch?v=${video.videoId}`} target="_blank" rel="noopener noreferrer">
            <h3 className="text-sm font-medium line-clamp-2 hover:text-primary">{video.title}</h3>
          </a>
          <p className="text-xs text-muted-foreground mt-1">{video.channelTitle}</p>

          <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
            <span className="flex items-center gap-1"><Eye className="h-3 w-3" />{formatCompact(video.viewCount)}</span>
            <span className="flex items-center gap-1"><Heart className="h-3 w-3" />{formatCompact(video.likeCount)}</span>
            <span className="flex items-center gap-1"><MessageCircle className="h-3 w-3" />{formatCompact(video.commentCount)}</span>
          </div>
        </div>

        {onSave && (
          <Button variant="ghost" size="icon" className="shrink-0" onClick={onSave}>
            <Bookmark className={cn('h-4 w-4', isSaved && 'fill-current text-primary')} />
          </Button>
        )}
      </div>

      {/* Tags */}
      {video.tags.length > 0 && (
        <div className="px-3 pb-3 flex flex-wrap gap-1">
          {video.tags.slice(0, 5).map(tag => (
            <span key={tag} className="text-xs bg-muted px-1.5 py-0.5 rounded">#{tag}</span>
          ))}
          {video.tags.length > 5 && <span className="text-xs text-muted-foreground">+{video.tags.length - 5}</span>}
        </div>
      )}
    </div>
  )
}
```

**File:** `src/components/videos/VideoCardSkeleton.tsx` — loading skeleton (similar pattern to VideoCard layout).

**File:** `src/components/videos/index.ts`
```typescript
export { VideoCard } from './VideoCard'
export { VideoCardSkeleton } from './VideoCardSkeleton'
```

### Task 4.3: Channel components

**File:** `src/components/channels/ChannelCard.tsx`

```tsx
import { Users, Video, Eye, Bookmark } from 'lucide-react'
import type { YouTubeChannelStats } from '@/types'
import { formatCompact } from '@/lib/youtube'
import { Button } from '@/components/ui/button'
import { Avatar } from '@/components/shared'
import { cn } from '@/lib/utils'

interface Props {
  channel: YouTubeChannelStats
  onSave?: () => void
  isSaved?: boolean
}

export function ChannelCard({ channel, onSave, isSaved }: Props) {
  return (
    <div className="rounded-xl border bg-card p-4 flex items-center gap-3">
      <Avatar src={channel.thumbnailUrl} alt={channel.title} size={48} />
      <div className="flex-1 min-w-0">
        <a href={`https://youtube.com/channel/${channel.channelId}`} target="_blank" rel="noopener noreferrer">
          <h3 className="text-sm font-medium truncate hover:text-primary">{channel.title}</h3>
        </a>
        <p className="text-xs text-muted-foreground line-clamp-1">{channel.description}</p>
        <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
          <span className="flex items-center gap-1"><Users className="h-3 w-3" />{formatCompact(channel.subscriberCount)}</span>
          <span className="flex items-center gap-1"><Video className="h-3 w-3" />{formatCompact(channel.videoCount)}</span>
          <span className="flex items-center gap-1"><Eye className="h-3 w-3" />{formatCompact(channel.viewCount)}</span>
        </div>
      </div>
      {onSave && (
        <Button variant="ghost" size="icon" onClick={onSave}>
          <Bookmark className={cn('h-4 w-4', isSaved && 'fill-current text-primary')} />
        </Button>
      )}
    </div>
  )
}
```

**File:** `src/components/channels/index.ts`
```typescript
export { ChannelCard } from './ChannelCard'
```

### Task 4.4: Shared filter components

**File:** `src/components/shared/FilterBar.tsx`

```tsx
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { COUNTRIES, YOUTUBE_CATEGORIES } from '@/types'
import { useI18n } from '@/lib/i18n'

interface Props {
  country: string
  setCountry: (c: string) => void
  category?: string
  setCategory?: (c: string) => void
  showCategory?: boolean
}

export function FilterBar({ country, setCountry, category, setCategory, showCategory }: Props) {
  const { language } = useI18n()

  return (
    <div className="flex gap-2 flex-wrap">
      <Select value={country} onValueChange={setCountry}>
        <SelectTrigger className="w-[140px]"><SelectValue /></SelectTrigger>
        <SelectContent>
          {COUNTRIES.map(c => <SelectItem key={c.code} value={c.code}>{c.name}</SelectItem>)}
        </SelectContent>
      </Select>

      {showCategory && category && setCategory && (
        <Select value={category} onValueChange={setCategory}>
          <SelectTrigger className="w-[160px]"><SelectValue /></SelectTrigger>
          <SelectContent>
            {YOUTUBE_CATEGORIES.map(cat => (
              <SelectItem key={cat.id} value={cat.id}>
                {language === 'vi' ? cat.labelVi : cat.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}
    </div>
  )
}
```

**Update:** `src/components/shared/index.ts` — add `export { FilterBar } from './FilterBar'`

---

## Phase 5: Pages (Full Implementation)

### Task 5.1: Keyword Explorer page

**File:** `src/pages/KeywordExplorer.tsx`

Full page with: KeywordSearchBar at top, FilterBar for country, KeywordMetricCard showing analysis results, related keywords as clickable badges that trigger new searches, save/delete functionality.

Key structure:
```tsx
export default function KeywordExplorer() {
  const [keyword, setKeyword] = useState<string | null>(null)
  const [country, setCountry] = useState('VN')
  const { t } = useI18n()
  const { data: metric, isLoading, error } = useKeywordAnalysis(keyword, country)
  const { data: savedKeywords } = useSavedKeywords()
  const saveMutation = useSaveKeyword()
  const deleteMutation = useDeleteKeyword()

  const isSaved = metric ? savedKeywords?.some(k => k.keyword === metric.keyword) : false

  // Layout: SearchBar + FilterBar → Loading skeleton → MetricCard → Related keyword chips
}
```

### Task 5.2: Trending page

**File:** `src/pages/Trending.tsx`

Shows trending searches by:
- FilterBar (country + category + time range)
- Uses `searchVideos` with `order=viewCount` and `publishedAfter` for recent trending videos
- Groups top videos by keyword frequency in titles
- Displays as a chart (bar chart of top keywords by view count) + list of trending videos

```tsx
export default function Trending() {
  const [country, setCountry] = useState('VN')
  const [category, setCategory] = useState('0')
  const [timeRange, setTimeRange] = useState('7') // days

  // Calculate publishedAfter from timeRange
  const publishedAfter = new Date(Date.now() - parseInt(timeRange) * 86400000).toISOString()

  // Fetch trending music, gaming, etc. by searching chart-topping categories
  // Use multiple category-specific searches in parallel
}
```

### Task 5.3: Video Analyzer page

**File:** `src/pages/VideoAnalyzer.tsx`

```tsx
export default function VideoAnalyzer() {
  const [keyword, setKeyword] = useState<string | null>(null)
  const [country, setCountry] = useState('VN')
  const [sortBy, setSortBy] = useState<'views' | 'likes' | 'comments' | 'newest'>('views')

  const { data, isLoading } = useVideoSearch(keyword, {
    maxResults: 25, order: sortBy === 'newest' ? 'date' : 'relevance', regionCode: country
  })

  // Sort stats client-side if sorting by views/likes/comments
  // Display: search bar + filter bar + sort tabs + grid of VideoCards
  // Export CSV button
}
```

### Task 5.4: Channel Analyzer page

**File:** `src/pages/ChannelAnalyzer.tsx`

```tsx
export default function ChannelAnalyzer() {
  const [query, setQuery] = useState<string | null>(null)
  const { data: channels, isLoading } = useChannelSearch(query)
  const { data: savedChannels } = useSavedChannels()
  const saveMutation = useSaveChannel()

  // Display: search bar + list of ChannelCards sorted by subscriber count
}
```

### Task 5.5: Dashboard page

**File:** `src/pages/Dashboard.tsx`

Overview page showing:
- Quick stats cards (total searches, saved keywords, saved videos, API quota used today)
- Recent searches (from search_history, clickable to re-run)
- Saved keywords preview (top 5, link to full list)
- API quota progress bar (default YouTube quota = 10,000 units/day)

### Task 5.6: Search History page

**File:** `src/pages/SearchHistory.tsx`

Simple list of past searches with timestamps, filterable by search_type. Each item clickable to re-run the search.

### Task 5.7: API Key Settings page

**File:** `src/pages/ApiKeySettings.tsx`

```tsx
export default function ApiKeySettings() {
  const { data: currentKey } = useApiKey()
  const { data: usage } = useApiUsage()
  const saveMutation = useSaveApiKey()
  const [apiKey, setApiKey] = useState('')

  // Masked input showing current key (only last 4 chars)
  // Instructions on how to get a YouTube Data API v3 key (link to Google Cloud Console)
  // API quota usage display (progress bar toward 10,000 units/day)
  // Save button
}
```

---

## Phase 6: Supabase Config & Deployment

### Task 6.1: Update supabase/config.toml

Ensure the new Edge Functions are recognized. The functions directory structure handles this automatically — each folder under `supabase/functions/` with an `index.ts` is deployable.

### Task 6.2: Update .env.example

```env
# Supabase
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key

# Push notifications
VITE_VAPID_PUBLIC_KEY=

# Note: YouTube Data API key is stored per-user in the database (user_api_keys table).
# Users enter their own key in Settings → API Key.
```

### Task 6.3: Update GitHub Actions deploy workflow

**File:** `.github/workflows/deploy-supabase.yml`

Ensure it deploys the new edge functions (`youtube-search`, `youtube-suggest`) alongside any existing functions.

### Task 6.4: Update README.md

Replace the finance-specific README with project description, setup instructions, how to get YouTube API key, and feature list.

### Task 6.5: Update CLAUDE.md

Replace the entire CLAUDE.md with updated architecture docs reflecting the YouTube research tool structure.

---

## Phase 7: Verification

### Task 7.1: Full build verification

```bash
cd /home/vmo/vibe-coding/vibe-tube-atlas
npm run build
```

Expected: zero TypeScript errors, zero Vite errors.

### Task 7.2: Dev server smoke test

```bash
npm run dev
```

- Visit `/login` — login page renders
- Visit `/dashboard` — redirects to login (not authenticated)
- Verify navigation renders correctly
- Verify no console errors

### Task 7.3: Commit and push

```bash
git add -A
git commit -m "feat: complete vibe-tube-atlas YouTube keyword research tool"
git push origin main
```

---

## Key Design Decisions

### 1. Per-user API keys (not shared)
Each user brings their own YouTube Data API key (free tier: 10,000 quota units/day). This avoids a shared quota bottleneck and makes the app scale infinitely without the developer paying for API quota. Keys are stored in Supabase `user_api_keys` table.

### 2. Edge Function as proxy
The `youtube-search` Edge Function acts as a proxy — it reads the user's API key from the DB and makes the YouTube API call server-side. This keeps the API key out of the client bundle and allows centralized quota tracking.

### 3. Keyword autocomplete is free
The `youtube-suggest` Edge Function uses YouTube's public autocomplete endpoint (`suggestqueries.google.com`), which requires no API key and costs zero quota units. This powers the search bar suggestions.

### 4. Keyword metrics are estimated
True search volume data is not available from YouTube Data API. We estimate using:
- Total result count from search → competition level
- Average view/like counts of top 50 videos → engagement signals
- Unique channel count → saturation

### 5. What's kept from vibe-expense
- **Auth flow:** Login, Register, ForgotPassword, ResetPassword, VerifyEmail
- **Supabase client + mock fallback** for dev without backend
- **MainLayout** (updated navigation)
- **UI components:** shadcn/ui (Button, Input, Select, Badge, Card, etc.)
- **Shared components:** Avatar, EmptyState, PageTransition, SkeletonLoader, OfflineBanner
- **Theme provider, i18n, ErrorBoundary, providers hierarchy**
- **TanStack Query setup, Zustand setup**
- **Vite config, ESLint, TypeScript configs**

### 6. YouTube Data API quota costs
| Action | Quota Cost |
|--------|-----------|
| search.list | 100 units |
| videos.list | 1 unit |
| channels.list | 1 unit |
| commentThreads.list | 1 unit |

With 10,000 units/day, users can do ~100 keyword searches or thousands of video/channel lookups.

---

## Risks & Open Questions

1. **YouTube autocomplete reliability** — The `suggestqueries.google.com` endpoint is unofficial and could change. Mitigation: wrap in try/catch, degrade gracefully.

2. **API key security** — User API keys are stored plaintext in Supabase. For production, consider encrypting with a Supabase Edge Function secret. RLS ensures only the owner can read their key.

3. **Rate limiting** — No per-user rate limiting on Edge Function calls yet. A user could spam requests. Mitigation: add a check on `api_usage` table before allowing new requests.

4. **YouTube category IDs differ by country** — Category IDs are not universal. For now, we use a fixed list. Could fetch categories per-country via the API.

5. **Estimating search volume** — Our estimation is rough. Consider integrating Google Trends API (via unofficial `trends.google.com` scraping) for better trend data in a future iteration.

---

## File Structure Summary

```
src/
├── pages/
│   ├── Dashboard.tsx           # Overview: stats, recent searches, saved items
│   ├── KeywordExplorer.tsx     # Keyword research with metrics + suggestions
│   ├── Trending.tsx            # Trending topics by country/category
│   ├── VideoAnalyzer.tsx       # Search videos, view detailed stats
│   ├── ChannelAnalyzer.tsx     # Search channels, view subscriber stats
│   ├── SearchHistory.tsx       # Past searches
│   ├── ApiKeySettings.tsx      # User's YouTube API key management
│   ├── Login.tsx               # (kept from vibe-expense)
│   ├── Register.tsx            # (kept)
│   ├── ForgotPassword.tsx      # (kept)
│   ├── ResetPassword.tsx       # (kept)
│   ├── VerifyEmail.tsx         # (kept)
│   ├── Profile.tsx             # (kept)
│   ├── LanguageSettings.tsx    # (kept)
│   ├── PasswordSettings.tsx    # (kept)
│   ├── Notifications.tsx       # (kept)
│   ├── NotFound.tsx            # (kept)
│   ├── ServerError.tsx         # (kept)
│   └── Forbidden.tsx           #kept)
├── components/
│   ├── keywords/
│   │   ├── KeywordSearchBar.tsx
│   │   ├── KeywordMetricCard.tsx
│   │   └── index.ts
│   ├── videos/
│   │   ├── VideoCard.tsx
│   │   ├── VideoCardSkeleton.tsx
│   │   └── index.ts
│   ├── channels/
│   │   ├── ChannelCard.tsx
│   │   └── index.ts
│   └── shared/
│       ├── FilterBar.tsx        # NEW: country/category filter
│       └── (existing components kept)
├── hooks/
│   ├── useAuth.ts              # (kept)
│   ├── useKeywords.ts          # NEW
│   ├── useVideos.ts            # NEW
│   ├── useChannels.ts          # NEW
│   ├── useSearchHistory.ts     # NEW
│   └── useApiKey.ts            # NEW
├── lib/
│   ├── youtube.ts              # NEW: YouTube API client
│   ├── csv.ts                  # NEW: CSV export
│   ├── supabase.ts             # (kept)
│   ├── i18n/                   # (kept, translations updated)
│   ├── utils.ts                # (kept)
│   └── locale.ts               # (kept)
├── types/
│   └── index.ts                # rewritten: YouTube domain types
├── stores/
│   └── uiStore.ts              # simplified
├── layouts/
│   ├── MainLayout.tsx          # updated navigation
│   └── AuthLayout.tsx          # (kept)
└── App.tsx                     # rewritten: new routes

supabase/
├── migrations/
│   ├── (existing profile/migration files kept)
│   └── 20260728000000_tube_atlas_schema.sql  # NEW
└── functions/
    ├── youtube-search/
    │   └── index.ts            # NEW: YouTube Data API proxy
    └── youtube-suggest/
        └── index.ts            # NEW: autocomplete suggestions
```
