import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { OutboxEntry, CreateTransactionInput, UpdateTransactionInput } from '@/types'

interface OutboxState {
  entries: OutboxEntry[]

  // Actions
  add: {
    (operation: 'create', payload: CreateTransactionInput): string
    (operation: 'update', payload: UpdateTransactionInput): string
  }
  updateStatus: (tempId: string, status: OutboxEntry['status'], lastError?: string) => void
  remove: (tempId: string) => void
  retryFailed: () => void
  clearFailed: () => void
  clearAll: () => void
  getPending: () => OutboxEntry[]
}

const MAX_OFFLINE_ENTRIES = 20

// After this many failed attempts, an entry is considered permanently failed
// and will not be retried automatically — the user must clear or resolve it.
export const MAX_ATTEMPTS = 5

export const useOutboxStore = create<OutboxState>()(
  persist(
    (set, get) => ({
      entries: [],

      add: ((operation: 'create' | 'update', payload: CreateTransactionInput | UpdateTransactionInput) => {
        // C4 fix: if this is an update whose target id matches a pending create's
        // tempId, merge the changes into that create entry instead of adding a
        // separate update entry. Otherwise the sync would try to UPDATE a row
        // whose id is a tempId (not yet in the DB) → 0 rows affected → silent loss.
        if (operation === 'update') {
          const updatePayload = payload as UpdateTransactionInput
          const { id: targetId, ...changes } = updatePayload
          const existingCreate = get().entries.find(
            (e) => e.operation === 'create' && e.status === 'pending' && e.tempId === targetId
          )
          if (existingCreate) {
            const createPayload = existingCreate.payload as CreateTransactionInput
            set((state) => ({
              entries: state.entries.map((e) =>
                e.tempId === targetId
                  ? ({ ...e, payload: { ...createPayload, ...changes } as CreateTransactionInput } as OutboxEntry)
                  : e
              ),
            }))
            return targetId // reuse the create entry's tempId
          }
        }

        if (get().entries.length >= MAX_OFFLINE_ENTRIES) {
          throw new Error('OUTBOX_FULL')
        }
        const tempId = crypto.randomUUID()
        const entry = {
          tempId,
          operation,
          payload,
          createdAt: new Date().toISOString(),
          status: 'pending' as const,
          attempts: 0,
        }
        set((state) => ({ entries: [...state.entries, entry as OutboxEntry] }))
        return tempId
      }) as OutboxState['add'],

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

      retryFailed: () =>
        set((state) => ({
          entries: state.entries.map((e) =>
            // Only retry entries that haven't exhausted their attempts
            e.status === 'failed' && e.attempts < MAX_ATTEMPTS
              ? { ...e, status: 'pending' as const, lastError: undefined }
              : e
          ),
        })),

      clearFailed: () =>
        set((state) => ({ entries: state.entries.filter((e) => e.status !== 'failed') })),

      clearAll: () => set({ entries: [] }),

      getPending: () => get().entries.filter((e) => e.status === 'pending'),
    }),
    {
      name: 'vibe-tube-atlas-outbox',
      partialize: (state) => ({ entries: state.entries }),
      // H1 fix: on rehydration, any entry left in 'syncing' state (from a crash
      // or tab close mid-sync) is reset to 'pending' so it gets retried. Without
      // this, a 'syncing' entry is never picked up again (doSync only processes
      // pending + failed) and stays orphaned forever.
      onRehydrateStorage: () => (state) => {
        if (!state) return
        state.entries = state.entries.map((e) =>
          e.status === 'syncing' ? { ...e, status: 'pending' as const } : e
        )
      },
    }
  )
)

export { MAX_OFFLINE_ENTRIES }
