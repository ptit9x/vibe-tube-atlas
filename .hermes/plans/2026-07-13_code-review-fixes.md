# Vibe Tube Atlas — Code Review & Fix Plan

> **For Hermes:** Use subagent-driven-development skill to implement this plan task-by-task.

**Goal:** Khắc phục các vấn đề phát hiện qua audit: security (Supabase RPC), performance (React render, data fetching), và code quality (dead code, type mismatch, bundle size).

**Architecture:** React 19 + Vite + TypeScript + Supabase. Zustand stores cho UI state, TanStack Query v5 cho server data. Offline-first outbox pattern.

**Tech Stack:** React 19, Vite 8, TS 6, TailwindCSS v4, Supabase (PostgreSQL + RLS + Edge Functions), Zustand v5, TanStack Query v5.

---

## Tóm tắt phát hiện (Audit Summary)

### Build & Lint Status
- ✅ `npm run build` — PASS (0 errors)
- ✅ ESLint — 0 errors, 17 warnings (tất cả là `security/detect-object-injection` false positives trên typed objects — không cần fix)
- ✅ Không có `console.log` trong production code
- ✅ Không có `arguments` trong arrow functions (runtime crash pattern)
- ✅ Không có `any` types trong app code
- ✅ Không có `select('*')` — tất cả hooks dùng explicit column lists

### Vấn đề phát hiện (theo severity)

| # | Severity | Domain | Issue | File(s) |
|---|----------|--------|-------|---------|
| 1 | 🔴 CRITICAL | Security | `get_monthly_report(UUID, TEXT)` overload vẫn tồn tại — migration fix dùng `DROP` nhưng cần verify trên production DB | `supabase/migrations/` |
| 2 | 🔴 CRITICAL | Security | `get_category_stats(UUID, DATE, DATE)` overload — tương tự #1 | `supabase/migrations/` |
| 3 | 🟡 MEDIUM | Type Safety | `CategoryStat` interface mismatch với RPC return shape — `transaction_type`, `total_amount`, `transaction_count` vs `total`, `count` | `src/hooks/useReports.ts` |
| 4 | 🟡 MEDIUM | Performance | `useAppNotifications()` polling 30s + gọi ở cả MainLayout (DesktopSidebar) lẫn Notifications page → duplicate observer | `src/layouts/MainLayout.tsx`, `src/pages/Notifications.tsx` |
| 5 | 🟡 MEDIUM | Performance | `useCategoryStats` hook export nhưng không được dùng ở đâu — dead code | `src/hooks/useReports.ts` |
| 6 | 🟡 MEDIUM | Performance | `heic2any` chunk 1.35MB — dynamic import nhưng vẫn vào bundle (chunk warning) | `src/hooks/useAvatar.ts`, `vite.config.ts` |
| 7 | 🟡 MEDIUM | React Quality | `TransactionRow` render trong list nhưng không có `React.memo` — re-render toàn bộ list khi parent state change | `src/components/shared/TransactionRow.tsx` |
| 8 | 🟡 MEDIUM | React Quality | `OfflineBanner` selector `.filter()` tạo new array mỗi store change — Zustand v5 `Object.is` sẽ re-render | `src/components/shared/OfflineBanner.tsx` |
| 9 | 🟢 LOW | Code Quality | `useOnlineStatus()` import unused trong `useOutboxSync` (dùng `isOnlineRef` qua `useEffect`) — actually used, không phải unused | — |
| 10 | 🟢 LOW | Code Quality | `useReports.ts` mock data hardcoded tiếng Anh (`'Food'`, `'Transport'`) trong khi app là Vietnamese-first | `src/hooks/useReports.ts` |
| 11 | 🟢 LOW | Code Quality | `get_budget_status` function drop trong migration nhưng chưa verify thực sự gone trên prod DB | `supabase/migrations/` |
| 12 | 🟢 LOW | Performance | `fetchWallets()` trong `useFinancialReports.ts` duplicate logic balance computation với `useWallets.ts` — DRY violation | `src/hooks/useFinancialReports.ts` |
| 13 | 🟢 LOW | i18n | `ReportComponents.tsx` hardcoded `'vi-VN'/'en-US'` ternary thay vì dùng `localeMap` pattern | `src/components/reports/ReportComponents.tsx:259` |
| 14 | 🟢 LOW | Mobile UX | `grid-cols-3` trong `AddWalletModal` wallet type selector — có thể hẹp trên mobile nhỏ | `src/components/wallets/AddWalletModal.tsx` |

