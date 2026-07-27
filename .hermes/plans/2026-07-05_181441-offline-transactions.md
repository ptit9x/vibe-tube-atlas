# Offline Support for Add/Edit Transaction — Implementation Plan

> **For Hermes:** Use subagent-driven-development skill to implement this plan task-by-task.

**Goal:** Cho phép user thêm mới và sửa giao dịch ngay cả khi mất mạng — lưu vào hàng đợi offline (outbox), hiển thị ngay trên UI (optimistic), và tự động đồng bộ lên Supabase khi có lại mạng.

**Architecture:** Outbox pattern client-side. Khi offline, transaction được ghi vào một Zustand store có `persist` middleware (localStorage) + cập nhật cache TanStack Query optimistic. Một sync engine (hook mounted ở App) lắng nghe `online` event và replay outbox theo thứ tự. Không cần thêm dependency — dùng Zustand persist (đã có) + `navigator.onLine`.

**Tech Stack:** React 19, Zustand 5 (có `persist` middleware built-in), TanStack Query v5, Supabase, Vite, Vitest.

---

## Current State (đã khảo sát)

| File | Vai trò |
|------|---------|
| `src/hooks/useTransactions.ts` | `useCreateTransaction` / `useUpdateTransaction` — gọi Supabase trực tiếp trong `mutationFn`. Offline → throw error. |
| `src/pages/AddTransaction.tsx` | `handleSave()` validate rồi `createTransaction.mutate(...)` |
| `src/pages/EditTransaction.tsx` | `handleSave()` validate rồi `updateTransaction.mutate(...)` |
| `src/stores/transactionFormStore.ts` | Zustand store cho form draft (không persist) |
| `src/lib/supabase.ts` | `requireAuth()`, `isSupabaseConfigured()` |
| `src/types/index.ts` | `Transaction`, `CreateTransactionInput`, `UpdateTransactionInput` |
| `src/lib/i18n/translations.ts` | i18n vi/en — chưa có key offline/sync |
| `public/sw.js` | Service worker network-first GET cache — **KHÔNG được register ở đâu** (pre-existing gap, out of scope) |
| `src/App.tsx` | Mount point — nơi đặt sync engine hook |

**Query keys cần biết:** `['transactions', month, walletId]`, `['transaction', id]`, `['wallets', bool]`, `['dashboard']`.

**Lưu ý quan trọng:** Outbox CHỈ áp dụng khi `isSupabaseConfigured() === true` (production / dev có Supabase). Khi mock mode, mutation đã trả về object giả — không cần outbox.

---

## Phases Overview

1. **Phase 1 — Foundation:** Types + outbox store + online hook
2. **Phase 2 — Sync engine:** Replay logic + mount ở App
3. **Phase 3 — Wire mutations:** `useTransactionSave` hook wrapper
4. **Phase 4 — Pages:** AddTransaction / EditTransaction dùng hook mới
5. **Phase 5 — UI indicators:** Pending badge + offline banner
6. **Phase 6 — i18n:** Thêm strings vi/en
7. **Phase 7 — Tests**

---

## Phase 1 — Foundation

### Task 1: Thêm types cho outbox

**Objective:** Định nghĩa `OutboxEntry` và operation types.

**Files:**
- Modify: `src/types/index.ts` (thêm vào cuối, trước phần Notifications)

**Step 1: Thêm types**

Ở cuối `src/types/index.ts`, thêm:

```ts
// ===== Offline Outbox =====

export type OutboxOperation = 'create' | 'update'

export interface OutboxEntry {
  tempId: string              // crypto.randomUUID() — khóa chính trong outbox
  operation: OutboxOperation
  payload: CreateTransactionInput | UpdateTransactionInput
  createdAt: string           // ISO timestamp
  status: 'pending' | 'syncing' | 'failed'
  attempts: number            // số lần thử sync thất bại
  lastError?: string          // message lỗi gần nhất (debug)
}
```

**Step 2: Verify**

```bash
cd /home/vmo/vibe-coding/vibe-tube-atlas && npx tsc --noEmit
```
Expected: 0 errors.

**Step 3: Commit**

```bash
git add src/types/index.ts
git commit -m "feat(offline): add OutboxEntry types"
```

---

### Task 2: Tạo outbox Zustand store với persist

**Objective:** Store persist các entry offline vào localStorage, expose `add`, `updateStatus`, `remove`, `clearFailed`.

**Files:**
- Create: `src/stores/outboxStore.ts`

**Step 1: Viết store**

