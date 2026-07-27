# Vibe Tube Atlas — Code Review & Fix Plan (2026-07-23)

> **For Hermes:** Use subagent-driven-development skill to implement this plan task-by-task.

**Goal:** Khắc phục tất cả bugs phát hiện qua review toàn diện: data loss, memory leaks, timezone bugs, error handling gaps, broken UI interactions, dead code.

**Architecture:** React 19 + Vite 8 + TypeScript 6 + TailwindCSS v4 + Supabase. Zustand stores cho UI state, TanStack Query v5 cho server data. Offline-first outbox pattern. PWA với service worker.

**Tech Stack:** React 19, Vite 8, TS 6, TailwindCSS v4, Supabase (PostgreSQL + RLS + Edge Functions), Zustand v5, TanStack Query v5, Framer Motion, shadcn/ui.

---

## Tóm tắt phát hiện (Audit Summary)

### Build Status
- ✅ `npm run build` — PASS (0 errors)
- ✅ ESLint — 0 errors, 18 warnings (all `security/detect-object-injection` false positives)
- ✅ `npx vitest run` — 14 tests, all passing
- ✅ Không có `console.log` trong production code
- ✅ Không có `TODO/FIXME/HACK`
- ✅ TypeScript strict mode — 0 errors, không có `as any`
- ✅ TransactionRow đã có `React.memo` (fix từ lần trước)
- ✅ `walletBalance.ts` đã extract shared (fix từ lần trước)

### Vấn đề phát hiện (theo severity)

| # | Severity | Domain | Issue | File(s) |
|---|----------|--------|-------|---------|
| 1 | 🔴 CRITICAL | Data Loss | `EditTransaction` — `useEffect` re-fires `loadTransaction` khi query refetch, overwrite edits | `EditTransaction.tsx:23-38` |
| 2 | 🔴 HIGH | Memory Leak | `URL.createObjectURL` 3 chỗ không revoke — leak mỗi avatar upload | `useAvatar.ts:15,62,69` |
| 3 | 🔴 HIGH | Data Loss | Savings form: `currentAmount` field bị bỏ — không gửi tới API | `Savings.tsx:44-48` |
| 4 | 🔴 HIGH | Bug | `PasswordSettings`: `currentPassword` không verify trước khi đổi pass | `PasswordSettings.tsx:41` |
| 5 | 🔴 HIGH | Bug | Password validation mismatch: Login = 6, Register = 8 chars | `Login.tsx:26` |
| 6 | 🔴 HIGH | Bug | `computeWalletBalances`: 2 Supabase queries không check error → silent wrong balance | `walletBalance.ts:33,52` |
| 7 | 🟡 MEDIUM | UI Bug | `AnimatePresence mode="wait"` wrap `<Outlet/>` không có key → exit animations broken | `MainLayout.tsx:53-55` |
| 8 | 🟡 MEDIUM | UI Bug | Categories chevron toggle fires twice (bubbling) → expand no-op | `Categories.tsx:411,446` |
| 9 | 🟡 MEDIUM | UI Bug | `ExpenseAnalysis` activeIndex stale khi items thay đổi (month switch) | `ExpenseAnalysis.tsx:104` |
| 10 | 🟡 MEDIUM | Timezone | `computeMonthlyData` + `groupByMonth` dùng `toISOString()` → sai month cho UTC+7 | `computeMonthlyData.ts:26`, `financialHealth.ts:30` |
| 11 | 🟡 MEDIUM | Bug | `useFinancialReports` dùng `.lte(end)` → miss transactions cuối ngày | `useFinancialReports.ts:145` |
| 12 | 🟡 MEDIUM | Bug | Register thành công → navigate `/login` thay vì `/verify-email` | `Register.tsx:39` |
| 13 | 🟡 MEDIUM | Code Quality | `localeMap` duplication — 6+ files define cùng `{ vi: 'vi-VN', en: 'en-US' }` | 6 files |
| 14 | 🟡 MEDIUM | Fragile Code | `useWallets.ts:103`: check `wallet.name === 'Cash'` — fragile nếu user rename | `useWallets.ts:103`, `Wallets.tsx:66` |
| 15 | 🟡 MEDIUM | Code Quality | Login/Register: local `isLoading` duplicate của mutation `isPending` | `Login.tsx:13`, `Register.tsx:14` |
| 16 | 🟡 MEDIUM | Code Quality | `Profile.tsx:170`: `key={index}` thay vì stable key | `Profile.tsx:170` |
| 17 | 🟡 MEDIUM | Code Quality | `i18n/index.tsx`: `setLanguage` không wrap `useCallback`, thiếu trong `useMemo` deps | `i18n/index.tsx:42-51` |
| 18 | 🟡 MEDIUM | UX Bug | Savings form cancel không clear fields | `Savings.tsx:160` |
| 19 | 🟡 MEDIUM | Security | `useReports.ts`: thiếu `requireAuth()` trước RPC call | `useReports.ts:37` |
| 20 | 🟢 LOW | Code Quality | Dead code: `src/types/auth.ts` — toàn bộ file unused | `src/types/auth.ts` |
| 21 | 🟢 LOW | Code Quality | `EditTransaction.tsx:33`: unsafe double cast cho `contact_person` | `EditTransaction.tsx:33` |
| 22 | 🟢 LOW | Code Quality | Dashboard `displayName` fallback dùng `greeting.replace('!','')` | `Dashboard.tsx:80` |
| 23 | 🟢 LOW | Code Quality | Register placeholder text "6 chars" nhưng validate 8 | `Register.tsx:92` |
| 24 | 🟢 LOW | Dark Mode | `ForgotPassword` / `ResetPassword`: thiếu `dark:` classes | 2 files |