---

## Task 1: Verify & fix Supabase RPC overload security (CRITICAL)

**Objective:** Đảm bảo các insecure RPC overloads (trust `p_user_id`) thực sự bị drop trên production DB, không chỉ trong migration files.

**Files:**
- Create: `supabase/migrations/20260713000000_verify_rpc_overloads_gone.sql`

**Context:**
- Migration `20260706000000` đã `DROP FUNCTION IF EXISTS public.get_monthly_report(UUID, TEXT)` và `DROP FUNCTION IF EXISTS public.get_category_stats(UUID, DATE, DATE)` rồi `CREATE OR REPLACE` phiên bản secure.
- Vấn đề: migrations có thể chưa được apply trên production DB (CLAUDE.md ghi "MUST be run manually on Supabase SQL Editor").
- Cần verify bằng query trực tiếp và tạo migration idempotent final.

**Step 1: Tạo verification migration**

```sql
-- supabase/migrations/20260713000000_verify_rpc_overloads_gone.sql
-- Idempotent safety net: ensure ALL insecure RPC overloads are gone.
-- The fix migration 20260706000000 drops these, but if it was not applied
-- (e.g., manual SQL editor was used for a subset), these overloads persist.

-- Drop insecure overloads that trust p_user_id (auth.uid() bypass)
DROP FUNCTION IF EXISTS public.get_monthly_report(UUID, TEXT);
DROP FUNCTION IF EXISTS public.get_category_stats(UUID, DATE, DATE);
DROP FUNCTION IF EXISTS public.get_budget_status(UUID, UUID);

-- Verify: only the secure single-arg versions should remain
-- (get_monthly_report(TEXT), get_category_stats(DATE, DATE), get_wallet_balance(UUID))
```

**Step 2: Verify locally**

```bash
# If supabase CLI is available:
supabase db reset 2>&1 | tail -5

# Otherwise, document for manual verification:
echo "Run on Supabase SQL Editor:
SELECT proname, pg_get_function_arguments(oid) as args
FROM pg_proc
WHERE proname IN ('get_monthly_report', 'get_category_stats', 'get_budget_status', 'get_wallet_balance')
ORDER BY proname;
-- Expected: NO rows with UUID as first arg for get_monthly_report/get_category_stats"
```

**Step 3: Commit**

```bash
git add supabase/migrations/20260713000000_verify_rpc_overloads_gone.sql
git commit -m "security: idempotent migration to ensure insecure RPC overloads are dropped"
```

---

## Task 2: Fix CategoryStat type mismatch (MEDIUM)

**Objective:** `CategoryStat` interface không khớp với shape thực tế trả về từ `get_category_stats` RPC.

**Files:**
- Modify: `src/hooks/useReports.ts:12-18`

**Context:**
- RPC `get_category_stats` (migration `20260706000000`) trả về: `category_id, category_name, category_icon, category_color, transaction_type, total_amount, transaction_count`
- Interface `CategoryStat` định nghĩa: `category_id, category_name, category_icon, category_color, total, count` (thiếu `transaction_type`, sai key names)
- Dù `useCategoryStats` hiện không được dùng (dead code — Task 5), `MonthlyReport.by_category` cũng dùng interface này và shape sai.

**Step 1: Fix interface**

```typescript
// src/hooks/useReports.ts — replace CategoryStat interface

export interface CategoryStat {
  category_id: string
  category_name: string
  category_icon: string
  category_color: string
  transaction_type?: string  // present in get_category_stats, absent in get_monthly_report.by_category
  total: number              // get_monthly_report uses 'total'
  total_amount?: number      // get_category_stats uses 'total_amount'
  count: number              // get_monthly_report uses 'count'
  transaction_count?: number // get_category_stats uses 'transaction_count'
}
```

