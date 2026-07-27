# 💰 Money Keeper Clone - Development Plan

## 1. Project Overview

**Based on:** vibe-tube-atlas codebase (React 19 + Vite + TypeScript + TailwindCSS v4 + shadcn/ui)

**Goal:** Build a personal finance management app similar to Money Keeper - track income/expenses, manage wallets, view reports.

---

## 2. Feature Roadmap

### 🔵 MVP (Sprint 1-2) - Core Features

| Feature | Description | Priority |
|---------|-------------|----------|
| **Transaction Recording** | Add income/expense with amount, description, date | 🔴 High |
| **Categories** | Icon + color for categories: Food, Transport, Shopping, Salary, etc. | 🔴 High |
| **Wallet Management** | Create wallets: Cash, Bank Card, E-wallet. Track balance | 🔴 High |
| **Monthly Reports** | Pie/line charts showing income/expense by month | 🟡 Medium |
| **Login/Register** | Auth flow with localStorage (mock) → Supabase | 🟡 Medium |

### 🟡 Advanced (Sprint 3-4) - Enhanced Features

| Feature | Description | Priority |
|---------|-------------|----------|
| **Budget** | Set spending limits by category/month | 🟡 Medium |
| **Savings** | Savings goal, track progress | 🟡 Medium |
| **Reminders** | Cron job for daily transaction input notification | 🟢 Low |
| **Export Excel/CSV** | Export data to file | 🟢 Low |

---

## 3. Database Schema (Supabase PostgreSQL)

```sql
-- Users
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT,
  full_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Wallets
CREATE TABLE wallets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,           -- "Cash Wallet", "MB Bank Card"
  type TEXT NOT NULL,           -- 'cash' | 'bank' | 'e_wallet'
  icon TEXT DEFAULT '💰',
  color TEXT DEFAULT '#3B82F6',
  initial_balance DECIMAL(15,2) DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Categories
CREATE TABLE categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE, -- NULL = system default
  name TEXT NOT NULL,           -- "Food", "Salary"
  type TEXT NOT NULL,           -- 'income' | 'expense'
  icon TEXT DEFAULT '📦',
  color TEXT DEFAULT '#6B7280',
  parent_id UUID REFERENCES categories(id),
  is_system BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Transactions
CREATE TABLE transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  wallet_id UUID REFERENCES wallets(id) ON DELETE SET NULL,
  category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
  type TEXT NOT NULL,           -- 'income' | 'expense'
  amount DECIMAL(15,2) NOT NULL,
  description TEXT,
  transaction_date DATE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Budgets
CREATE TABLE budgets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  category_id UUID REFERENCES categories(id) ON DELETE CASCADE,
  amount DECIMAL(15,2) NOT NULL,
  period TEXT NOT NULL,         -- 'monthly' | 'weekly'
  start_date DATE NOT NULL,
  end_date DATE,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Savings Goals
CREATE TABLE savings_goals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  target_amount DECIMAL(15,2) NOT NULL,
  current_amount DECIMAL(15,2) DEFAULT 0,
  deadline DATE,
  icon TEXT DEFAULT '🎯',
  color TEXT DEFAULT '#10B981',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes
CREATE INDEX idx_transactions_user_date ON transactions(user_id, transaction_date);
CREATE INDEX idx_transactions_wallet ON transactions(wallet_id);
CREATE INDEX idx_wallets_user ON wallets(user_id);
```

---

## 4. Tech Stack

### Frontend (Current vibe-tube-atlas)
```
React 19 + Vite 8 + TypeScript 6
TailwindCSS v4 + @tailwindcss/vite
shadcn/ui (Radix UI components)
TanStack Query v5
React Router v7
Zod + React Hook Form
Recharts (charts)
Lucide React (icons)
```

### Backend (Supabase)
```
Supabase (PostgreSQL + Auth + Realtime + Storage)
- Database: PostgreSQL
- Auth: Email/Password + Google OAuth
- Edge Functions: Deno (for complex logic)
- Storage: Avatar, export files
```

### Dev Tools
```
Vite (dev server + build)
Vitest (testing)
ESLint + Prettier
GitHub Actions (CI/CD)
```

---

## 5. Development Workflow

### Sprint 1: Setup + Core Transaction (2 weeks)

**UI/UX:**
- Design Dashboard with quick add transaction
- Transaction add page (simple form)
- Transaction list with date/category filter

**Coding:**
- [ ] Migrate project structure for Money Keeper
- [ ] Create Supabase project + schema
- [ ] Connect API (TanStack Query + Supabase client)
- [ ] CRUD Transactions (Create, Read, Update, Delete)
- [ ] Filter & search transactions

