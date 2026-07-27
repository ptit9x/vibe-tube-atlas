import { create } from 'zustand'

export interface Currency {
  code: string
  name: string
  symbol: string
  flag: string
  locale: string
}

export const CURRENCIES: Currency[] = [
  { code: 'VND', name: 'Vietnamese Dong', symbol: '₫', flag: '🇻🇳', locale: 'vi-VN' },
  { code: 'USD', name: 'US Dollar', symbol: '$', flag: '🇺🇸', locale: 'en-US' },
  { code: 'EUR', name: 'Euro', symbol: '€', flag: '🇪🇺', locale: 'de-DE' },
  { code: 'JPY', name: 'Japanese Yen', symbol: '¥', flag: '🇯🇵', locale: 'ja-JP' },
  { code: 'GBP', name: 'British Pound', symbol: '£', flag: '🇬🇧', locale: 'en-GB' },
]

export interface UIState {
  showBalance: boolean
  currentMonth: string
  currency: Currency

  toggleBalance: () => void
  setShowBalance: (show: boolean) => void
  setCurrentMonth: (month: string) => void
  setCurrency: (currency: Currency) => void
  formatCurrency: (amount: number) => string
  /** Returns masked string '••••••' if balance hidden, else formatted amount with symbol */
  displayAmount: (amount: number) => string
}

const getStoredCurrency = (): Currency => {
  if (typeof window === 'undefined') return CURRENCIES[0]
  const stored = localStorage.getItem('vibe-tube-atlas-currency')
  if (stored) {
    const found = CURRENCIES.find(c => c.code === stored)
    if (found) return found
  }
  return CURRENCIES[0]
}

export const useUIStore = create<UIState>((set, get) => ({
  showBalance: true,
  currentMonth: new Date().toISOString().slice(0, 7),
  currency: getStoredCurrency(),

  toggleBalance: () => set((state) => ({ showBalance: !state.showBalance })),
  setShowBalance: (show) => set({ showBalance: show }),
  setCurrentMonth: (month) => set({ currentMonth: month }),
  setCurrency: (currency) => {
    localStorage.setItem('vibe-tube-atlas-currency', currency.code)
    set({ currency })
  },
  formatCurrency: (amount: number) => {
    const { currency } = get()
    return new Intl.NumberFormat(currency.locale, {
      minimumFractionDigits: currency.code === 'VND' || currency.code === 'JPY' ? 0 : 2,
      maximumFractionDigits: currency.code === 'VND' || currency.code === 'JPY' ? 0 : 2,
    }).format(amount)
  },
  displayAmount: (amount: number) => {
    const { showBalance, currency } = get()
    if (!showBalance) return '••••••'
    return currency.symbol + get().formatCurrency(amount)
  },
}))