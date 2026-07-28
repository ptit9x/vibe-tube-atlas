import { Link } from 'react-router-dom'
import { PageTransition } from '@/components/shared'
import PageHeader from '@/components/PageHeader'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { useI18n } from '@/lib/i18n'
import { useApiUsage } from '@/hooks/useApiKey'
import { useSearchHistory } from '@/hooks/useSearchHistory'
import { useSavedKeywords } from '@/hooks/useKeywords'
import { useSavedVideos } from '@/hooks/useVideos'
import { useSavedChannels } from '@/hooks/useChannels'
import { formatCompactNumber } from '@/lib/youtube'
import { DEFAULT_QUOTA_LIMIT } from '@/constants/youtube'
import {
  Search,
  TrendingUp,
  Video,
  KeyRound,
  Bookmark,
  History,
  ChevronRight,
  BarChart3,
} from 'lucide-react'

export default function Dashboard() {
  const { t } = useI18n()
  const { data: usage } = useApiUsage()
  const { data: searchHistory } = useSearchHistory(5)
  const { data: savedKeywords } = useSavedKeywords()
  const { data: savedVideos } = useSavedVideos()
  const { data: savedChannels } = useSavedChannels()

  const quotaLimit = usage?.quotaLimit ?? DEFAULT_QUOTA_LIMIT
  const quotaUsed = usage?.todayQuotaUsed ?? 0
  const quotaPercent = Math.min(100, (quotaUsed / quotaLimit) * 100)

  const quickActions = [
    { to: '/keywords', icon: Search, label: t.dashboard.analyzeKeyword, color: 'text-blue-600 bg-blue-50' },
    { to: '/videos', icon: Video, label: t.dashboard.searchVideos, color: 'text-purple-600 bg-purple-50' },
    { to: '/trending', icon: TrendingUp, label: t.dashboard.trending, color: 'text-red-600 bg-red-50' },
  ]

  const savedCounts = [
    { label: t.dashboard.savedKeywords, count: savedKeywords?.length ?? 0 },
    { label: t.dashboard.savedVideos, count: savedVideos?.length ?? 0 },
    { label: t.dashboard.savedChannels, count: savedChannels?.length ?? 0 },
  ]

  return (
    <PageTransition>
      <div className="min-h-screen bg-gray-50 pb-20">
        <PageHeader>
          <h1 className="text-xl font-bold text-white">{t.dashboard.greeting}</h1>
          <p className="text-sm text-white/80">{t.dashboard.subtitle}</p>
        </PageHeader>

        <div className="px-4 -mt-4 space-y-4">
          {/* API Quota Card */}
          <Card className="bg-white rounded-xl shadow-sm">
            <CardContent className="p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-lg bg-amber-50">
                    <BarChart3 className="h-5 w-5 text-amber-600" />
                  </div>
                  <span className="font-semibold text-sm">{t.dashboard.apiQuota}</span>
                </div>
                <span className="text-xs text-muted-foreground">
                  {formatCompactNumber(quotaUsed)} / {formatCompactNumber(quotaLimit)}
                </span>
              </div>
              <div className="h-2 rounded-full bg-gray-100 overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${
                    quotaPercent > 80 ? 'bg-red-500' : quotaPercent > 50 ? 'bg-amber-500' : 'bg-green-500'
                  }`}
                  style={{ width: `${quotaPercent}%` }}
                />
              </div>
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>{t.dashboard.quotaRemaining}: {formatCompactNumber(quotaLimit - quotaUsed)}</span>
                <span>{t.dashboard.searchesToday}: {usage?.searchCount ?? 0}</span>
              </div>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <div className="space-y-2">
            <h2 className="text-sm font-semibold text-muted-foreground px-1">
              {t.dashboard.quickActions}
            </h2>
            <div className="grid grid-cols-3 gap-3">
              {quickActions.map(({ to, icon: Icon, label, color }) => (
                <Link key={to} to={to}>
                  <Card className="bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow">
                    <CardContent className="p-3 flex flex-col items-center gap-2 text-center">
                      <div className={`p-2.5 rounded-xl ${color}`}>
                        <Icon className="h-5 w-5" />
                      </div>
                      <span className="text-xs font-medium leading-tight">{label}</span>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          </div>

          {/* Saved Items Count */}
          <div className="space-y-2">
            <h2 className="text-sm font-semibold text-muted-foreground px-1 flex items-center gap-1.5">
              <Bookmark className="h-4 w-4" />
              {t.common.save}
            </h2>
            <div className="grid grid-cols-3 gap-3">
              {savedCounts.map(({ label, count }) => (
                <Card key={label} className="bg-white rounded-xl shadow-sm">
                  <CardContent className="p-3 text-center">
                    <div className="text-2xl font-bold">{formatCompactNumber(count)}</div>
                    <div className="text-[10px] text-muted-foreground leading-tight mt-1">{label}</div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* Recent Searches */}
          <div className="space-y-2">
            <div className="flex items-center justify-between px-1">
              <h2 className="text-sm font-semibold text-muted-foreground flex items-center gap-1.5">
                <History className="h-4 w-4" />
                {t.dashboard.recentSearches}
              </h2>
              <Link to="/keywords">
                <Button variant="ghost" size="sm" className="h-7 text-xs">
                  {t.common.search}
                  <ChevronRight className="h-3 w-3" />
                </Button>
              </Link>
            </div>
            <Card className="bg-white rounded-xl shadow-sm">
              <CardContent className="p-0">
                {!searchHistory || searchHistory.length === 0 ? (
                  <div className="p-6 text-center text-sm text-muted-foreground">
                    {t.dashboard.noRecentSearches}
                  </div>
                ) : (
                  <div className="divide-y divide-gray-100">
                    {searchHistory.map((entry) => (
                      <Link
                        key={entry.id}
                        to="/keywords"
                        className="flex items-center justify-between p-3 hover:bg-gray-50 transition-colors"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="p-1.5 rounded-lg bg-gray-100">
                            <Search className="h-3.5 w-3.5 text-gray-500" />
                          </div>
                          <div className="min-w-0">
                            <div className="text-sm font-medium truncate">{entry.query}</div>
                            <div className="text-xs text-muted-foreground">
                              {entry.results_count} · {entry.search_type}
                            </div>
                          </div>
                        </div>
                        <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
                      </Link>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* API Key Status */}
          <Link to="/settings/api-key">
            <Card className="bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow">
              <CardContent className="p-4 flex items-center gap-3">
                <div className="p-2 rounded-lg bg-green-50">
                  <KeyRound className="h-5 w-5 text-green-600" />
                </div>
                <div className="flex-1">
                  <div className="text-sm font-semibold">{t.apiKey.title}</div>
                  <div className="text-xs text-muted-foreground">{t.apiKey.subtitle}</div>
                </div>
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
              </CardContent>
            </Card>
          </Link>
        </div>
      </div>
    </PageTransition>
  )
}
