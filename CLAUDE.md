# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Vibe Tube Atlas is a personal finance management app (Money Keeper clone) targeting Vietnamese users. Mobile-first SPA with desktop sidebar support. Default language is Vietnamese (`vi`).

**Stack**: React 19 + Vite 8 + TypeScript 6 + TailwindCSS v4 + Supabase (PostgreSQL + Auth + Edge Functions)

## Commands

```bash
npm run dev              # Start dev server (Vite, port 5173)
npm run build            # TypeScript check + production build
npm run lint             # ESLint with --fix (includes security plugin)
npm run preview          # Preview production build
npm run test             # Run tests (Vitest, jsdom environment)
npm run test:ui          # Vitest UI
npm run test:coverage    # Coverage report (80% threshold enforced)
npm run doctor           # React Doctor diagnostics
```

Run a single test: `npx vitest run src/path/to/file.test.ts`

## Architecture

### Provider Hierarchy (main.tsx)
`StrictMode > QueryClientProvider > ThemeProvider > I18nProvider > ErrorBoundary > Router > App`

### Routing (react-router-dom v7)
- **Auth routes** (`/login`, `/register`, `/forgot-password`, `/reset-password`) → `AuthLayout`
- **Standalone**: `/verify-email` (no layout wrapper)
- **App routes** (`/dashboard`, `/wallets`, `/transactions`, `/add-transaction`, `/edit-transaction/:id`, `/reports/*`, `/categories`, `/savings`, `/financial-health`, `/notifications`, `/settings/*`, `/profile`) → `MainLayout` (auth guard + email confirmation guard, bottom nav on mobile, `DesktopSidebar` on `lg:` breakpoint)
- All pages are lazy-loaded via `React.lazy()`
- SPA routing handled by `vercel.json` rewrite to `index.html`

### State Management Split
- **Zustand** (`src/stores/`) — client-only UI state only. Three stores:
  - `uiStore` — balance visibility toggle, current month, currency selection, `formatCurrency()` and `displayAmount()` helpers (currency persisted to localStorage)
  - `transactionFormStore` — transaction form draft state (add/edit mode, all fields, `reset()` on unmount)
  - `walletsStore` — wallet form visibility toggle
- **TanStack Query v5** (`src/hooks/`) — all server data. Every hook follows the pattern: `isSupabaseConfigured()` → mock fallback | `requireAuth()` → Supabase query. Invalidates related query keys on mutation success.

### Data Flow Pattern
Each data domain (transactions, wallets, categories, notifications, savings) follows:
1. Types in `src/types/index.ts`
2. Mock data in `src/mocks/` (one file per domain: `mockTransactions`, `mockWallets`, `mockCategories`, `mockSavings`, `mockAuth`)
3. TanStack Query hooks in `src/hooks/use*.ts` (queries + mutations)
4. Zustand store only if UI state is needed (form drafts, visibility toggles)
5. Components in `src/components/<feature>/` — each folder has an `index.ts` barrel export
6. Page in `src/pages/<Feature>.tsx` — thin composition, no business logic

### Mock Data Fallback
When `VITE_SUPABASE_URL` is missing or contains "placeholder" (dev only), the app uses mock data from `src/mocks/`. Gated by `isSupabaseConfigured()` and `isMockAuthAllowed()` in `src/lib/supabase.ts`. **Production always uses real Supabase** — `isSupabaseConfigured()` returns `true` when `import.meta.env.PROD`.

### Path Aliases
`@/` maps to `src/` (configured in `vite.config.ts` and `tsconfig.app.json`).

### Component Library
shadcn/ui (new-york style, Radix primitives) in `src/components/ui/`. Custom shared components in `src/components/shared/` (AnimatedFAB, Avatar, EmptyState, PageTransition, PullToRefreshWrapper, SkeletonLoader, TransactionRow). Icons: Lucide React. Animations: Framer Motion.

### Internationalization
Custom i18n in `src/lib/i18n/` — React context provider with `useI18n()` hook returning `{ language, setLanguage, t }`. Translations in `src/lib/i18n/translations.ts`. Default language: Vietnamese (`vi`). Categories in `src/constants/categories.ts` use i18n keys (`nameKey`, `subcategoryKeys`) resolved at render time.