---

## Task 1: Fix EditTransaction effect clobbering user edits (CRITICAL)

**Objective:** `useEffect` re-fires `loadTransaction` khi TanStack Query refetch (window focus, mutation invalidate) → overwrite edits user đang gõ.

**Files:**
- Modify: `src/pages/EditTransaction.tsx:23-38`

**Context:**
- Dependency array `[transaction, loadTransaction, reset]` — `transaction` là object ref mới mỗi lần query refetch
- Khi refetch thành công, `loadTransaction` re-fire → form state bị reset → user mất edits
- Fix: chỉ load khi transaction ID thay đổi, không phải khi object ref thay đổi

**Step 1: Add ref guard**

```tsx
// src/pages/EditTransaction.tsx — add import
import { useEffect, useRef } from 'react'

// Inside EditTransaction component, add:
const loadedIdRef = useRef<string | null>(null)

useEffect(() => {
  if (transaction && loadedIdRef.current !== transaction.id) {
    loadedIdRef.current = transaction.id
    loadTransaction({
      id: transaction.id,
      type: transaction.type,
      amount: transaction.amount,
      categoryId: transaction.category_id || undefined,
      walletId: transaction.wallet_id || undefined,
      toWalletId: transaction.to_wallet_id || undefined,
      description: transaction.description || undefined,
      contactPerson: transaction.contact_person || undefined,
      date: transaction.transaction_date,
    })
  }
  return () => {
    loadedIdRef.current = null
    reset()
  }
}, [transaction?.id, loadTransaction, reset])
```

**Key change:** dep array dùng `transaction?.id` (string, stable) thay vì `transaction` (object ref, unstable).

**Step 2: Build verify**

```bash
cd /home/vmo/vibe-coding/vibe-tube-atlas && npm run build
```

**Step 3: Commit**

```bash
git add src/pages/EditTransaction.tsx
git commit -m "fix: EditTransaction no longer clobbers user edits on background refetch"
```

---

## Task 2: Fix URL.createObjectURL memory leak in useAvatar (HIGH)