> **Note:** Cách tốt hơn là tách 2 interface riêng (`MonthlyCategoryStat` vs `CategoryStatRow`), nhưng vì `useCategoryStats` là dead code (Task 5 sẽ xóa), ta chỉ cần fix `MonthlyReport.by_category` shape. Xem Task 5.

**Step 2: Build verify**

```bash
npm run build
# Expected: PASS, no new errors
```

**Step 3: Commit**

```bash
git add src/hooks/useReports.ts
git commit -m "fix: align CategoryStat interface with actual RPC return shape"
```

---

## Task 3: Fix OfflineBanner Zustand selector performance (MEDIUM)

**Objective:** Zustand v5 selector trả về new array qua `.filter()` → re-render không cần thiết.

**Files:**
- Modify: `src/components/shared/OfflineBanner.tsx:8-9`

**Context:**
- `useOutboxStore((s) => s.entries.filter(...))` — `.filter()` tạo new array ref mỗi lần store change. Zustand v5 dùng `Object.is` → component re-render ngay cả khi count không đổi.
- Fix: select primitive counts, hoặc select raw entries + `useMemo`.

**Step 1: Fix selectors**

```tsx
// src/components/shared/OfflineBanner.tsx — replace lines 8-9

// Select raw entries, derive counts via useMemo (avoids new-array-in-selector)
const entries = useOutboxStore((s) => s.entries)
const retryFailed = useOutboxStore((s) => s.retryFailed)

const pendingCount = useMemo(
  () => entries.filter((e) => e.status === 'pending' || e.status === 'syncing').length,
  [entries]
)
const failedCount = useMemo(
  () => entries.filter((e) => e.status === 'failed').length,
  [entries]
)
```

Add `useMemo` to imports:

```tsx
import { useMemo } from 'react'
```

**Step 2: Build verify**

```bash
npm run build
```

**Step 3: Commit**

```bash
git add src/components/shared/OfflineBanner.tsx
git commit -m "perf: derive outbox counts via useMemo instead of filter-in-selector"
```

---

## Task 4: Add React.memo to TransactionRow (MEDIUM)

**Objective:** `TransactionRow` render trong list (Dashboard, Transactions page) — cần `React.memo` để tránh re-render toàn bộ list.

**Files:**
- Modify: `src/components/shared/TransactionRow.tsx`
- Check: `src/pages/Transactions.tsx`, `src/components/dashboard/RecentTransactions.tsx`, `src/components/notifications/NotificationBell.tsx` (for usage patterns)

**Context:**
- `TransactionRow` là functional component, không có `React.memo`.
- Render trong `.map()` ở Dashboard RecentTransactions và Transactions page.
- Khi parent state change (filter, month select), toàn bộ rows re-render.

**Step 1: Wrap with React.memo**

```tsx
// src/components/shared/TransactionRow.tsx
// Change the export pattern:

// BEFORE:
// export function TransactionRow({ ... }: TransactionRowProps) {
//   return ( ... )
// }

// AFTER:
import { memo } from 'react'

export const TransactionRow = memo(function TransactionRow({ ... }: TransactionRowProps) {
  // ... existing body unchanged ...
})
```

> **Pitfall:** Nếu parent truyền inline callbacks (`onClick={() => ...}`), `memo` vô tác dụng. Kiểm tra parent components — nếu có inline callback, wrap với `useCallback`.

**Step 2: Verify parent components pass stable props**

```bash
# Check for inline callbacks passed to TransactionRow
grep -A5 'TransactionRow' src/pages/Transactions.tsx src/components/dashboard/RecentTransactions.tsx | grep '=>'
```

Nếu tìm thấy inline callbacks → `useCallback` ở parent.

**Step 3: Build verify**

```bash
npm run build
```

**Step 4: Commit**

```bash
git add src/components/shared/TransactionRow.tsx
git commit -m "perf: wrap TransactionRow with React.memo for list render optimization"
```

---

## Task 5: Remove dead code — `useCategoryStats` hook (MEDIUM)

**Objective:** `useCategoryStats` export nhưng không import ở đâu trong codebase.