```ts
// src/stores/outboxStore.ts
import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { OutboxEntry, OutboxOperation, CreateTransactionInput, UpdateTransactionInput } from '@/types'

interface OutboxState {
  entries: OutboxEntry[]

  // Actions
  add: (operation: OutboxOperation, payload: CreateTransactionInput | UpdateTransactionInput) => string
  updateStatus: (tempId: string, status: OutboxEntry['status'], lastError?: string) => void
  remove: (tempId: string) => void
  clearFailed: () => void
  clearAll: () => void
  getPending: () => OutboxEntry[]
}

const MAX_OFFLINE_ENTRIES = 20

export const useOutboxStore = create<OutboxState>()(
  persist(
    (set, get) => ({
      entries: [],

      add: (operation, payload) => {
        // Giới hạn: không cho phép ghi thêm nếu đã quá MAX_OFFLINE_ENTRIES
        if (get().entries.length >= MAX_OFFLINE_ENTRIES) {
          throw new Error('OUTBOX_FULL') // hook sẽ catch + show toast
        }
        const tempId = crypto.randomUUID()
        const entry: OutboxEntry = {
          tempId,
          operation,
          payload,
          createdAt: new Date().toISOString(),
          status: 'pending',
          attempts: 0,
        }
        set((state) => ({ entries: [...state.entries, entry] }))
        return tempId
      },

      updateStatus: (tempId, status, lastError) =>
        set((state) => ({
          entries: state.entries.map((e) =>
            e.tempId === tempId
              ? {
                  ...e,
                  status,
                  attempts: status === 'failed' ? e.attempts + 1 : e.attempts,
                  lastError,
                }
              : e
          ),
        })),

      remove: (tempId) =>
        set((state) => ({ entries: state.entries.filter((e) => e.tempId !== tempId) })),

      clearFailed: () =>
        set((state) => ({ entries: state.entries.filter((e) => e.status !== 'failed') })),

      clearAll: () => set({ entries: [] }),

      getPending: () => get().entries.filter((e) => e.status === 'pending'),
    }),
    {
      name: 'vibe-tube-atlas-outbox',
      // Chỉ persist mảng entries
      partialize: (state) => ({ entries: state.entries }),
    }
  )
)
```

**Step 2: Verify**

```bash
cd /home/vmo/vibe-coding/vibe-tube-atlas && npx tsc --noEmit
```
Expected: 0 errors.

**Step 3: Commit**

```bash
git add src/stores/outboxStore.ts
git commit -m "feat(offline): add outbox store with localStorage persist"
```

---

### Task 3: Tạo `useOnlineStatus` hook

**Objective:** Hook reactive trả về trạng thái online, listen `online`/`offline` events.

**Files:**
- Create: `src/hooks/useOnlineStatus.ts`

**Step 1: Viết hook**

```ts
// src/hooks/useOnlineStatus.ts
import { useEffect, useState } from 'react'

export function useOnlineStatus(): boolean {
  const [isOnline, setIsOnline] = useState(() =>
    typeof navigator !== 'undefined' ? navigator.onLine : true
  )

  useEffect(() => {
    const goOnline = () => setIsOnline(true)
    const goOffline = () => setIsOnline(false)

    window.addEventListener('online', goOnline)
    window.addEventListener('offline', goOffline)

    return () => {
      window.removeEventListener('online', goOnline)
      window.removeEventListener('offline', goOffline)
    }
  }, [])

  return isOnline
}
```

**Step 2: Verify**

```bash
cd /home/vmo/vibe-coding/vibe-tube-atlas && npx tsc --noEmit
```

**Step 3: Commit**

```bash
git add src/hooks/useOnlineStatus.ts
git commit -m "feat(offline): add useOnlineStatus hook"
```

---

## Phase 2 — Sync Engine

### Task 4: Tạo sync engine hook `useOutboxSync`

**Objective:** Hook replay tất cả entry pending lên Supabase khi online. Gọi 1 lần ở App.

**Files:**
- Create: `src/hooks/useOutboxSync.ts`

**Step 1: Viết hook**

```ts
// src/hooks/useOutboxSync.ts
import { useEffect, useRef } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { supabase, isSupabaseConfigured, requireAuth } from '@/lib/supabase'
import { useOutboxStore } from '@/stores/outboxStore'
import { useOnlineStatus } from '@/hooks/useOnlineStatus'
import type { OutboxEntry, CreateTransactionInput, UpdateTransactionInput } from '@/types'

const TRANSACTION_SELECT =
  '*, wallet:wallets!transactions_wallet_id_fkey(id, name, icon, color), to_wallet:wallets!transactions_to_wallet_id_fkey(id, name, icon, color), category:categories(id, name, icon, color)'

/** Sync một entry — trả về true nếu thành công */
async function syncEntry(entry: OutboxEntry): Promise<boolean> {
  if (!isSupabaseConfigured()) return true // mock mode: bỏ qua

  const user = await requireAuth()

  if (entry.operation === 'create') {
    const payload = entry.payload as CreateTransactionInput
    const { error } = await supabase
      .from('transactions')
      .insert({ ...payload, user_id: user.id })
      .select(TRANSACTION_SELECT)
      .single()
    if (error) throw error
    return true
  }

  // update
  const payload = entry.payload as UpdateTransactionInput
  const { id, ...rest } = payload
  const { error } = await supabase
    .from('transactions')
    .update({ ...rest, updated_at: new Date().toISOString() })
    .eq('id', id)
    .eq('user_id', user.id)
  if (error) throw error
  return true
}

export function useOutboxSync() {
  const queryClient = useQueryClient()
  const isOnline = useOnlineStatus() // ← trigger re-run khi mạng quay lại
  const entries = useOutboxStore((s) => s.entries)
  const updateStatus = useOutboxStore((s) => s.updateStatus)
  const remove = useOutboxStore((s) => s.remove)
  const syncingRef = useRef(false)

  useEffect(() => {
    if (!isOnline) return              // offline → chờ
    if (syncingRef.current) return      // đang sync → bỏ qua
    const pending = entries.filter((e) => e.status === 'pending')
    if (pending.length === 0) return

    syncingRef.current = true

    ;(async () => {
      for (const entry of pending) {
        try {
          updateStatus(entry.tempId, 'syncing')
          await syncEntry(entry)
          remove(entry.tempId)
        } catch (err) {
          const msg = err instanceof Error ? err.message : 'Unknown error'
          updateStatus(entry.tempId, 'failed', msg)
          // Nếu lỗi auth/network nghiêm trọng → dừng sớm
          if (msg.includes('Not authenticated') || msg.includes('Failed to fetch')) break
        }
      }
      // Invalidate cache để fetch dữ liệu thật từ server
      queryClient.invalidateQueries({ queryKey: ['transactions'] })
      queryClient.invalidateQueries({ queryKey: ['wallets'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard'] })
      syncingRef.current = false
    })()
  }, [isOnline, entries, queryClient, updateStatus, remove]) // ← isOnline trong deps!
}
```