**Objective:** 3 `URL.createObjectURL()` calls không revoke → leak blob URLs mỗi avatar upload.

**Files:**
- Modify: `src/hooks/useAvatar.ts:15,62,69`

**Step 1: Add cleanup in resizeImage function**

```typescript
// src/hooks/useAvatar.ts — processImage function
// For the non-HEIC path (line ~68-70):
const img = new Image()
const url = URL.createObjectURL(file)
img.src = url
img.onload = () => {
  URL.revokeObjectURL(url) // cleanup
  // ... existing onload logic
}
img.onerror = () => {
  URL.revokeObjectURL(url) // cleanup
  reject(new Error('Failed to load image'))
}
```

Do the same for the HEIC conversion path (line ~61-63):
```typescript
const blob = Array.isArray(converted) ? converted[0] : converted
if (!blob) {
  reject(new Error('HEIC conversion returned empty'))
  return
}
const img = new Image()
const url = URL.createObjectURL(blob)
img.src = url
img.onload = () => {
  URL.revokeObjectURL(url)
  // ... existing onload logic
}
img.onerror = () => {
  URL.revokeObjectURL(url)
  reject(new Error('Failed to load image'))
}
```

Also fix the inner IIFE in `processImage` (line ~13-17):
```typescript
const img = imgOrBlob instanceof HTMLImageElement
  ? imgOrBlob
  : (() => {
      const i = new Image()
      const innerUrl = URL.createObjectURL(imgOrBlob)
      i.src = innerUrl
      i.onload = () => URL.revokeObjectURL(innerUrl)
      i.onerror = () => URL.revokeObjectURL(innerUrl)
      return i
    })()
```

**Step 2: Build verify + Commit**

```bash
npm run build && git add src/hooks/useAvatar.ts && git commit -m "fix: revoke all URL.createObjectURL calls in useAvatar to prevent memory leak"
```

---

## Task 3: Fix Savings form — currentAmount not sent to API (HIGH)

**Objective:** Form có "Current Amount" field nhưng value không gửi tới API → user nhập bị mất.

**Files:**
- Modify: `src/types/index.ts` — add `current_amount` to `CreateSavingsGoalInput`
- Modify: `src/pages/Savings.tsx:44-48`

**Step 1: Update type**

```typescript
// src/types/index.ts — CreateSavingsGoalInput
export interface CreateSavingsGoalInput {
  name: string
  target_amount: number
  current_amount?: number  // NEW
  deadline?: DateString
  icon?: string
  color?: string
}
```

**Step 2: Update Savings page**

```tsx
// src/pages/Savings.tsx — handleAddGoal
const current = parseFloat(currentAmount) || 0
createGoal.mutate(
  { name: goalName.trim(), target_amount: target, current_amount: current },
  { ... }
)
```

**Step 3: Build verify + Commit**

```bash
npm run build && git add src/types/index.ts src/pages/Savings.tsx && git commit -m "fix: send currentAmount from Savings form to API (was silently dropped)"
```

---

## Task 4: Fix PasswordSettings — verify current password (HIGH)

**Objective:** Form có "Current Password" input nhưng không bao giờ dùng. `reauthenticate()` chỉ check session token.

**Files:**
- Modify: `src/pages/PasswordSettings.tsx:39-46`

**Step 1: Replace reauthenticate with actual password verification**

```tsx
// src/pages/PasswordSettings.tsx — handleSubmit, replace the Supabase block:

if (isSupabaseConfigured()) {
  // Get current user email
  const { data: { user } } = await supabase.auth.getUser()
  if (!user?.email) throw new Error('No authenticated user')

  // Verify current password
  const { error: verifyError } = await supabase.auth.signInWithPassword({
    email: user.email,
    password: currentPassword,
  })
  if (verifyError) {
    setMessage(t.settings.currentPasswordIncorrect || 'Current password is incorrect')
    setIsSuccess(false)
    setIsLoading(false)
    return
  }

  // Update password
  const { error } = await supabase.auth.updateUser({ password: newPassword })
  if (error) throw error
}
```