**Files:**
- Modify: `src/hooks/useReports.ts` — remove `useCategoryStats` function + `getMockCategoryStats` helper

**Context:**
- `grep -rn 'useCategoryStats' src/` → chỉ tìm thấy định nghĩa, không có usage.
- `get_category_stats` RPC vẫn dùng (gọi từ... không có gì). Nhưng giữ RPC trong DB không hại — chỉ xóa dead frontend code.

**Step 1: Remove dead code**

Xóa từ `src/hooks/useReports.ts`:
- `export function useCategoryStats(...)` (lines ~40-56)
- `function getMockCategoryStats(): CategoryStat[]` (lines ~77-83)
- Giữ lại interface `CategoryStat` nếu `MonthlyReport.by_category` vẫn dùng.

**Step 2: Build verify**

```bash
npm run build
# Expected: PASS — no references to useCategoryStats remain
```

**Step 3: Commit**

```bash
git add src/hooks/useReports.ts
git commit -m "refactor: remove dead useCategoryStats hook (unused)"
```

---

## Task 6: Deduplicate notification polling (MEDIUM)

**Objective:** `useAppNotifications()` poll 30s. Được gọi ở:
1. `MainLayout` → `DesktopSidebar` (desktop only, `lg:` breakpoint)
2. `Notifications` page
3. `NotificationBell` (desktop sidebar)

→ Khi ở trang Notifications trên desktop, có 3 subscribers cùng cache key. TanStack Query dedup same-key queries trong cùng `staleTime`, nên chỉ 1 network request. Nhưng 3 query observers = 3 re-render triggers.

**Assessment:** Đây không phải bug — TanStack Query handles dedup. `refetchInterval` trên shared query key chỉ tạo 1 timer. Re-render impact minimal vì data identical.

**Action:** Skip — thấp priority. Nếu muốn optimize, pass `unreadCount` từ `MainLayout` xuống `Notifications` page via context/prop thay vì gọi hook riêng. Nhưng ROI thấp.

**→ Mark as WILL NOT FIX (justified)**

---

## Task 7: Fix hardcoded locale in ReportComponents (LOW)

**Objective:** `ReportComponents.tsx:259` dùng ternary `language === 'vi' ? 'vi-VN' : 'en-US'` thay vì `localeMap` pattern.

**Files:**
- Modify: `src/components/reports/ReportComponents.tsx:255-260`

**Step 1: Extract localeMap**

```tsx
// src/components/reports/ReportComponents.tsx
// Add near top (after imports):

const LOCALE_MAP: Record<string, string> = { vi: 'vi-VN', en: 'en-US' }

// Line 259 — change:
// BEFORE:
const monthLabel = new Date(2000, i).toLocaleDateString(language === 'vi' ? 'vi-VN' : 'en-US', { month: 'short' })

// AFTER:
const monthLabel = new Date(2000, i).toLocaleDateString(LOCALE_MAP[language] || 'vi-VN', { month: 'short' })
```

**Step 2: Build verify**

```bash
npm run build
```

**Step 3: Commit**

```bash
git add src/components/reports/ReportComponents.tsx
git commit -m "i18n: use localeMap pattern instead of hardcoded ternary"
```

---

## Task 8: Extract shared wallet balance computation (LOW)

**Objective:** Balance computation logic duplicate giữa `useWallets.ts` và `useFinancialReports.ts` (fetchWallets helper).

**Files:**
- Create: `src/lib/walletBalance.ts`
- Modify: `src/hooks/useWallets.ts`
- Modify: `src/hooks/useFinancialReports.ts`

**Context:**
- `useWallets.ts:50-98` và `useFinancialReports.ts:108-160` có logic compute balance giống hệt nhau (batch query transactions + balanceMap + transfer credits).
- DRY violation — fix bug ở 1 chỗ quên chỗ kia.

**Step 1: Extract shared function**

