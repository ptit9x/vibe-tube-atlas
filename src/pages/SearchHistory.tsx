import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Search, Trash2, Clock, ChevronRight } from 'lucide-react'
import { useI18n } from '@/lib/i18n'
import { useSearchHistory, useClearHistory } from '@/hooks/useSearchHistory'
import { PageTransition } from '@/components/shared'
import PageHeader from '@/components/PageHeader'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import { toast } from 'sonner'
import { formatDistanceToNow } from '@/lib/dateUtils'

export default function SearchHistory() {
  const { t } = useI18n()
  const { data: history, isLoading } = useSearchHistory()
  const clearHistory = useClearHistory()
  const [showClearConfirm, setShowClearConfirm] = useState(false)

  const handleClear = () => {
    clearHistory.mutate(undefined, {
      onSuccess: () => {
        toast.success(t.common.success)
        setShowClearConfirm(false)
      },
      onError: () => toast.error(t.common.error),
    })
  }

  return (
    <PageTransition>
      <div className="min-h-screen bg-gray-50 pb-20">
        <PageHeader>
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-xl font-semibold text-white">
              {t.settings.history}
            </h1>
            {history && history.length > 0 && (
              <button
                onClick={() => setShowClearConfirm(true)}
                className="flex items-center gap-1.5 text-sm text-white/80 hover:text-white py-1 px-2 -mr-2"
              >
                <Trash2 className="h-4 w-4" />
                {t.common.delete}
              </button>
            )}
          </div>
          <p className="text-white/60 text-sm">{history?.length ?? 0} {t.common.total.toLowerCase()}</p>
        </PageHeader>

        <div className="px-4 py-4">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin h-8 w-8 border-2 border-indigo-500 border-t-transparent rounded-full" />
            </div>
          ) : !history || history.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <Clock className="h-12 w-12 text-gray-300 mb-3" />
              <p className="text-gray-500">{t.dashboard.noRecentSearches}</p>
            </div>
          ) : (
            <div className="space-y-2">
              {history.map((entry) => (
                <Link
                  key={entry.id}
                  to={`/keywords?q=${encodeURIComponent(entry.query)}`}
                  className="bg-white rounded-xl shadow-sm p-4 flex items-center gap-3 hover:shadow-md transition-shadow"
                >
                  <div className="w-10 h-10 rounded-full bg-indigo-50 flex items-center justify-center flex-shrink-0">
                    <Search className="h-5 w-5 text-indigo-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900 truncate">{entry.query}</p>
                    <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-gray-500 mt-0.5">
                      <span className="capitalize">{entry.search_type}</span>
                      <span>·</span>
                      <span>{entry.country}</span>
                      <span>·</span>
                      <span>{entry.results_count} results</span>
                      <span>·</span>
                      <span>{formatDistanceToNow(new Date(entry.created_at), t.common)}</span>
                    </div>
                  </div>
                  <ChevronRight className="h-5 w-5 text-gray-300 flex-shrink-0" />
                </Link>
              ))}
            </div>
          )}
        </div>

        <ConfirmDialog
          open={showClearConfirm}
          onOpenChange={setShowClearConfirm}
          title={t.common.confirm}
          description={t.common.delete + '?'}
          confirmLabel={t.common.delete}
          cancelLabel={t.common.cancel}
          onConfirm={handleClear}
          variant="destructive"
        />
      </div>
    </PageTransition>
  )
}