### Build Chunking (vite.config.ts)
Manual chunks split vendor code: `vendor` (react/react-dom/react-router-dom), `charts` (recharts), `supabase`, `ui` (radix), `motion` (framer-motion), `heic2any`.

## Backend (Supabase)

### Database
- Migrations in `supabase/migrations/` — auto-deployed via GitHub Actions on push to `main` when `supabase/**` changes
- RLS (Row Level Security) on all tables — `auth.uid() = user_id` policies
- Monetary values: `DECIMAL(15,2)`
- DB triggers handle: profile creation on signup, default wallet creation

### Edge Function
`supabase/functions/analyze-financial-health/` — Deno function that takes `FinancialHealthMetrics`, calls Gemini 3.5 Flash API (fallback: Gemini 2.5 Flash) for AI financial analysis. Returns `AIAnalysis` JSON. All text in Vietnamese.

### Local Scoring Fallback
`src/lib/financialHealth.ts` — pure functions (no side effects, no API calls) that compute health metrics and generate analysis locally when the AI edge function is unavailable.

**Financial Health Metrics include:**
- `totalIncome`, `totalExpense`, `totalDebt`, `totalLent` — transaction sums
- `totalAssets` — sum of all active wallet balances
- `netWorth` — totalAssets minus totalDebt
- `assetToDebtRatio` — totalAssets / totalDebt * 100 (0 if no debt)
- `savingsRate` — (income - expense) / income * 100
- `expenseToIncomeRatio`, `debtToIncomeRatio` — percentage ratios
- `spendingTrend` — increasing/decreasing/stable/insufficient_data (last 3 months)

**Local scoring (computeLocalScore)** — base 50, max 100:
- Savings rate: ±25 (≥30% → +25, negative → -15)
- Debt ratio: ±15 (0 debt → +10, >30% → -15)
- Expense/income: ±10 (≤50% → +10, >90% → -10)
- Spending trend: ±5 (decreasing → +5, increasing → -5)
- Asset strength: ±10 (no debt + positive assets → +10, negative net worth → -10)

## Key Types (src/types/index.ts)
- `TransactionType`: `'income' | 'expense' | 'lend' | 'borrow' | 'transfer'`
- `WalletType`: `'cash' | 'bank' | 'e_wallet'`
- `BudgetPeriod`: `'monthly' | 'weekly'`
- `NotificationType`: `'info' | 'warning' | 'success' | 'budget_alert' | 'debt_reminder' | 'inactivity_reminder' | 'financial_health'`
- Transaction relations: `wallet`, `to_wallet` (for transfers), `category` — fetched via Supabase joins using foreign key aliases in select string (see `TRANSACTION_SELECT` in hooks)

## Wallet Balance Computation
Balances are computed **client-side** in `useWallets` hook — batches all transactions for user's wallets in two queries (source wallets + transfer destinations), applies type-based +/- logic (`income`/`borrow` → +, `expense`/`lend`/`transfer` → -), adds `initial_balance`. Not stored in DB.

## Hook Query Key Conventions
- `['auth']` — current user session
- `['transactions', month?, walletId?]` or `['transactions', 'year', year, type?]` — transaction lists
- `['transaction', id]` — single transaction
- `['wallets', includeInactive?]` — wallet list
- `['appNotifications']` — notification list
- `['dashboard']` — dashboard aggregated data
Mutations invalidate all related keys on success (e.g., transaction mutations invalidate `['transactions']`, `['wallets']`, `['dashboard']`).

## Security
- ESLint security plugin enabled (`eslint-plugin-security`)
- CSP headers in `vercel.json` (strict: self-only scripts, specific `connect-src` for Supabase + GitHub API)
- Security headers: X-Frame-Options DENY, HSTS, nosniff, Referrer-Policy, Permissions-Policy
- Supabase anon key is public by design; all protection via RLS
- `requireAuth()` used in every hook before data access
- Auth state changes (`SIGNED_OUT`) clear the entire TanStack Query cache via `queryClient.clear()`

## Deployment
- **Frontend**: Vercel (SPA rewrite in vercel.json)
- **Database/Edge Functions**: Supabase CLI via GitHub Actions (`.github/workflows/deploy-supabase.yml`)
- CI chỉ trigger khi `supabase/**` thay đổi trên branch `main`
- Required GitHub secrets: `SUPABASE_ACCESS_TOKEN`, `POSTGRES_PASSWORD`, `PROJECT_REF`
- Edge function secrets (Supabase dashboard): `GEMINI_API_KEY`