**Note:** Add `currentPasswordIncorrect` to translations if not exists.

**Step 2: Build verify + Commit**

```bash
npm run build && git add src/pages/PasswordSettings.tsx && git commit -m "fix: verify current password before allowing password change"
```

---

## Task 5: Fix password validation mismatch (HIGH)

**Objective:** Login validate 6 chars, Register validate 8 chars — không nhất quán.

**Files:**
- Modify: `src/pages/Login.tsx:26`

**Step 1: Fix**

```tsx
// src/pages/Login.tsx line 26
// BEFORE: if (password.length < 6)
// AFTER:  if (password.length < 8)
```

**Step 2: Build verify + Commit**

```bash
npm run build && git add src/pages/Login.tsx && git commit -m "fix: align password validation — 8 chars minimum for login and register"
```

---

## Task 6: Fix computeWalletBalances — missing error handling (HIGH)

**Objective:** Hai Supabase queries không check error → balances silently wrong.

**Files:**
- Modify: `src/lib/walletBalance.ts:33,52`

**Step 1: Add error checking to both queries**

```typescript
// Line 33-34 — add error destructure + throw:
const { data: txData, error: txError } = await supabase
  .from('transactions')
  .select('wallet_id, to_wallet_id, type, amount')
  .in('wallet_id', walletIds)
  .eq('user_id', userId)

if (txError) throw txError

// Line 52-53 — same:
const { data: transferData, error: transferError } = await supabase
  .from('transactions')
  .select('to_wallet_id, amount')
  .in('to_wallet_id', walletIds)
  .eq('user_id', userId)
  .eq('type', 'transfer')

if (transferError) throw transferError
```

**Step 2: Build verify + Commit**

```bash
npm run build && git add src/lib/walletBalance.ts && git commit -m "fix: throw on Supabase query errors in computeWalletBalances (was silently swallowed)"
```

---

## Task 7: Fix AnimatePresence without keys (MEDIUM)

**Objective:** `<AnimatePresence mode="wait"><Outlet/></AnimatePresence>` — Outlet không có key → exit animations không hoạt động.

**Files:**
- Modify: `src/layouts/MainLayout.tsx:53-55`

**Step 1: Wrap Outlet with keyed element**

```tsx
// src/layouts/MainLayout.tsx — line 53-55
// BEFORE:
<AnimatePresence mode="wait">
  <Outlet />
</AnimatePresence>

// AFTER:
<AnimatePresence mode="wait">
  <div key={location.pathname}>
    <Outlet />
  </div>
</AnimatePresence>
```

**Step 2: Build verify + Commit**

```bash
npm run build && git add src/layouts/MainLayout.tsx && git commit -m "fix: add route key to AnimatePresence for correct page exit animations"
```

---

## Task 8: Fix Categories chevron toggle double-fire (MEDIUM)

**Objective:** Parent div `onClick` + chevron button `onClick` cùng toggle → fire 2 lần → no-op.

**Files:**
- Modify: `src/pages/Categories.tsx:446`

**Step 1: Add stopPropagation to chevron button**

```tsx
// src/pages/Categories.tsx line ~446
// BEFORE:
<button onClick={() => setExpanded(!expanded)} ...>

// AFTER:
<button onClick={(e) => { e.stopPropagation(); setExpanded(!expanded) }} ...>
```

**Step 2: Build verify + Commit**

```bash
npm run build && git add src/pages/Categories.tsx && git commit -m "fix: Categories chevron toggle double-fire (was no-op due to event bubbling)"
```

---

## Task 9: Fix ExpenseAnalysis stale activeIndex (MEDIUM)

**Objective:** `activeIndex` không reset khi `items` thay đổi (tháng) → highlight chỉ vào index cũ/không tồn tại.

**Files:**
- Modify: `src/components/dashboard/ExpenseAnalysis.tsx:104`