**Step 2: Verify**

```bash
cd /home/vmo/vibe-coding/vibe-tube-atlas && npx tsc --noEmit
```

**Step 3: Commit**

```bash
git add src/hooks/useOutboxSync.ts
git commit -m "feat(offline): add outbox sync engine hook"
```

---

### Task 5: Mount sync engine ở App + lắng nghe online event

**Objective:** Gọi `useOutboxSync()` trong `AppContent`, và force re-render khi online lại (để trigger effect).

**Files:**
- Modify: `src/App.tsx`

**Step 1: Thêm import và gọi hook**

Trong `src/App.tsx`:

Thêm import đầu file (sau các import khác):
```ts
import { useOutboxSync } from '@/hooks/useOutboxSync'
```

Trong hàm `AppContent()`, thêm ngay sau dòng `useAuthListener()`:
```ts
  useOutboxSync()
```

**Step 2: Verify build**

```bash
cd /home/vmo/vibe-coding/vibe-tube-atlas && npx tsc --noEmit
```

**Step 3: Commit**

```bash
git add src/App.tsx
git commit -m "feat(offline): mount outbox sync engine in App"
```

---

## Phase 3 — Wire Mutations

### Task 6: Tạo `useTransactionSave` hook (offline-aware)

**Objective:** Một hook duy nhất cho cả add + edit, tự động route offline → outbox + optimistic cache, online → Supabase mutation.

**Files:**
- Create: `src/hooks/useTransactionSave.ts`

**Step 1: Viết hook**

```ts
// src/hooks/useTransactionSave.ts
import { useQueryClient } from '@tanstack/react-query'
import { useCreateTransaction, useUpdateTransaction } from '@/hooks/useTransactions'
import { useOnlineStatus } from '@/hooks/useOnlineStatus'
import { useOutboxStore } from '@/stores/outboxStore'
import { isSupabaseConfigured } from '@/lib/supabase'
import type {
  Transaction, CreateTransactionInput, UpdateTransactionInput, UUID,
} from '@/types'

interface SaveResult {
  offline: boolean   // true nếu đã lưu vào outbox thay vì server
  outboxFull?: boolean // true nếu offline nhưng outbox đã đầy (không ghi được)
  tempId?: string    // present khi offline
}

/**
 * Encapsulates add/edit transaction với offline support.
 * - Online: gọi Supabase mutation như cũ.
 * - Offline (và Supabase configured): ghi outbox + optimistic cache.
 * - Mock mode (no Supabase): luôn online path (mutation trả object giả).
 */
export function useTransactionSave() {
  const isOnline = useOnlineStatus()
  const createTx = useCreateTransaction()
  const updateTx = useUpdateTransaction()
  const queryClient = useQueryClient()
  const addToOutbox = useOutboxStore((s) => s.add)

  async function saveCreate(
    input: CreateTransactionInput,
    callbacks?: { onSuccess?: () => void; onError?: (e: Error) => void }
  ): Promise<SaveResult> {
    // Mock mode → dùng mutation bình thường
    if (!isSupabaseConfigured()) {
      createTx.mutate(input, {
        onSuccess: callbacks?.onSuccess,
        onError: (e) => callbacks?.onError?.(e),
      })
      return { offline: false }
    }

    // Online → Supabase
    if (isOnline) {
      createTx.mutate(input, {
        onSuccess: callbacks?.onSuccess,
        onError: (e) => callbacks?.onError?.(e),
      })
      return { offline: false }
    }

    // Offline → outbox + optimistic
    let tempId: string
    try {
      tempId = addToOutbox('create', input)
    } catch {
      return { offline: false, outboxFull: true } // OUTBOX_FULL
    }
    const tempTx = buildTempTransaction(tempId, input)
    queryClient.setQueriesData<Transaction[]>(
      { queryKey: ['transactions'] },
      (old) => (old ? [tempTx, ...old] : old)
    )
    callbacks?.onSuccess?.()
    return { offline: true, tempId }
  }

  async function saveUpdate(
    input: UpdateTransactionInput,
    callbacks?: { onSuccess?: () => void; onError?: (e: Error) => void }
  ): Promise<SaveResult> {
    if (!isSupabaseConfigured() || isOnline) {
      updateTx.mutate(input, {
        onSuccess: callbacks?.onSuccess,
        onError: (e) => callbacks?.onError?.(e),
      })
      return { offline: false }
    }

    // Offline update → outbox + optimistic patch
    let tempId: string
    try {
      tempId = addToOutbox('update', input)
    } catch {
      return { offline: false, outboxFull: true }
    }
    const { id, ...changes } = input
    queryClient.setQueriesData<Transaction[]>(
      { queryKey: ['transactions'] },
      (old) => (old ? old.map((t) => (t.id === id ? { ...t, ...changes } : t)) : old)
    )
    queryClient.setQueryData<Transaction>(['transaction', id], (old) =>
      old ? { ...old, ...changes } : old
    )
    callbacks?.onSuccess?.()
    return { offline: true, tempId }
  }

  return {
    saveCreate,
    saveUpdate,
    isPending: createTx.isPending || updateTx.isPending,
  }
}

/** Build optimistic temp Transaction từ input create */
function buildTempTransaction(tempId: string, input: CreateTransactionInput): Transaction {
  return {
    id: tempId,
    user_id: '', // chưa biết — sync sẽ thay
    wallet_id: input.wallet_id ?? null,
    to_wallet_id: input.to_wallet_id ?? null,
    category_id: input.category_id ?? null,
    type: input.type,
    amount: input.amount,
    description: input.description ?? null,
    contact_person: input.contact_person ?? null,
    transaction_date: input.transaction_date,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }
}

export type { SaveResult }
export type { UUID }
```