```typescript
// src/lib/walletBalance.ts
import { supabase } from '@/lib/supabase'
import type { Wallet } from '@/types'

interface RawWallet {
  id: string
  user_id: string
  name: string
  type: string
  icon: string | null
  color: string | null
  initial_balance: number
  is_active: boolean
  created_at: string
  updated_at: string | null
}

/**
 * Compute wallet balances client-side via batch transaction query.
 * Shared by useWallets and useFinancialReports to avoid logic duplication.
 */
export async function computeWalletBalances(
  walletData: RawWallet[],
  userId: string
): Promise<Wallet[]> {
  if (walletData.length === 0) return []

  const walletIds = walletData.map(w => w.id)

  const { data: txData } = await supabase
    .from('transactions')
    .select('wallet_id, to_wallet_id, type, amount')
    .in('wallet_id', walletIds)
    .eq('user_id', userId)

  const balanceMap = new Map<string, number>()
  for (const tx of (txData || [])) {
    const wId = tx.wallet_id
    const prev = balanceMap.get(wId) || 0
    if (tx.type === 'income' || tx.type === 'borrow') {
      balanceMap.set(wId, prev + tx.amount)
    } else if (tx.type === 'expense' || tx.type === 'lend' || tx.type === 'transfer') {
      balanceMap.set(wId, prev - tx.amount)
    }
  }

  // Credit destination wallets for transfers
  const { data: transferData } = await supabase
    .from('transactions')
    .select('to_wallet_id, amount')
    .in('to_wallet_id', walletIds)
    .eq('user_id', userId)
    .eq('type', 'transfer')

  for (const tx of (transferData || [])) {
    if (tx.to_wallet_id) {
      const prev = balanceMap.get(tx.to_wallet_id) || 0
      balanceMap.set(tx.to_wallet_id, prev + tx.amount)
    }
  }

  return walletData.map(wallet => ({
    ...wallet,
    balance: (balanceMap.get(wallet.id) || 0) + (wallet.initial_balance || 0),
  })) as Wallet[]
}
```

**Step 2: Refactor `useWallets.ts`**

```typescript
// src/hooks/useWallets.ts — replace inline balance computation (lines ~50-98)
import { computeWalletBalances } from '@/lib/walletBalance'

// In useWallets queryFn, after fetching wallet data:
const walletsWithBalance = await computeWalletBalances(data, user.id)
return walletsWithBalance
```

**Step 3: Refactor `useFinancialReports.ts`**

```typescript
// src/hooks/useFinancialReports.ts — replace fetchWallets() helper entirely
import { computeWalletBalances } from '@/lib/walletBalance'

// In useGenerateReport mutationFn:
const cachedWallets = queryClient.getQueryData<Wallet[]>(['wallets', false])
const wallets = cachedWallets
  ? cachedWallets.filter(w => w.is_active)
  : isSupabaseConfigured()
    ? await fetchActiveWallets() // simplified — just fetch raw + compute
    : getMockWallets()

// New simplified helper:
async function fetchActiveWallets(): Promise<Wallet[]> {
  const user = await requireAuth()
  const { data, error } = await supabase
    .from('wallets')
    .select('id, user_id, name, type, icon, color, initial_balance, is_active, created_at, updated_at')
    .eq('user_id', user.id)
    .eq('is_active', true)
  if (error) throw error
  return computeWalletBalances(data || [], user.id)
}
```

Delete the old `fetchWallets()` function (~50 lines).

**Step 4: Build verify**

```bash
npm run build
```

**Step 5: Commit**

```bash
git add src/lib/walletBalance.ts src/hooks/useWallets.ts src/hooks/useFinancialReports.ts
git commit -m "refactor: extract shared wallet balance computation (DRY)"
```

---

## Task 9: Fix Vietnamese mock data in useReports (LOW)

**Objective:** Mock data trong `useReports.ts` hardcoded tiếng Anh (`'Food'`, `'Transport'`, `'Shopping'`) — không nhất quán với app Vietnamese-first.

**Files:**
- Modify: `src/hooks/useReports.ts`

**Step 1: Fix mock data**