**Step 1: Add useEffect to reset index**

```tsx
// src/components/dashboard/ExpenseAnalysis.tsx
// Add import: import { useState, useEffect } from 'react'
// After line 104:
useEffect(() => {
  setActiveIndex(0)
}, [items])
```

**Step 2: Build verify + Commit**

```bash
npm run build && git add src/components/dashboard/ExpenseAnalysis.tsx && git commit -m "fix: reset ExpenseAnalysis activeIndex when items change (month switch)"
```

---

## Task 10: Fix timezone bug in date formatting (MEDIUM)

**Objective:** `toISOString().slice(0,7)` shifts months cho UTC+7 users — transaction cuối tháng có thể bị sang tháng sau.

**Files:**
- Modify: `src/lib/computeMonthlyData.ts:26`
- Modify: `src/lib/financialHealth.ts:30`

**Context:** Vietnam = UTC+7. Transaction ngày 31 lúc 20:00 → `toISOString()` thành ngày 1 tháng sau.

**Step 1: Fix computeMonthlyData**

```typescript
// src/lib/computeMonthlyData.ts line 26
// BEFORE:
const monthKey = d.toISOString().slice(0, 7)

// AFTER:
const monthKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
```

**Step 2: Fix groupByMonth in financialHealth.ts**

```typescript
// src/lib/financialHealth.ts line 30
// BEFORE:
const month = t.transaction_date.slice(0, 7) // YYYY-MM

// This one is OK if transaction_date is stored as 'YYYY-MM-DD' (date only, no timezone).
// If it's a timestamp string, use:
const month = t.transaction_date.slice(0, 10) // get date part first
  ? new Date(t.transaction_date.slice(0, 10)).toLocaleDateString('en-CA') // YYYY-MM-DD local
  : t.transaction_date.slice(0, 7)
```

Actually the simplest fix: since `transaction_date` is a DATE column (not timestamp), `slice(0, 7)` is correct. The bug is only in `computeMonthlyData.ts` where `new Date()` + `toISOString()` is used to generate current month keys. Fix that file only.

**Step 3: Build verify + Commit**

```bash
npm run build && git add src/lib/computeMonthlyData.ts && git commit -m "fix: use local date methods instead of toISOString for month bucketing (UTC+7 fix)"
```

---

## Task 11: Fix useFinancialReports date filter (MEDIUM)

**Objective:** `.lte('transaction_date', end)` miss transactions cuối ngày nếu stored as timestamp.

**Files:**
- Modify: `src/hooks/useFinancialReports.ts:145`

**Step 1: Change lte to lt with next day**

```typescript
// src/hooks/useFinancialReports.ts line 145
// BEFORE:
.lte('transaction_date', end)

// AFTER — append T23:59:59 to include full day:
.lte('transaction_date', end + 'T23:59:59')
```

**Step 2: Build verify + Commit**

```bash
npm run build && git add src/hooks/useFinancialReports.ts && git commit -m "fix: include full end-date in financial report period filter"
```

---

## Task 12: Fix Register redirect + password placeholder (MEDIUM)

**Objective:** Sau register → navigate `/login` (nên `/verify-email`). Placeholder nói "6 chars" nhưng validate 8.

**Files:**
- Modify: `src/pages/Register.tsx:39`
- Modify: `src/lib/i18n/translations.ts` — fix placeholder text

**Step 1: Change redirect**

```tsx
// src/pages/Register.tsx line 39
navigate("/verify-email")  // was "/login"
```

**Step 2: Fix placeholder text in translations**

```bash
# Find the key and update from "6" to "8" chars
grep -n "atLeast6Chars\|atLeast8Chars\|atLeast.*chars\|At least" src/lib/i18n/translations.ts
```

Update both `vi` and `en` sections to say 8 characters.

**Step 3: Build verify + Commit**

```bash
npm run build && git add src/pages/Register.tsx src/lib/i18n/translations.ts && git commit -m "fix: redirect to verify-email after registration; fix placeholder to say 8 chars"
```

