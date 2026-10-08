# Fix Plan — Code Review 2026-09-04

**STATUS: APPLIED 2026-09-04** (fixes 1-13; #14 verify-email route left as-is for future use). Lint after: 0 errors, 1 pre-existing warning (Avatar.tsx object-injection). Pending on host: `npx vitest run && npm run build` + migration deploy via GitHub Actions.

Scope: full review (edge functions, hooks, pages, migration, SW, CSP). Lint run: 1 error, 4 warnings. Tests/build not runnable in review sandbox (lightningcss native binary is macOS-only; run on host).

## P0 — Bugs users hit now

### 1. Duplicate saved keywords
- `saved_keywords` table has no unique constraint on (user_id, keyword); KeywordExplorer save button stays enabled when `isSaved` → repeat clicks insert duplicate rows.
- Fix:
  - `supabase/migrations/20260729000000_saved_keywords_unique.sql`: add `CREATE UNIQUE INDEX IF NOT EXISTS idx_saved_keywords_user_keyword ON saved_keywords(user_id, lower(keyword));` + dedupe existing rows first.
  - `src/pages/KeywordExplorer.tsx:178` — `disabled={saveMutation.isPending || isSaved}`.
  - Optional: `useSaveKeyword` switch to upsert with `onConflict: 'user_id,keyword'`.

### 2. Edge Function error messages never reach the user
- `youtube-search` returns 4xx/5xx with `{error: "No YouTube API key found..."}`, but `supabase.functions.invoke` (v2) surfaces only generic `FunctionsHttpError: "Function returned an error"`. Pages show `error.message` → users see noise, not the cause.
- Fix in `src/lib/youtube.ts` `callProxyRaw`:
  ```ts
  if (error) {
    let msg = error.message
    const res = (error as FunctionsHttpError).context
    if (res) { try { msg = (await res.clone().json())?.error ?? msg } catch { /* keep */ } }
    throw new Error(msg)
  }
  ```
- Same for `getSuggestions` (already degrades gracefully — skip).

### 3. Lint error blocks CI
- `src/pages/KeywordExplorer.tsx:25-34` — `react-hooks/set-state-in-effect` (deep-link `?q=` effect).
- Fix: derive from searchParams without effect:
  ```ts
  const initialQ = searchParams.get('q') // read once via useState initializer
  const [input, setInput] = useState(initialQ ?? '')
  const [params, setParams] = useState<AnalyzeKeywordParams | null>(initialQ ? { keyword: initialQ } : null)
  ```
  and strip `q` in the same one-time initializer (or a mount effect that only calls `setSearchParams` — allowed, no setState).

## P1 — Data reliability / correctness drift

### 4. Fire-and-forget DB writes in Edge Function may be dropped
- `supabase/functions/youtube-search/index.ts:240-262` — `api_usage` + `search_history` inserts are un-awaited; Deno may terminate after response → lost quota logs (usage bar under-counts) and lost history.
- Fix: collect promises, before returning:
  ```ts
  const logs = [supabase.from('api_usage').insert(...)]
  if (action === 'search') logs.push(supabase.from('search_history').insert(...))
  await Promise.allSettled(logs)
  ```
  (still swallow errors so logging never fails the request). ~1 DB round-trip added.

### 5. Quota "today" uses UTC; YouTube resets at midnight Pacific
- `src/hooks/useApiKey.ts:69-70` — UTC day boundary vs PT reset vs VN (UTC+7) users. Bar resets at wrong time.
- Fix: compute PT day boundaries and query `created_at` between them:
  ```ts
  const now = new Date()
  const ptNow = new Date(now.toLocaleString('en-US', { timeZone: 'America/Los_Angeles' }))
  const ptMidnight = new Date(Date.UTC(ptNow.getFullYear(), ptNow.getMonth(), ptNow.getDate()))
  // offset from UTC-midnight of that PT day = ptMidnight - UTC-midnight of same PT calendar date
  ```
  ponytail: exact PT DST handled by Intl formatting; upgrade path = move aggregation server-side (view or RPC) if accuracy complaints persist.

### 6. Vercel Speed Insights beacons blocked by CSP
- `vercel.json:15` — `connect-src` lacks `https://vitals.vercel-insights.com` (sendBeacon subject to connect-src). Analytics silently dead.
- Fix: add origin to `connect-src`. Script itself is same-origin (`/_vercel/insights/script.js`) — no script-src change needed.

## P2 — Hygiene / convention drift

7. **`useUpdateProfile` accepts `currency`** (`src/hooks/useAuth.ts:199`) — `profiles` has no such column; passing it → Postgres 400. Dead param from another app; remove.
8. **Trending page bypasses React Query** (`src/pages/Trending.tsx:24-46`) — manual `useState` + fetch, violates "TanStack Query for ALL server data", loses cache/offline (the PWA story). Refactor to `useQuery({ queryKey: ['trending', country, category] })` with `enabled: manual trigger or staleTime Infinity`. Also `toLocaleDateString()` → use `src/lib/dateUtils.ts` with active locale.
9. **Dead i18n guard** (`src/lib/i18n/index.tsx:62`) — `createContext(initialState)` means context never `undefined`; check never fires and provider-less use silently gets vi. Create with `undefined` default: `createContext<I18nProviderState | undefined>(undefined)`.
10. **Dev mock credentials ship in prod bundle** — `src/mocks/mockAuth.ts` imported unconditionally by `useAuth.ts`. Password string lands in prod JS. Cosmetic (dead code path) but wrap: `const getMockUsers = () => import.meta.env.DEV ? {...} : {}` or dynamic import.
11. **`parseISODuration`** (`src/lib/youtube.ts:194`) — regex misses `P#DT...` (days) → returns '0:00'. Add optional `(?:(\d+)D)?` after `P`.
12. **Avatar upload ext mismatch** (`src/hooks/useAvatar.ts:112-113`) — blob is always JPEG after resize but filename ext can be `.png`/`.webp`. Always use `avatar.jpg`.
13. **Lint warnings to silence (false positives)**: `security/detect-object-injection` on `QUOTA_COSTS[action]` (edge fn, line 163) and timing-attack on `ResetPassword.tsx:70` — add scoped eslint-disable with comment, or restructure `QUOTA_COSTS[action as keyof typeof QUOTA_COSTS] ?? 1`.
14. **Dead route**: `/verify-email` page exists while email confirmation disabled. Either remove route+page or keep for future enable; document choice in CLAUDE.md.

## Not bugs (verified, leave alone)
- RLS: every table covered; `FOR ALL USING` implies WITH CHECK — correct.
- Storage avatar policies INSERT-only (no UPDATE) — acceptable since `upsert: true` needs... ⚠️ actually `upsert` on storage = POST with x-upsert header → INSERT path. OK.
- CSP `img-src https:` covers YouTube thumbnails. `connect-src` covers supabase.co — if project migrates to supabase.com domain, update.
- SW caching of supabase GETs — intentional offline read story.
- Quota costs: search=100 logged correctly; `videos` id-batch fine.

## Suggested order
1 → 3 → 2 (UX correctness), then 4 → 6 (one edge-fn + one JSON edit, deploy together), 5, then P2 batch in one PR.

## Verification per fix
- 1: save twice in UI → single row; DB unique index present.
- 2: remove API key, search → toast/card shows "No YouTube API key found...".
- 3: `npm run lint` exit 0.
- 4: `supabase functions logs` — api_usage rows appear per call.
- 5: set clock near PT midnight, check bar window (unit test on boundary fn).
- 6: Vercel Speed Insights dashboard receives events.
- Full: `npx vitest run && npm run build` on host (sandbox cannot run — lightningcss darwin binary).