**Step 2: Verify**

```bash
cd /home/vmo/vibe-coding/vibe-tube-atlas && npx tsc --noEmit
```

**Step 3: Commit**

```bash
git add src/hooks/useTransactionSave.ts
git commit -m "feat(offline): add useTransactionSave hook with offline routing"
```

---

## Phase 4 — Pages

### Task 7: Update `AddTransaction.tsx` dùng `useTransactionSave`

**Objective:** Page add dùng hook mới, hiển thị toast khác nhau khi offline.

**Files:**
- Modify: `src/pages/AddTransaction.tsx`

**Step 1: Refactor handleSave**

Thay toàn bộ file `src/pages/AddTransaction.tsx` bằng:

```tsx
import { useNavigate } from 'react-router-dom'
import { useTransactionSave } from '@/hooks/useTransactionSave'
import { useTransactionFormStore } from '@/stores/transactionFormStore'
import { TransactionForm } from '@/components/add-transaction'
import { toast } from 'sonner'
import { useI18n } from '@/lib/i18n'
import { PageTransition } from '@/components/shared'

export default function AddTransaction() {
  const navigate = useNavigate()
  const { saveCreate, isPending } = useTransactionSave()
  const { t } = useI18n()
  const {
    type, amount, walletId, toWalletId, categoryId,
    description, contactPerson, date, reset,
  } = useTransactionFormStore()

  const handleSave = async () => {
    if (!amount || parseFloat(amount) <= 0) {
      toast.error(t.transaction.invalidAmount)
      return
    }
    if (!walletId) {
      toast.error(t.transaction.selectWallet)
      return
    }
    if (type === 'transfer' && !toWalletId) {
      toast.error(t.transaction.selectToWallet || 'Please select destination wallet')
      return
    }
    if (type === 'transfer' && walletId === toWalletId) {
      toast.error(t.transaction.sameWallet || 'Source and destination wallets must be different')
      return
    }
    const amountValue = parseFloat(amount)
    if (Number.isFinite(amountValue) && !Number.isInteger(amountValue * 100)) {
      toast.error(t.transaction.invalidDecimals)
      return
    }

    await saveCreate(
      {
        type: type as 'income' | 'expense' | 'lend' | 'borrow' | 'transfer',
        amount: parseFloat(amount),
        description: description || undefined,
        contact_person: contactPerson || undefined,
        wallet_id: walletId,
        to_wallet_id: type === 'transfer' ? toWalletId : undefined,
        category_id: type !== 'transfer' ? (categoryId || undefined) : undefined,
        transaction_date: date,
      },
      {
        onSuccess: () => {
          reset()
          navigate(-1)
        },
        onError: (error) => {
          toast.error(error instanceof Error ? error.message : t.common.error)
        },
      }
    ).then((result) => {
      if (result.offline) {
        reset()
        toast.info(t.transaction.savedOffline)
        navigate(-1)
      } else {
        // Online success toast được hook trigger? — không, ta tự show
      }
    })

    // Online success: mutation onSuccess đã reset+navigate, nhưng chưa show toast
    // → show toast ở đây cho online path:
    if (!isPending) {
      // (toast online success sẽ do mutation onSuccess cũ lo — nhưng ta đã move logic)
    }
  }

  return (
    <PageTransition>
      <div className="min-h-screen bg-gray-50">
        <TransactionForm onSave={handleSave} isPending={isPending} />
      </div>
    </PageTransition>
  )
}
```