---

## Task 13: Extract shared localeMap constant (MEDIUM)

**Objective:** `{ vi: 'vi-VN', en: 'en-US' }` lặp lại 6+ lần.

**Files:**
- Create: `src/lib/locale.ts`
- Modify: `src/pages/Dashboard.tsx`, `src/pages/Transactions.tsx`, `src/components/shared/TransactionRow.tsx`, `src/components/notifications/NotificationBell.tsx`, `src/components/reports/ReportComponents.tsx`, `src/pages/Savings.tsx`

**Step 1: Create shared constant**

```typescript
// src/lib/locale.ts
import type { Language } from '@/lib/i18n/translations'

export const LOCALE_MAP: Record<Language, string> = {
  vi: 'vi-VN',
  en: 'en-US',
}

export function getLocale(lang: string): string {
  return LOCALE_MAP[lang as Language] || 'vi-VN'
}
```

**Step 2: Replace in all 6 files**

Each file: import `getLocale`, remove local `localeMap`/`LOCALE_MAP` definition, replace usages.

**Step 3: Build verify + Commit**

```bash
npm run build && git add src/lib/locale.ts src/pages/Dashboard.tsx src/pages/Transactions.tsx src/components/shared/TransactionRow.tsx src/components/notifications/NotificationBell.tsx src/components/reports/ReportComponents.tsx src/pages/Savings.tsx && git commit -m "refactor: extract shared localeMap to src/lib/locale.ts (DRY)"
```

---

## Task 14: Fix i18nProvider setLanguage useCallback + Profile key (MEDIUM)

**Objective:** `setLanguage` không stable ref. Profile dùng `key={index}`.

**Files:**
- Modify: `src/lib/i18n/index.tsx:42-51`
- Modify: `src/pages/Profile.tsx:170`

**Step 1: Wrap setLanguage in useCallback**

```tsx
// src/lib/i18n/index.tsx
import { useCallback } from 'react'

const setLanguage = useCallback((lang: Language) => setLanguageState(lang), [])

const value = useMemo(() => ({
  language,
  setLanguage,
  t: translations[language] as TranslationKey,
}), [language, setLanguage])
```

**Step 2: Fix Profile key**

```tsx
// src/pages/Profile.tsx line 170
// BEFORE: key={index}
// AFTER:  key={feature.href}
```

**Step 3: Build verify + Commit**

```bash
npm run build && git add src/lib/i18n/index.tsx src/pages/Profile.tsx && git commit -m "fix: stabilize setLanguage with useCallback; use stable keys in Profile"
```

---

## Task 15: Fix useReports missing requireAuth + remove dead code (MEDIUM)

**Objective:** `useMonthlyReport` gọi RPC không check auth. `src/types/auth.ts` toàn bộ dead code.

**Files:**
- Modify: `src/hooks/useReports.ts:37`
- Delete: `src/types/auth.ts`

**Step 1: Add requireAuth to useMonthlyReport**

```typescript
// src/hooks/useReports.ts — add requireAuth to imports
import { supabase, isSupabaseConfigured, requireAuth } from '@/lib/supabase'

// In useMonthlyReport queryFn, after mock check:
const user = await requireAuth()
// ... existing RPC call
```

**Step 2: Delete dead types file**

```bash
# Verify nothing imports from it
grep -rn "types/auth" src/ --include="*.ts" --include="*.tsx"
# Should return nothing

rm src/types/auth.ts
```

**Step 3: Build verify + Commit**

```bash
npm run build && git add src/hooks/useReports.ts src/types/auth.ts && git commit -m "fix: add requireAuth to useMonthlyReport; remove dead types/auth.ts"
```

---

## Task 16: Fix Savings cancel + EditTransaction cast + Dashboard fallback (LOW)

**Objective:** Misc low-severity fixes batched together.