```typescript
// src/hooks/useReports.ts — getMockReport and getMockCategoryStats

function getMockReport(month: string): MonthlyReport {
  return {
    month,
    total_income: 25000000,
    total_expense: 15200000,
    net_balance: 9800000,
    by_category: [
      { category_id: 'c1', category_name: 'Ăn uống', category_icon: '🍔', category_color: '#EF4444', total: 5200000, count: 26 },
      { category_id: 'c2', category_name: 'Di chuyển', category_icon: '🚗', category_color: '#F59E0B', total: 1800000, count: 18 },
      { category_id: 'c3', category_name: 'Mua sắm', category_icon: '🛒', category_color: '#8B5CF6', total: 3500000, count: 8 },
      { category_id: 'c4', category_name: 'Giải trí', category_icon: '🎮', category_color: '#06B6D4', total: 1200000, count: 6 },
      { category_id: 'c5', category_name: 'Khác', category_icon: '💰', category_color: '#6B7280', total: 3500000, count: 12 },
    ],
  }
}
```

> Note: Nếu Task 5 xóa `getMockCategoryStats`, thì chỉ cần fix `getMockReport`.

**Step 2: Build verify**

```bash
npm run build
```

**Step 3: Commit**

```bash
git add src/hooks/useReports.ts
git commit -m "i18n: fix hardcoded English mock data to Vietnamese"
```

---

## Tasks NOT requiring fixes (audit passed)

| Domain | Check | Status |
|--------|-------|--------|
| **Security** | Mock auth bypass in production | ✅ `isSupabaseConfigured()` returns `true` in PROD |
| **Security** | Missing `user_id` on mutations | ✅ All `.update()`/`.delete()` have `.eq('user_id', user.id)` |
| **Security** | `setTimeout` fake API calls | ✅ None found |
| **Security** | Auth redirect ignoring confirmation | ✅ MainLayout checks `user.confirmed` |
| **Security** | `select('*')` | ✅ All hooks use explicit columns |
| **Security** | `console.log` leaking data | ✅ None in production code |
| **Security** | Auth state listener | ✅ `useAuthListener` handles SIGNED_OUT with `queryClient.clear()` |
| **Security** | SECURITY DEFINER ownership checks | ✅ All RPCs verified (migration 20260706000000) |
| **Security** | RLS enabled on all tables | ✅ All tables have `ENABLE ROW LEVEL SECURITY` |
| **React** | Hooks after early return | ✅ MainLayout returns early for loading/auth, but hooks are above |
| **React** | Context value memoization | ✅ Both I18nProvider and ThemeProvider use `useMemo` |
| **React** | `arguments` in arrow function | ✅ None found |
| **React** | `any` types | ✅ None in app code |
| **Zustand** | Whole-store subscription | ✅ All stores use selectors |
| **Zustand** | QueryClient defaultOptions | ✅ Has staleTime, retry, refetchOnWindowFocus |
| **Outbox** | Sync engine race conditions | ✅ Fixed with `pendingCount` + `needsResyncRef` + `isOnlineRef` |
| **Outbox** | 'syncing' state orphaned | ✅ `onRehydrateStorage` resets to 'pending' |
| **Outbox** | Max attempts guard | ✅ `MAX_ATTEMPTS = 5`, exhausted entries skipped |
| **i18n** | Provider value memoized | ✅ `useMemo` |
| **Mobile** | Font sizes < 12px | ✅ No `text-[9px]` / `text-[10px]` / `text-[11px]` |
| **Mobile** | 4-col grid on mobile | ✅ Only `grid-cols-3` in wallet modal (acceptable) |
| **Build** | Chunk size warning | ⚠️ `heic2any` 1.35MB — dynamic import already used, acceptable tradeoff for HEIC support |

---

## Recommended execution order

1. **Task 1** (security) — independent, highest priority
2. **Task 3** (OfflineBanner selector) — quick, independent
3. **Task 4** (React.memo) — independent
4. **Task 5** (dead code removal) — do before Task 2 (reduces scope)
5. **Task 2** (type fix) — after Task 5
6. **Task 7** (locale map) — quick, independent
7. **Task 8** (balance extraction) — larger refactor
8. **Task 9** (mock data i18n) — after Task 5

## Verification (after all tasks)

```bash
cd /home/vmo/vibe-coding/vibe-tube-atlas
npm run build          # Must pass with 0 errors
npx eslint .           # Must stay 0 errors
npm run test           # All tests pass
```