> ⚠️ **Refactor note:** Logic toast online success cần rõ ràng. Cách sạch hơn: trong `saveCreate`, callback `onSuccess` của online path nên nhận thêm cờ `offline`. Ta đơn giản hóa: **online success → hook không show toast; page tự show**. Sửa lại `handleSave` cho gọn — xem Step 1b.

**Step 1b (sửa gọn):** Thay toàn bộ `handleSave` bằng version sạch:

```tsx
  const handleSave = async () => {
    // --- validation (giữ nguyên) ---
    if (!amount || parseFloat(amount) <= 0) { toast.error(t.transaction.invalidAmount); return }
    if (!walletId) { toast.error(t.transaction.selectWallet); return }
    if (type === 'transfer' && !toWalletId) {
      toast.error(t.transaction.selectToWallet || 'Please select destination wallet'); return
    }
    if (type === 'transfer' && walletId === toWalletId) {
      toast.error(t.transaction.sameWallet || 'Source and destination wallets must be different'); return
    }
    const amountValue = parseFloat(amount)
    if (Number.isFinite(amountValue) && !Number.isInteger(amountValue * 100)) {
      toast.error(t.transaction.invalidDecimals); return
    }

    const input: import('@/types').CreateTransactionInput = {
      type: type as 'income' | 'expense' | 'lend' | 'borrow' | 'transfer',
      amount: parseFloat(amount),
      description: description || undefined,
      contact_person: contactPerson || undefined,
      wallet_id: walletId,
      to_wallet_id: type === 'transfer' ? toWalletId : undefined,
      category_id: type !== 'transfer' ? (categoryId || undefined) : undefined,
      transaction_date: date,
    }

    const result = await saveCreate(input, {
      onSuccess: () => {
        reset()
        toast.success(t.transaction.saveSuccess)
        navigate(-1)
      },
      onError: (error) => {
        toast.error(error instanceof Error ? error.message : t.common.error)
      },
    })

    // Offline path: hook đã call onSuccess (để reset), ta override toast
    if (result.offline) {
      toast.dismiss() // bỏ toast success nếu có
      toast.info(t.transaction.savedOffline)
    } else if (result.outboxFull) {
      toast.error(t.transaction.outboxFull)
    }
  }
  ```

  > **Lưu ý:** Nếu `result.offline === false && result.outboxFull === undefined` thì đó là online path — mutation `onSuccess`/`onError` đã xử lý toast và navigate.

**Step 2: Verify build**

```bash
cd /home/vmo/vibe-coding/vibe-tube-atlas && npx tsc --noEmit && node -e "const{build}=require('vite');build().then(()=>console.log('BUILD OK'))"
```

**Step 3: Commit**

```bash
git add src/pages/AddTransaction.tsx
git commit -m "feat(offline): AddTransaction uses useTransactionSave with offline support"
```

---

### Task 8: Update `EditTransaction.tsx` dùng `useTransactionSave`

**Objective:** Tương tự Task 7 cho edit.

**Files:**
- Modify: `src/pages/EditTransaction.tsx`

**Step 1: Refactor**

Thay toàn bộ `src/pages/EditTransaction.tsx` bằng:

```tsx
import { useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useTransaction } from '@/hooks/useTransactions'
import { useTransactionSave } from '@/hooks/useTransactionSave'
import { useTransactionFormStore } from '@/stores/transactionFormStore'
import { TransactionForm } from '@/components/add-transaction'
import { toast } from 'sonner'
import { useI18n } from '@/lib/i18n'

export default function EditTransaction() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { saveUpdate, isPending } = useTransactionSave()
  const { t } = useI18n()
  const {
    type, amount, walletId, toWalletId, categoryId,
    description, contactPerson, date, loadTransaction, reset,
  } = useTransactionFormStore()

  const { data: transaction, isLoading, error } = useTransaction(id)

  useEffect(() => {
    if (transaction) {
      loadTransaction({
        id: transaction.id,
        type: transaction.type,
        amount: transaction.amount,
        categoryId: transaction.category_id || undefined,
        walletId: transaction.wallet_id || undefined,
        toWalletId: transaction.to_wallet_id || undefined,
        description: transaction.description || undefined,
        contactPerson: (transaction as unknown as Record<string, unknown>).contact_person as string || undefined,
        date: transaction.transaction_date,
      })
    }
    return () => reset()
  }, [transaction, loadTransaction, reset])

  const handleSave = async () => {
    if (!id) return
    if (!amount || parseFloat(amount) <= 0) { toast.error(t.transaction.invalidAmount); return }
    if (!walletId) { toast.error(t.transaction.selectWallet); return }

    const input: import('@/types').UpdateTransactionInput = {
      id,
      type: type as 'income' | 'expense' | 'lend' | 'borrow' | 'transfer',
      amount: parseFloat(amount),
      description: description || undefined,
      contact_person: contactPerson || undefined,
      wallet_id: walletId,
      to_wallet_id: type === 'transfer' ? toWalletId || undefined : undefined,
      category_id: categoryId || undefined,
      transaction_date: date,
    }

    const result = await saveUpdate(input, {
      onSuccess: () => {
        reset()
        toast.success(t.settings.transactionUpdated)
        navigate(-1)
      },
      onError: (error) => {
        toast.error(error instanceof Error ? error.message : t.common.error)
      },
    })

    if (result.offline) {
      toast.dismiss() // bỏ toast success nếu có
      toast.info(t.transaction.savedOffline)
    } else if (result.outboxFull) {
      toast.error(t.transaction.outboxFull)
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-blue-500 border-t-transparent" />
      </div>
    )
  }

  if (error || !transaction) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-500 mb-2">{t.settings.transactionNotFound}</p>
          <button onClick={() => navigate(-1)} className="text-blue-500 font-medium">
            {t.settings.goBack}
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <TransactionForm onSave={handleSave} isPending={isPending} />
    </div>
  )
}
```

