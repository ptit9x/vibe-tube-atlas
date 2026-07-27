# Vibe Tube Atlas - Money Keeper Clone

A personal finance management app built with React + Vite + TypeScript + TailwindCSS + Supabase.

## Features

- **Auth**: Login/Register with Supabase Auth
- **Dashboard**: Overview with balance, income/expense stats, charts, recent transactions
- **Balance Toggle**: Hide/show balance amounts with eye icon for privacy
- **Transactions**: Add, view, filter income/expense transactions
- **Wallets**: Manage multiple wallets (Cash, Bank, E-wallet)
- **Reports**: Monthly reports with bar charts, category breakdown
- **Settings**: Language, currency, password, data export
- **Profile**: User info, coins, referral code

## Tech Stack

- **Frontend**: React 19 + Vite 8 + TypeScript 6 + TailwindCSS v4
- **Backend**: Supabase (PostgreSQL + Auth + Realtime)
- **State**: TanStack Query v5 (server state) + Zustand v5 (UI state)
- **Charts**: Recharts
- **Icons**: Lucide React

---

## State Management

### Zustand (UI State)

UI state that doesn't need server sync lives in Zustand stores under `src/stores/`:

```
src/stores/
├── addTransactionStore.ts  # Transaction form state
├── dashboardStore.ts       # Dashboard UI state
├── walletsStore.ts         # Wallets UI state
└── reportsStore.ts          # Reports UI state
```

**Rules:**
- Use Zustand for: toggle states, filters, form drafts, UI flags
- Use TanStack Query for: server data (transactions, wallets, categories)
- Stores persist in memory only (no localStorage unless needed)

### TanStack Query (Server State)

All API data (transactions, wallets, categories) goes through React Query hooks in `src/hooks/`.

---

## Setup Instructions

### 1. Configure Supabase

Create a Supabase project at [supabase.com](https://supabase.com), then update `.env`:

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

### 2. Deploy Database Schema

The schema is in `supabase/migrations/` and auto-deploys via GitHub Actions when you push.

**Required GitHub Secrets:**

| Secret Name | How to Get |
|-------------|------------|
| `SUPABASE_ACCESS_TOKEN` | Supabase Dashboard → Avatar → Account Settings → Access Tokens → New access token |
| `POSTGRES_PASSWORD` | Supabase Dashboard → Database → Settings → Connection string (password part) |
| `PROJECT_REF` | Supabase Dashboard → Project Settings → General → Project Reference |

**Steps:**
1. Go to your GitHub repo → Settings → Secrets and variables → Actions
2. Add the 3 secrets above
3. Push any change to trigger the deploy workflow

### 3. Local Development

```bash
npm install
npm run dev
```

---

## Project Structure

```
vibe-tube-atlas/
├── src/
│   ├── pages/                    # Route pages (compositions only)
│   ├── components/
│   │   ├── dashboard/           # Dashboard components
│   │   ├── add-transaction/     # AddTransaction components
│   │   ├── wallets/             # Wallets components
│   │   ├── reports/             # Reports components
│   │   └── ui/                  # shadcn/ui style components
│   ├── stores/                  # Zustand stores
│   ├── hooks/                   # TanStack Query hooks
│   └── lib/                     # Utils
├── docs/
│   ├── project-docs.md          # Full project documentation
│   └── code-review.md          # Code quality report
└── vercel.json                  # SPA routing config
```

---

## Component Architecture

### Principle: Pages compose components, don't contain logic

**DO:**
- Keep pages as thin compositions of reusable components
- Create `components/[feature]/` folders for related components
- Each component should be focused and single-purpose
- Export types and interfaces from component files for reuse

**DON'T:**
- Write all page logic in a single `.tsx` file
- Put component code directly in pages
- Create monolithic files that handle multiple responsibilities

### Feature Components

| Feature | Components |
|---------|------------|
| Dashboard | SummaryCards, ExpenseAnalysis, MonthlyChart, RecentTransactions, QuickActions |
| AddTransaction | AmountDisplay, CategorySelector, WalletSelector, TypeDropdown, SaveButton |
| Wallets | TotalBalanceCard, WalletCard, WalletList, AddWalletModal, AddWalletFAB |
| Reports | BalanceOverview, MonthlyChart, QuickActions, ReportComponents (shared) |
| Settings | LanguageSettings, CurrencySettings, PasswordSettings, ExportData |

---

## Pages & Routes

| Route | Page | Description |
|-------|------|-------------|
| `/dashboard` | Dashboard | Balance overview, charts, recent transactions |
| `/add-transaction` | AddTransaction | Add new income/expense transaction |
| `/wallets` | Wallets | Manage wallets with balance |
| `/reports` | Reports | Overview with quick actions |
| `/reports/expense` | ExpenseReport | Expense bar chart, category breakdown |
| `/reports/income` | IncomeReport | Income bar chart, category breakdown |
| `/settings/language` | LanguageSettings | Change app language |
| `/settings/currency` | CurrencySettings | Change currency |
| `/settings/password` | PasswordSettings | Change account password |
| `/settings/export` | ExportData | Export data to CSV/Excel |
| `/budgets` | Profile | User profile, settings list |

---

## Footer Navigation

| Tab | Route |
|-----|-------|
| Home | /dashboard |
| Account | /wallets |
| Add (FAB) | /add-transaction |
| Report | /reports |
| Khác | /budgets |

---

## Commands

```bash
npm run dev      # Start dev server
npm run build    # Build production
npm run preview  # Preview production build
```

---

## Notes

- App uses mock data when Supabase credentials are placeholder
- All monetary values stored as DECIMAL(15,2) - supports up to ~999 billion VND
- Row Level Security (RLS) ensures data isolation between users
- `vercel.json` configures SPA routing for client-side navigation
- See `docs/code-review.md` for code quality report
