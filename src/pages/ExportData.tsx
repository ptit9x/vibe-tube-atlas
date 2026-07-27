import { useState } from 'react'
import { FileSpreadsheet, FileText, Loader2, Calendar, Filter, Wallet, AlertCircle } from 'lucide-react'
import { useI18n } from '@/lib/i18n'
import { useWallets } from '@/hooks/useWallets'
import { toast } from 'sonner'
import { isSupabaseConfigured, supabase } from '@/lib/supabase'
import PageHeader from '@/components/PageHeader'
import type { Transaction } from '@/types'

type ExportFormat = 'csv' | 'xlsx'

interface ExportRow {
  date: string
  type: string
  category: string
  wallet: string
  amount: string
  description: string
}

import { PageTransition } from '@/components/shared'

export default function ExportData() {
  const { t } = useI18n()
  const [exporting, setExporting] = useState<ExportFormat | null>(null)
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [walletFilter, setWalletFilter] = useState('all')
  const [lastExportCount, setLastExportCount] = useState<number | null>(null)

  const { data: wallets, isLoading: walletsLoading, error: walletsError, refetch: refetchWallets } = useWallets()

  // Fetch filtered transactions for export
  const fetchExportData = async (): Promise<Transaction[]> => {
    if (isSupabaseConfigured()) {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      let query = supabase
        .from('transactions')
        .select(`
          id, amount, type, description, transaction_date, created_at,
          wallet:wallets!transactions_wallet_id_fkey(id, name, icon, color),
          to_wallet:wallets!transactions_to_wallet_id_fkey(id, name, icon, color),
          category:categories(id, name, icon, color)
        `)
        .eq('user_id', user.id)
        .order('transaction_date', { ascending: false })

      if (dateFrom) query = query.gte('transaction_date', dateFrom)
      if (dateTo) query = query.lte('transaction_date', dateTo)
      if (walletFilter !== 'all') query = query.eq('wallet_id', walletFilter)

      const { data, error } = await query
      if (error) throw error
      return data as unknown as Transaction[]
    } else {
      // Mock data — no pre-fetch needed
      return []
    }
  }

  const mapToRows = (items: Transaction[]): ExportRow[] => {
    return items.map((t) => {
      const cat = t.category as { name?: string } | null
      const wal = t.wallet as { name?: string } | null
      const typeLabel = t.type === 'income' ? 'Income'
        : t.type === 'expense' ? 'Expense'
        : t.type === 'transfer' ? 'Transfer'
        : t.type === 'lend' ? 'Lend'
        : t.type === 'borrow' ? 'Borrow'
        : t.type

      return {
        date: t.transaction_date || '',
        type: typeLabel,
        category: cat?.name || '',
        wallet: wal?.name || '',
        amount: String(t.amount || 0),
        description: (t.description || '').replace(/"/g, '""'),
      }
    })
  }

  const handleExport = async (format: ExportFormat) => {
    setExporting(format)

    try {
      const data = await fetchExportData()

      if (data.length === 0) {
        toast.error(t.settings.exportFailed)
        setExporting(null)
        return
      }

      const rows = mapToRows(data)
      setLastExportCount(rows.length)

      if (format === 'csv') {
        exportToCSV(rows)
      } else {
        exportToXLSX(rows)
      }
    } catch (error) {
      toast.error(t.settings.exportFailed)
      if (import.meta.env.DEV) console.error(error)
    } finally {
      setExporting(null)
    }
  }

  const exportToCSV = (rows: ExportRow[]) => {
    const headers = ['Date', 'Type', 'Category', 'Wallet', 'Amount', 'Description']
    const csvContent = [
      headers.join(','),
      ...rows.map(row =>
        [row.date, row.type, row.category, row.wallet, row.amount, row.description]
          .map(cell => `"${cell}"`)
          .join(',')
      ),
    ].join('\n')

    downloadFile(csvContent, generateFilename('csv'), 'text/csv')
    toast.success(t.settings.exportSuccess)
  }

  const exportToXLSX = (rows: ExportRow[]) => {
    const headers = ['Date', 'Type', 'Category', 'Wallet', 'Amount', 'Description']
    const headerCells = headers
      .map(h => `<th style="font-weight:bold;background:#3B82F6;color:white;padding:8px 12px;text-align:left">${escapeXML(h)}</th>`)
      .join('')
    const dataRows = rows.map(row =>
      `<tr>${[
        escapeXML(row.date),
        escapeXML(row.type),
        escapeXML(row.category),
        escapeXML(row.wallet),
        row.amount,
        escapeXML(row.description),
      ].map((cell, i) => `<td style="padding:6px 12px;border-bottom:1px solid #eee${i === 4 ? ';text-align:right' : ''}">${cell}</td>`).join('')}</tr>`
    ).join('')

    const html = `<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel">
<head><meta charset="UTF-8"><!--[if gte mso 9]><xml><x:ExcelWorkbook><x:ExcelWorksheets><x:ExcelWorksheet><x:Name>Transactions</x:Name><x:WorksheetOptions><x:DisplayGridlines/></x:WorksheetOptions></x:ExcelWorksheet></x:ExcelWorksheets></x:ExcelWorkbook></xml><![endif]--></head>
<body><table style="border-collapse:collapse;font-family:Arial,sans-serif;font-size:12px"><tr>${headerCells}</tr>${dataRows}</table></body></html>`

    downloadFile(html, generateFilename('xls'), 'application/vnd.ms-excel')
    toast.success(t.settings.exportSuccess)
  }

  const generateFilename = (ext: string) => {
    const date = new Date().toISOString().slice(0, 10)
    const suffix = dateFrom || dateTo ? `_${dateFrom || 'start'}-${dateTo || 'end'}` : `_${date}`
    return `vibe-tube-atlas${suffix}.${ext}`
  }

  const escapeXML = (str: string) =>
    str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&apos;')

  const downloadFile = (content: string, filename: string, mimeType: string) => {
    const BOM = '\uFEFF' // UTF-8 BOM for Excel compatibility
    const blob = new Blob([BOM + content], { type: `${mimeType};charset=utf-8` })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = filename
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  const clearFilters = () => {
    setDateFrom('')
    setDateTo('')
    setWalletFilter('all')
  }

  const hasFilters = dateFrom || dateTo || walletFilter !== 'all'

  return (
    <PageTransition>
    <div className="min-h-screen bg-gray-50 pb-20">
      <PageHeader>
        <h1 className="text-xl font-semibold text-white">{t.settings.exportData}</h1>
      </PageHeader>

      {walletsLoading ? (
        <div className="flex flex-col items-center justify-center py-20 text-gray-400">
          <Loader2 className="h-8 w-8 animate-spin mb-3" />
          <p className="text-sm">{t.common.loading}</p>
        </div>
      ) : walletsError ? (
        <div className="flex flex-col items-center justify-center py-20 px-6 text-center">
          <AlertCircle className="h-8 w-8 text-red-400 mb-3" />
          <p className="text-sm text-red-500 mb-3">{t.common.error}</p>
          <button
            onClick={() => { void refetchWallets() }}
            className="text-sm text-indigo-500 font-medium hover:text-indigo-600"
          >
            {t.common.retry || 'Retry'}
          </button>
        </div>
      ) : (
      <div className="px-4 py-3">
        {/* Description */}
        <p className="text-sm text-gray-500 mb-3 px-1">
          {t.settings.exportDescription}
        </p>

        {/* Filters */}
        <div className="bg-white rounded-xl p-4 mb-3">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-gray-400" />
              <span className="text-sm font-medium text-gray-700">Filters</span>
            </div>
            {hasFilters && (
              <button
                onClick={clearFilters}
                className="text-xs text-blue-500 hover:text-blue-600"
              >
                ✕ Clear
              </button>
            )}
          </div>

          {/* Date range */}
          <div className="flex items-center gap-2 mb-3">
            <Calendar className="h-4 w-4 text-gray-400 shrink-0" />
            <div className="flex items-center gap-2 flex-1">
              <input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                placeholder="From"
              />
              <span className="text-gray-400 text-sm">→</span>
              <input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                placeholder="To"
              />
            </div>
          </div>

          {/* Wallet filter */}
          <div className="flex items-center gap-2">
            <Wallet className="h-4 w-4 text-gray-400 shrink-0" />
            <select
              value={walletFilter}
              onChange={(e) => setWalletFilter(e.target.value)}
              className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-white"
            >
              <option value="all">All Wallets</option>
              {wallets?.map((w) => (
                <option key={w.id} value={w.id}>
                  {w.icon} {w.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Export Summary */}
        <div className="bg-white rounded-xl p-4 mb-3">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-500">{t.settings.availableRecords}</span>
            <span className="text-sm font-medium text-gray-900">
              {lastExportCount !== null ? `${lastExportCount} ` : ''}{t.settings.transactions}
            </span>
          </div>
        </div>

        {/* Export Buttons */}
        <div className="bg-white rounded-xl p-4">
          <div className="space-y-3">
            {/* Excel Export */}
            <button
              onClick={() => handleExport('xlsx')}
              disabled={exporting !== null}
              className="w-full flex items-center gap-4 p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors disabled:opacity-50 active:scale-[0.98]"
            >
              {exporting === 'xlsx' ? (
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                  <Loader2 className="h-5 w-5 text-green-500 animate-spin" />
                </div>
              ) : (
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                  <FileSpreadsheet className="h-5 w-5 text-green-500" />
                </div>
              )}
              <div className="text-left flex-1">
                <p className="text-gray-900 font-medium">{t.settings.exportExcel}</p>
                <p className="text-gray-400 text-sm">{t.settings.suitableForSheets}</p>
              </div>
            </button>

            {/* CSV Export */}
            <button
              onClick={() => handleExport('csv')}
              disabled={exporting !== null}
              className="w-full flex items-center gap-4 p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors disabled:opacity-50 active:scale-[0.98]"
            >
              {exporting === 'csv' ? (
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                  <Loader2 className="h-5 w-5 text-blue-500 animate-spin" />
                </div>
              ) : (
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                  <FileText className="h-5 w-5 text-blue-500" />
                </div>
              )}
              <div className="text-left flex-1">
                <p className="text-gray-900 font-medium">{t.settings.exportCSV}</p>
                <p className="text-gray-400 text-sm">{t.settings.basicFormat}</p>
              </div>
            </button>
          </div>
        </div>
      </div>
      )}
    </div>
    </PageTransition>
  )
}