**Step 2: Verify**

```bash
cd /home/vmo/vibe-coding/vibe-tube-atlas && npx tsc --noEmit
```

**Step 3: Commit**

```bash
git add src/pages/EditTransaction.tsx
git commit -m "feat(offline): EditTransaction uses useTransactionSave with offline support"
```

---

## Phase 5 — UI Indicators

### Task 9: Tạo `OfflineBanner` component

**Objective:** Banner nhỏ hiện khi offline, + số giao dịch đang chờ sync.

**Files:**
- Create: `src/components/shared/OfflineBanner.tsx`
- Modify: `src/components/shared/index.ts` (export)

**Step 1: Viết component**

```tsx
// src/components/shared/OfflineBanner.tsx
import { useOnlineStatus } from '@/hooks/useOnlineStatus'
import { useOutboxStore } from '@/stores/outboxStore'
import { useI18n } from '@/lib/i18n'
import { WifiOff, CloudUpload } from 'lucide-react'

export function OfflineBanner() {
  const isOnline = useOnlineStatus()
  const pendingCount = useOutboxStore((s) => s.entries.filter((e) => e.status !== 'syncing').length)
  const { t } = useI18n()

  if (isOnline && pendingCount === 0) return null

  const showOffline = !isOnline
  const showPending = isOnline && pendingCount > 0

  if (!showOffline && !showPending) return null

  return (
    <div
      className={`flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-white ${
        showOffline ? 'bg-amber-500' : 'bg-blue-500'
      }`}
      role="status"
    >
      {showOffline ? (
        <>
          <WifiOff className="w-4 h-4" />
          <span>{t.common.offlineMode}</span>
          {pendingCount > 0 && (
            <span className="opacity-90">· {pendingCount} {t.common.pendingSync}</span>
          )}
        </>
      ) : (
        <>
          <CloudUpload className="w-4 h-4" />
          <span>{pendingCount} {t.common.pendingSync}</span>
        </>
      )}
    </div>
  )
}
```

**Step 2: Export**

Thêm vào `src/components/shared/index.ts`:
```ts
export { OfflineBanner } from './OfflineBanner'
```

**Step 3: Mount trong MainLayout** (hiển thị trên mọi app pages)

Tìm file layout chính (xác định ở Task 10 bước đầu), thêm `<OfflineBanner />` ở đầu content.

**Step 4: Verify + Commit**

```bash
cd /home/vmo/vibe-coding/vibe-tube-atlas && npx tsc --noEmit
git add src/components/shared/OfflineBanner.tsx src/components/shared/index.ts
git commit -m "feat(offline): add OfflineBanner component"
```

---

### Task 10: Mount `OfflineBanner` trong MainLayout

**Objective:** Banner hiện ở top của mọi authenticated page.

**Files:**
- Modify: `src/layouts/MainLayout.tsx`

**Step 1:** Đọc file để xác định cấu trúc:
```bash
cat src/layouts/MainLayout.tsx | head -60
```

**Step 2:** Thêm import + đặt `<OfflineBanner />` ngay sau thẻ mở của container content chính (trước `<Outlet />` hoặc children).

Ví dụ (cấu trúc cụ thể phụ thuộc file thật):
```tsx
import { OfflineBanner } from '@/components/shared'
// ...
// Trong JSX, đầu content area:
<OfflineBanner />
<Outlet />
```

**Step 3: Verify build + Commit**

```bash
cd /home/vmo/vibe-coding/vibe-tube-atlas && npx tsc --noEmit
git add src/layouts/MainLayout.tsx
git commit -m "feat(offline): mount OfflineBanner in MainLayout"
```

---

## Phase 6 — i18n

### Task 11: Thêm translation keys vi/en

**Objective:** Thêm `offlineMode`, `pendingSync`, `savedOffline`, `outboxFull`, `syncComplete`, `syncFailed`.

**Files:**
- Modify: `src/lib/i18n/translations.ts`

**Step 1: Thêm vào block `common` của `vi`** (sau `daysAgo`, ~line 33):