**Files:**
- Modify: `src/pages/Savings.tsx:160` — clear form on cancel
- Modify: `src/pages/EditTransaction.tsx:33` — remove double cast
- Modify: `src/pages/Dashboard.tsx:80` — fix fallback name

**Step 1: Savings cancel clears fields**

```tsx
// src/pages/Savings.tsx line 160
// BEFORE:
<Button variant="outline" onClick={() => setShowForm(false)}>

// AFTER:
<Button variant="outline" onClick={() => {
  setShowForm(false)
  setGoalName('')
  setTargetAmount('')
  setCurrentAmount('')
}}>
```

**Step 2: Remove EditTransaction double cast**

```tsx
// src/pages/EditTransaction.tsx line 33 (if not already fixed in Task 1)
// BEFORE: contactPerson: (transaction as unknown as Record<string, unknown>).contact_person as string || undefined,
// AFTER:  contactPerson: transaction.contact_person || undefined,
```

**Step 3: Fix Dashboard displayName**

```tsx
// src/pages/Dashboard.tsx line 80
const displayName = user?.full_name || user?.email?.split('@')[0] || ''

// Line 97:
{displayName ? `${t.dashboard.greeting} ${displayName}` : t.dashboard.greeting} 👋
```

**Step 4: Build verify + Commit**

```bash
npm run build && git add src/pages/Savings.tsx src/pages/EditTransaction.tsx src/pages/Dashboard.tsx && git commit -m "fix: clear savings form on cancel, remove double cast, fix displayName fallback"
```

---

## Task 17: Remove duplicate isLoading + fix dark mode gaps (LOW)

**Objective:** Login/Register local `isLoading` redundant. Auth pages thiếu dark mode classes.

**Files:**
- Modify: `src/pages/Login.tsx` — use `login.isPending`
- Modify: `src/pages/Register.tsx` — use `register.isPending`
- Modify: `src/pages/ForgotPassword.tsx` — add `dark:` classes
- Modify: `src/pages/ResetPassword.tsx` — add `dark:` classes

**Step 1: Login.tsx — remove local isLoading**

```tsx
// Remove: const [isLoading, setIsLoading] = useState(false)
// Replace all `isLoading` with `login.isPending`
// Remove `setIsLoading(true/false)` from handleSubmit
```

**Step 2: Register.tsx — same pattern**

```tsx
// Remove: const [isLoading, setIsLoading] = useState(false)
// Replace all `isLoading` with `register.isPending`
```

**Step 3: Add dark mode classes to ForgotPassword**

```tsx
// src/pages/ForgotPassword.tsx
// text-gray-900 → text-gray-900 dark:text-gray-100
// text-gray-500 → text-gray-500 dark:text-gray-400
```

**Step 4: Add dark mode classes to ResetPassword**

Same pattern — add `dark:` variants for all text colors.

**Step 5: Build verify + Commit**

```bash
npm run build && git add src/pages/Login.tsx src/pages/Register.tsx src/pages/ForgotPassword.tsx src/pages/ResetPassword.tsx && git commit -m "refactor: remove duplicate isLoading state; add dark mode classes to auth pages"
```

---

## Execution Notes

### Priority Order:
1. **Task 1** (CRITICAL — data loss) → fix first
2. **Tasks 2-6** (HIGH — bugs) → fix next
3. **Tasks 7-15** (MEDIUM — UI/UX/code quality)
4. **Tasks 16-17** (LOW — cleanup)

### Verification:
- Chạy `npm run build` sau mỗi task
- Chạy `npx vitest run` sau tasks 1-6 (đảm bảo không break tests)
- Mỗi task commit riêng để dễ rollback

### Out of Scope (noted but not fixing):
- Accessibility: `<label>` thiếu `htmlFor` — pervasive (30+ fields), cần task riêng lớn
- Export XLSX fake HTML — works, low priority
- `useWallets` hardcoded "Cash" check — cần DB schema change (`is_system` flag)