### Supabase Migration Rules (READ BEFORE WRITING MIGRATIONS)

⚠️ Mỗi lần migration lỗi = phải push thêm migration fix = mất thời gian. Phải tuân thủ các quy tắc sau:

#### 1. CHECK Constraint — Luôn cập nhật khi thêm enum value
Các bảng dùng CHECK constraint thay vì ENUM. Khi thêm giá trị mới vào `type`, **phải DROP và recreate constraint**:

```sql
-- ✅ ĐÚNG: Drop + recreate
ALTER TABLE public.app_notifications
  DROP CONSTRAINT IF EXISTS app_notifications_type_check;
ALTER TABLE public.app_notifications
  ADD CONSTRAINT app_notifications_type_check
  CHECK (type IN ('info', 'warning', 'success', 'budget_alert', 'debt_reminder', 'inactivity_reminder', 'financial_health'));
```

**Danh sách CHECK constraints hiện tại:**
- `transactions.type` → `'income' | 'expense' | 'lend' | 'borrow' | 'transfer'`
- `categories.type` → `'income' | 'expense'`
- `wallets.type` → `'cash' | 'bank' | 'e_wallet'`
- `budgets.period` → `'monthly' | 'weekly'`
- `financial_reports.period_type` → `'weekly' | 'monthly'`
- `app_notifications.type` → `'info' | 'warning' | 'success' | 'budget_alert' | 'debt_reminder' | 'inactivity_reminder' | 'financial_health'`

#### 2. Không select cột không tồn tại
- `wallets` bảng **KHÔNG CÓ cột `balance`** — chỉ có `initial_balance`
- Balance được tính **client-side** trong `useWallets` hook (xem section Wallet Balance Computation)
- Mọi chỗ fetch wallets phải dùng logic tương tự `useWallets.ts`, KHÔNG được select `balance`

#### 3. PostgreSQL Extension — Kiểm tra trước khi dùng
Mỗi extension phải được bật thủ công trên Supabase Dashboard trước khi push migration:
1. Dashboard → **Database** → **Extensions** → tìm và Enable
2. Hoặc SQL Editor: `CREATE EXTENSION IF NOT EXISTS pg_cron;`

**Known required extensions:**
- `pg_cron` — `20260520100000_inactivity_reminder_cron.sql` (Pro plan only. Migration đã guard bằng `IF EXISTS` nên Free plan không lỗi, chỉ skip schedule)

**Rule:** Nếu migration mới dùng extension, phải:
- Guard bằng `IF EXISTS` check để không crash nếu extension chưa bật
- Document vào danh sách trên
- Bật extension trên Supabase Dashboard **TRƯỚC** khi push

#### 4. Trigger không được insert data vi phạm constraint
Khi tạo trigger insert vào bảng khác (ví dụ: `financial_reports` trigger insert `app_notifications`):
- Kiểm tra `type` value có trong CHECK constraint của bảng đích chưa
- Nếu chưa → tạo migration thêm vào constraint **trước** migration tạo trigger

#### 5. Migration naming convention
Format: `YYYYMMDDHHMMSS_description.sql`
Ví dụ: `20260610000000_add_financial_health_notification_type.sql`

#### 6. Pre-push checklist
Trước khi `git push` lên `main`:
- [ ] Migration có dùng CHECK constraint mới? → đã DROP + ADD constraint đầy đủ?
- [ ] Migration có dùng extension? → đã bật trên Dashboard? → đã guard bằng IF EXISTS?
- [ ] Migration có tạo trigger insert vào bảng khác? → data có pass CHECK constraint bảng đích?
- [ ] Code có select cột `balance` từ `wallets`? → **KHÔNG** — phải tính client-side
- [ ] Edge function prompt có gửi đủ metrics mới? → cập nhật `buildPrompt()`

## Testing
- Vitest with jsdom environment, setup in `src/test/setup.ts` (imports `@testing-library/jest-dom/vitest`)
- Coverage thresholds: 80% on lines, functions, branches, statements
- Coverage includes `src/**/*.{ts,tsx}`, excludes test files and `src/main.tsx`