```ts
      offlineMode: 'Đang ngoại tuyến',
      pendingSync: 'đang chờ đồng bộ',
      syncComplete: 'Đã đồng bộ xong',
      syncFailed: 'Đồng bộ thất bại, sẽ thử lại',
```

**Step 2: Thêm vào block `transaction` của `vi`** (sau `selectMonth`, ~line 172):

```ts
      savedOffline: 'Đã lưu offline, sẽ đồng bộ khi có mạng',
      outboxFull: 'Đã đạt giới hạn 20 giao dịch offline. Vui lòng kết nối mạng để đồng bộ.',
```

**Step 3: Thêm tương ứng cho `en`**

Trong block `common` của `en` (sau `daysAgo`):
```ts
      offlineMode: 'Offline mode',
      pendingSync: 'pending sync',
      syncComplete: 'Sync complete',
      syncFailed: 'Sync failed, will retry',
```

Trong block `transaction` của `en` (sau `selectMonth`):
```ts
      savedOffline: 'Saved offline, will sync when online',
      outboxFull: 'Reached the 20 offline transactions limit. Please connect to sync.',
```

**Step 4: Verify build**

```bash
cd /home/vmo/vibe-coding/vibe-tube-atlas && npx tsc --noEmit
```

**Step 5: Commit**

```bash
git add src/lib/i18n/translations.ts
git commit -m "feat(offline): add i18n keys for offline/sync (vi/en)"
```

---

## Phase 7 — Tests

### Task 12: Test outbox store

**Files:**
- Create: `src/stores/outboxStore.test.ts`

```ts
import { describe, it, expect, beforeEach } from 'vitest'
import { useOutboxStore } from './outboxStore'

beforeEach(() => {
  useOutboxStore.setState({ entries: [] })
  localStorage.clear()
})

describe('outboxStore', () => {
  it('add() creates a pending entry with tempId', () => {
    const tempId = useOutboxStore.getState().add('create', {
      type: 'expense', amount: 100, transaction_date: '2026-07-05', wallet_id: 'w1',
    })
    expect(tempId).toBeTruthy()
    const entries = useOutboxStore.getState().entries
    expect(entries).toHaveLength(1)
    expect(entries[0].status).toBe('pending')
    expect(entries[0].attempts).toBe(0)
  })

  it('updateStatus() marks failed and increments attempts', () => {
    const tempId = useOutboxStore.getState().add('create', {
      type: 'expense', amount: 50, transaction_date: '2026-07-05', wallet_id: 'w1',
    })
    useOutboxStore.getState().updateStatus(tempId, 'failed', 'network')
    const e = useOutboxStore.getState().entries[0]
    expect(e.status).toBe('failed')
    expect(e.attempts).toBe(1)
    expect(e.lastError).toBe('network')
  })

  it('remove() deletes entry', () => {
    const tempId = useOutboxStore.getState().add('create', {
      type: 'expense', amount: 50, transaction_date: '2026-07-05', wallet_id: 'w1',
    })
    useOutboxStore.getState().remove(tempId)
    expect(useOutboxStore.getState().entries).toHaveLength(0)
  })

  it('clearFailed() removes only failed entries', () => {
    const id1 = useOutboxStore.getState().add('create', { type: 'expense', amount: 1, transaction_date: '2026-07-05', wallet_id: 'w1' })
    const id2 = useOutboxStore.getState().add('create', { type: 'expense', amount: 2, transaction_date: '2026-07-05', wallet_id: 'w1' })
    useOutboxStore.getState().updateStatus(id1, 'failed', 'err')
    useOutboxStore.getState().clearFailed()
    const remaining = useOutboxStore.getState().entries
    expect(remaining).toHaveLength(1)
    expect(remaining[0].tempId).toBe(id2)
  })

  it('getPending() returns only pending entries', () => {
    const id1 = useOutboxStore.getState().add('create', { type: 'expense', amount: 1, transaction_date: '2026-07-05', wallet_id: 'w1' })
    useOutboxStore.getState().add('create', { type: 'expense', amount: 2, transaction_date: '2026-07-05', wallet_id: 'w1' })
    useOutboxStore.getState().updateStatus(id1, 'syncing')
    const pending = useOutboxStore.getState().getPending()
    expect(pending).toHaveLength(1)
  })

  it('add() throws when reaching MAX_OFFLINE_ENTRIES (20)', () => {
    for (let i = 0; i < 20; i++) {
      useOutboxStore.getState().add('create', { type: 'expense', amount: i, transaction_date: '2026-07-05', wallet_id: 'w1' })
    }
    expect(useOutboxStore.getState().entries).toHaveLength(20)
    expect(() =>
      useOutboxStore.getState().add('create', { type: 'expense', amount: 99, transaction_date: '2026-07-05', wallet_id: 'w1' })
    ).toThrow('OUTBOX_FULL')
    // Vẫn đúng 20, không thêm entry thứ 21
    expect(useOutboxStore.getState().entries).toHaveLength(20)
  })
})
```

**Run:**
```bash
cd /home/vmo/vibe-coding/vibe-tube-atlas && npx vitest run src/stores/outboxStore.test.ts
```
Expected: 6 passed.