**Testing:**
- [ ] Unit tests for form validation
- [ ] Integration tests for CRUD

---

### Sprint 2: Wallets + Categories + Reports (2 weeks)

**UI/UX:**
- Wallet management page (CRUD wallets)
- Category page (default + custom)
- Dashboard reports (pie + bar charts)

**Coding:**
- [ ] CRUD Wallets
- [ ] CRUD Categories  
- [ ] Monthly reports (Recharts charts)
- [ ] Transfer between wallets

**Testing:**
- [ ] Dashboard charts render correctly
- [ ] Wallet CRUD operations

---

### Sprint 3: Budget + Savings + Auth (2 weeks)

**UI/UX:**
- Budget setup page
- Savings goal page
- Auth flow (Supabase Auth)

**Coding:**
- [ ] CRUD Budgets
- [ ] CRUD Savings Goals
- [ ] Supabase Auth integration
- [ ] Protected routes

**Testing:**
- [ ] Auth flow (login/logout/register)
- [ ] Budget calculations

---

### Sprint 4: Polish + Advanced (2 weeks)

**UI/UX:**
- Notifications/Reminders UI
- Export data UI
- Mobile responsive polish

**Coding:**
- [ ] Daily reminder cron job (Supabase Edge)
- [ ] Export Excel/CSV (xlsx library)
- [ ] PWA support (optional)

**Testing:**
- [ ] E2E tests (Playwright)
- [ ] Performance audit

---

## 6. UI/UX Suggestions

### Color Palette
```
Primary: #3B82F6 (Blue)
Success (Income): #10B981 (Green)
Danger (Expense): #EF4444 (Red)
Warning: #F59E0B (Amber)
Background Light: #FFFFFF
Background Dark: #0F172A
```

### Main Screens

```
1. Dashboard (Home)
   - Quick add transaction button (FAB)
   - Overview of all wallet balances
   - Monthly income/expense chart
   - Recent transactions list

2. Transactions
   - Filter: by date, category, wallet
   - Sort: by date, amount
   - Swipe to edit/delete

3. Wallets
   - Card view for each wallet
   - Add/edit wallet
   - Transfer between wallets

4. Reports
   - Pie chart: expense by category
   - Bar chart: income vs expense by month
   - Line chart: balance over time

5. Settings
   - Profile
   - Categories management
   - Budgets
   - Savings goals
   - Export data
```

### Component Structure

```
src/
├── pages/
│   ├── Dashboard.tsx         # Home page
│   ├── Transactions.tsx       # Transaction list
│   ├── AddTransaction.tsx     # Add/edit transaction
│   ├── Wallets.tsx           # Wallet management
│   ├── Reports.tsx           # Reports & charts
│   ├── Budgets.tsx           # Budget management
│   ├── Savings.tsx           # Savings goals
│   └── Settings.tsx          # Settings
├── components/
│   ├── transaction/          # Transaction-related
│   │   ├── TransactionForm.tsx
│   │   ├── TransactionList.tsx
│   │   └── TransactionItem.tsx
│   ├── wallet/               # Wallet-related
│   ├── charts/              # Chart components
│   └── ui/                  # Base UI components
├── hooks/
│   ├── useTransactions.ts
│   ├── useWallets.ts
│   ├── useBudgets.ts
│   └── useSavings.ts
├── lib/
│   ├── supabase.ts          # Supabase client
│   └── utils.ts
└── types/
    └── index.ts             # TypeScript types
```

### Navigation

```
Bottom Tab Navigation (Mobile-first):
├── 🏠 Dashboard
├── 📊 Transactions
├── 💳 Wallets  
├── 📈 Reports
└── ⚙️ Settings

FAB (Floating Action Button) for quick add transaction
```

---

## 7. API Endpoints (Supabase)

Using Supabase client directly, no custom API needed:

```typescript
// Transactions
supabase.from('transactions').select('*, wallets(*), categories(*)')
supabase.from('transactions').insert({ ... })
supabase.from('transactions').update({ ... }).eq('id', id)
supabase.from('transactions').delete().eq('id', id)

// Wallets
supabase.from('wallets').select('*')
supabase.from('wallets').insert({ ... })

// With RPC for complex queries
supabase.rpc('get_monthly_report', { month: '2024-01' })
```

---

## 8. Priority Checklist

**Start immediately:**
- [ ] Supabase project setup + schema
- [ ] Auth flow (login/register/logout)
- [ ] Transactions CRUD
- [ ] Basic Dashboard

**Next:**
- [ ] Wallets CRUD
- [ ] Categories CRUD
- [ ] Reports (charts)
- [ ] Budgets
- [ ] Savings Goals

**Finally:**
- [ ] Notifications
- [ ] Export data
- [ ] Mobile PWA