**Commit:**
```bash
git add src/stores/outboxStore.test.ts
git commit -m "test(offline): cover outbox store CRUD"
```

---

### Task 13: Test `useOnlineStatus` hook

**Files:**
- Create: `src/hooks/useOnlineStatus.test.ts`

```ts
import { describe, it, expect, vi } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useOnlineStatus } from './useOnlineStatus'

describe('useOnlineStatus', () => {
  it('reflects navigator.onLine initially', () => {
    Object.defineProperty(navigator, 'onLine', { value: true, configurable: true })
    const { result } = renderHook(() => useOnlineStatus())
    expect(result.current).toBe(true)
  })

  it('updates on offline event', () => {
    Object.defineProperty(navigator, 'onLine', { value: true, configurable: true })
    const { result } = renderHook(() => useOnlineStatus())
    act(() => {
      Object.defineProperty(navigator, 'onLine', { value: false, configurable: true })
      window.dispatchEvent(new Event('offline'))
    })
    expect(result.current).toBe(false)
  })
})
```

**Run:**
```bash
cd /home/vmo/vibe-coding/vibe-tube-atlas && npx vitest run src/hooks/useOnlineStatus.test.ts
```

**Commit:**
```bash
git add src/hooks/useOnlineStatus.test.ts
git commit -m "test(offline): cover useOnlineStatus hook"
```

---

### Task 14: Full build + lint + test pass

**Objective:** Verify toàn bộ không break.

**Step 1: Lint**
```bash
cd /home/vmo/vibe-coding/vibe-tube-atlas && npm run lint
```

**Step 2: Type check**
```bash
npx tsc --noEmit
```

**Step 3: Build**
```bash
node -e "const{build}=require('vite');build().then(()=>console.log('BUILD OK')).catch(e=>{console.error(e);process.exit(1)})"
```

**Step 4: Tests**
```bash
npx vitest run
```
Expected: all pass.

**Step 5: Final commit nếu có fix**
```bash
git add -A && git commit -m "chore(offline): lint/type/build green" || echo "nothing to commit"
```

---

## Risks & Tradeoffs

| Risk | Mitigation |
|------|------------|
| **Optimistic temp transaction thiếu relation (wallet/category object)** | UI có thể hiển thị thiếu tên ví/danh mục tạm thời. Khi sync xong, `invalidateQueries` fetch lại data thật → tự sửa. Acceptable cho MVP. |
| **Trùng lặp nếu user edit 1 transaction 2 lần offline** | Outbox lưu 2 entry update cùng id → sync chạy tuần tự, entry sau ghi đè. Kết quả đúng (giá trị cuối). |
| **Auth token hết hạn khi offline lâu** | `requireAuth()` throw → entry mark failed. User login lại → sync engine chạy lại trên mount. |
| **localStorage giới hạn 5MB** | Mỗi entry ~300 bytes → đủ cho hàng nghìn transaction. Nếu cần scale → chuyển sang IndexedDB (idb-keyval). |
| **SW hiện tại không register** | Out-of-scope (chỉ cache GET). Outbox xử lý mutation độc lập. Để sau. |
| **`setQueriesData` prepend temp tx vào tất cả list kể cả list filter khác tháng** | Tx hiện ở list sai tháng tạm thời. Khi invalidate sau sync sẽ tự sửa. Có thể cải tiến bằng cách check `transaction_date` thuộc tháng nào trước khi add — để Phase 2 cải tiến. |

---

## Open Questions (hỏi user trước khi implement nếu cần)

1. **Sync indicator ở đâu?** Banner full-width (Task 9) hay chỉ 1 badge nhỏ ở header? → Mặc định banner, dễ thấy trên mobile.
2. **Có cho phép user xóa thủ công entry failed không?** → MVP: auto-retry. Settings page quản lý outbox = nice-to-have Phase 2.
3. **Toast khi sync thành công?** → Có thể noisy. Mặc định: toast `syncComplete` chỉ khi user vừa online lại và có entry đã sync.

---

## File Summary

| Action | Path |
|--------|------|
| Create | `src/stores/outboxStore.ts` |
| Create | `src/hooks/useOnlineStatus.ts` |
| Create | `src/hooks/useOutboxSync.ts` |
| Create | `src/hooks/useTransactionSave.ts` |
| Create | `src/components/shared/OfflineBanner.tsx` |
| Create | `src/stores/outboxStore.test.ts` |
| Create | `src/hooks/useOnlineStatus.test.ts` |
| Modify | `src/types/index.ts` |
| Modify | `src/App.tsx` |
| Modify | `src/pages/AddTransaction.tsx` |
| Modify | `src/pages/EditTransaction.tsx` |
| Modify | `src/layouts/MainLayout.tsx` |
| Modify | `src/components/shared/index.ts` |
| Modify | `src/lib/i18n/translations.ts` |

**Dependencies added:** None (Zustand `persist` middleware đã built-in, localStorage native).

**Estimated effort:** ~14 tasks × 3-5 min = 1-1.5 giờ implement.
