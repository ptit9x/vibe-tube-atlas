import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { PageTransition } from '@/components/shared'
import PageHeader from '@/components/PageHeader'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { useI18n } from '@/lib/i18n'
import {
  useScanSettings,
  useUpdateScanSettings,
  useDiscoveredKeywords,
  useSaveDiscovered,
  useDeleteDiscovered,
} from '@/hooks/useNicheRadar'
import { exportKeywordsCSV } from '@/lib/csv'
import { formatCompactNumber } from '@/lib/youtube'
import { formatDistanceToNow } from '@/lib/dateUtils'
import { MARKETS, MARKET_MAP, MAX_MARKETS } from '@shared/markets'
import { INDUSTRIES, CATEGORIES } from '@shared/taxonomy'
import type { ScanSettings } from '@/types'
import { toast } from 'sonner'
import {
  Radar,
  Bookmark,
  Download,
  Search,
  TrendingUp,
  Globe,
  Trash2,
  ChevronDown,
} from 'lucide-react'

type SortMode = 'niche' | 'rpm' | 'revenue'
type PeriodKey = 'today' | 'last7' | 'last30'

const PERIOD_DAYS: Record<PeriodKey, number> = { today: 1, last7: 7, last30: 30 }

function nicheColor(score: number): string {
  if (score >= 75) return 'bg-emerald-100 text-emerald-700 border-emerald-200'
  if (score >= 50) return 'bg-blue-100 text-blue-700 border-blue-200'
  if (score >= 30) return 'bg-amber-100 text-amber-700 border-amber-200'
  return 'bg-red-100 text-red-700 border-red-200'
}

function difficultyColor(score: number): string {
  if (score >= 67) return 'bg-red-100 text-red-700 border-red-200'
  if (score >= 34) return 'bg-amber-100 text-amber-700 border-amber-200'
  return 'bg-green-100 text-green-700 border-green-200'
}

function formatUsd(n: number): string {
  return `$${n.toFixed(2)}`
}

// ===== Scan settings card (own form state, remounts when server data loads) =====

function ScanSettingsCard({ settings }: { settings: ScanSettings | null }) {
  const { t, language } = useI18n()
  const updateSettings = useUpdateScanSettings()

  const [enabled, setEnabled] = useState(settings?.enabled ?? true)
  const [selectedIndustries, setSelectedIndustries] = useState<string[]>(
    settings?.industries ?? [],
  )
  const [selectedMarkets, setSelectedMarkets] = useState<string[]>(
    settings?.markets?.length ? settings.markets : ['VN', 'US'],
  )
  const [minScore, setMinScore] = useState(settings?.min_niche_score ?? 30)
  const [budget, setBudget] = useState(settings?.max_keywords_per_run ?? 50)

  const toggleIndustry = (key: string) => {
    setSelectedIndustries((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key],
    )
  }

  const toggleMarket = (key: string) => {
    setSelectedMarkets((prev) => {
      if (prev.includes(key)) return prev.filter((k) => k !== key)
      if (prev.length >= MAX_MARKETS) {
        toast.error(t.nicheRadar.marketMaxHint)
        return prev
      }
      return [...prev, key]
    })
  }

  const handleSave = () => {
    updateSettings.mutate(
      {
        enabled,
        industries: selectedIndustries,
        markets: selectedMarkets,
        minNicheScore: minScore,
        maxKeywordsPerRun: budget,
      },
      {
        onSuccess: () => toast.success(t.common.success),
        onError: () => toast.error(t.common.error),
      },
    )
  }

  const perMarketBudget = Math.max(
    5,
    Math.floor(budget / Math.max(1, selectedMarkets.length)),
  )

  return (
    <Card className="bg-white rounded-xl shadow-sm">
      <CardContent className="p-4 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold flex items-center gap-2">
            <Radar className="h-4 w-4 text-primary" />
            {t.nicheRadar.settings}
          </h2>
          <label className="flex items-center gap-2 text-sm cursor-pointer">
            <span className="text-muted-foreground">{t.nicheRadar.enableScan}</span>
            <input
              type="checkbox"
              checked={enabled}
              onChange={(e) => setEnabled(e.target.checked)}
              className="h-4 w-4 accent-red-500"
            />
          </label>
        </div>

        {/* Markets */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-muted-foreground">
              {t.nicheRadar.markets} ({t.nicheRadar.marketMaxHint})
            </span>
            <span className="text-xs text-muted-foreground">
              ≈{perMarketBudget}/{t.nicheRadar.marketUnit}
            </span>
          </div>
          <div className="flex flex-wrap gap-2">
            {MARKETS.map((m) => {
              const active = selectedMarkets.includes(m.key)
              return (
                <button
                  key={m.key}
                  onClick={() => toggleMarket(m.key)}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                    active
                      ? 'bg-primary text-primary-foreground border-primary'
                      : 'bg-white text-muted-foreground border-gray-200 hover:bg-gray-50'
                  }`}
                  title={`${m.labelEn} — base RPM ~$${m.baseRpm}/1k`}
                >
                  {m.flag} {language === 'vi' ? m.labelVi : m.labelEn}
                </button>
              )
            })}
          </div>
        </div>

        {/* Industries grouped by category */}
        <div>
          <span className="text-xs font-medium text-muted-foreground block mb-2">
            {t.nicheRadar.industries}
            {selectedIndustries.length === 0 && ` (${t.nicheRadar.allIndustries})`}
          </span>
          <div className="space-y-2">
            {CATEGORIES.map((cat) => (
              <div key={cat.key}>
                <div className="flex items-center gap-2 mb-1">
                  <Globe className="h-3 w-3 text-muted-foreground" />
                  <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">
                    {language === 'vi' ? cat.labelVi : cat.labelEn}
                  </span>
                  <span className="text-[11px] text-emerald-600 font-medium">
                    ×{cat.rpmMultiplier}
                  </span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {INDUSTRIES.filter((i) => i.category === cat.key).map((ind) => {
                    const active = selectedIndustries.includes(ind.key)
                    return (
                      <button
                        key={ind.key}
                        onClick={() => toggleIndustry(ind.key)}
                        className={`px-2.5 py-1 rounded-full text-xs border transition-colors ${
                          active
                            ? 'bg-primary text-primary-foreground border-primary'
                            : 'bg-white text-muted-foreground border-gray-200 hover:bg-gray-50'
                        }`}
                      >
                        {language === 'vi' ? ind.labelVi : ind.labelEn}
                      </button>
                    )
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Score + budget */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs font-medium text-muted-foreground block mb-1">
              {t.nicheRadar.minScore}:{' '}
              <span className="text-foreground font-semibold">{minScore}</span>
            </label>
            <input
              type="range"
              min={0}
              max={100}
              value={minScore}
              onChange={(e) => setMinScore(Number(e.target.value))}
              className="w-full accent-red-500"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground block mb-1">
              {t.nicheRadar.dailyBudget}
            </label>
            <input
              type="number"
              min={10}
              max={80}
              value={budget}
              onChange={(e) =>
                setBudget(Math.min(80, Math.max(10, Number(e.target.value) || 10)))
              }
              className="w-full h-9 px-3 rounded-lg border border-gray-200 text-sm"
            />
          </div>
        </div>

        <Button
          onClick={handleSave}
          disabled={updateSettings.isPending}
          className="w-full"
          size="sm"
        >
          {updateSettings.isPending ? t.common.loading : t.nicheRadar.saveSettings}
        </Button>
      </CardContent>
    </Card>
  )
}

// ===== Main page =====

export default function NicheRadar() {
  const { t, language } = useI18n()
  const navigate = useNavigate()

  const settingsQuery = useScanSettings()
  const saveDiscovered = useSaveDiscovered()
  const deleteDiscovered = useDeleteDiscovered()

  // Filters + sort
  const [filterMarket, setFilterMarket] = useState<string | null>(null)
  const [filterCategory, setFilterCategory] = useState<string | null>(null)
  const [period, setPeriod] = useState<PeriodKey>('last7')
  const [sortMode, setSortMode] = useState<SortMode>('niche')
  const [expanded, setExpanded] = useState<string | null>(null)

  const { data: discovered, isLoading } = useDiscoveredKeywords({
    market: filterMarket,
    industry: null,
    category: filterCategory,
    days: PERIOD_DAYS[period],
  })

  // Sorted rows
  const rows = useMemo(() => {
    if (!discovered) return []
    const sorted = [...discovered]
    if (sortMode === 'rpm') {
      sorted.sort(
        (a, b) => (b.est_rpm ?? 0) - (a.est_rpm ?? 0) || b.niche_score - a.niche_score,
      )
    } else if (sortMode === 'revenue') {
      sorted.sort(
        (a, b) =>
          ((b.est_rpm ?? 0) * (b.avg_views ?? 0)) / 1000 -
          ((a.est_rpm ?? 0) * (a.avg_views ?? 0)) / 1000,
      )
    } else {
      sorted.sort((a, b) => b.niche_score - a.niche_score)
    }
    return sorted
  }, [discovered, sortMode])

  // Recommended markets (RPM × niche score analysis)
  const marketSummary = useMemo(() => {
    if (!discovered?.length) return []
    const byMarket = new Map<
      string,
      { count: number; rpmSum: number; nicheSum: number }
    >()
    for (const r of discovered) {
      const entry = byMarket.get(r.market) ?? { count: 0, rpmSum: 0, nicheSum: 0 }
      entry.count++
      entry.rpmSum += Number(r.est_rpm ?? 0)
      entry.nicheSum += r.niche_score
      byMarket.set(r.market, entry)
    }
    return [...byMarket.entries()]
      .map(([key, v]) => ({
        market: MARKET_MAP[key],
        count: v.count,
        avgRpm: v.rpmSum / v.count,
        avgNiche: v.nicheSum / v.count,
        score: (v.rpmSum / v.count) * (v.nicheSum / v.count),
      }))
      .filter((m) => m.market)
      .sort((a, b) => b.score - a.score)
  }, [discovered])

  const handleExport = () => {
    exportKeywordsCSV(
      rows.map((r) => ({
        keyword: `${r.keyword} (${r.market})`,
        avgViews: Number(r.avg_views ?? 0),
        avgLikes: 0,
        competition:
          r.difficulty_score >= 67 ? 'high' : r.difficulty_score >= 34 ? 'medium' : 'low',
        engagementRate: 0,
      })),
    )
  }

  const industryLabel = (key: string) => {
    const ind = INDUSTRIES.find((i) => i.key === key)
    return ind ? (language === 'vi' ? ind.labelVi : ind.labelEn) : key
  }

  return (
    <PageTransition>
      <div className="min-h-screen bg-gray-50 pb-20">
        <PageHeader>
          <h1 className="text-xl font-bold text-white flex items-center gap-2">
            <Radar className="h-5 w-5" />
            {t.nicheRadar.title}
          </h1>
          <p className="text-sm text-white/80 mt-1">{t.nicheRadar.subtitle}</p>
        </PageHeader>

        <div className="px-4 mt-4 space-y-4">
          {/* Settings (remount with fresh defaults once server data arrives) */}
          {settingsQuery.isLoading ? (
            <Card className="bg-white rounded-xl shadow-sm">
              <CardContent className="p-8 text-center text-sm text-muted-foreground">
                {t.common.loading}
              </CardContent>
            </Card>
          ) : (
            <ScanSettingsCard
              key={settingsQuery.data?.updated_at ?? 'new'}
              settings={settingsQuery.data ?? null}
            />
          )}

          {/* Recommended markets */}
          {marketSummary.length > 0 && (
            <Card className="bg-white rounded-xl shadow-sm">
              <CardContent className="p-4 space-y-3">
                <div>
                  <h2 className="text-sm font-semibold flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-primary" />
                    {t.nicheRadar.recommendedMarkets}
                  </h2>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {t.nicheRadar.recommendedHint}
                  </p>
                </div>
                {marketSummary.map((m, idx) => (
                  <div
                    key={m.market.key}
                    className={`flex items-center justify-between rounded-lg p-2.5 ${
                      idx === 0 ? 'bg-emerald-50 border border-emerald-200' : 'bg-gray-50'
                    }`}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="text-lg">{m.market.flag}</span>
                      <div className="min-w-0">
                        <p className="text-sm font-medium truncate">
                          {language === 'vi' ? m.market.labelVi : m.market.labelEn}
                          {idx === 0 && (
                            <span className="ml-1.5 text-[10px] font-bold text-emerald-700 uppercase">
                              ★ {t.nicheRadar.best}
                            </span>
                          )}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {m.count} KW · {t.nicheRadar.nicheScore} {Math.round(m.avgNiche)}
                        </p>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-sm font-semibold text-emerald-700">
                        {formatUsd(m.avgRpm)}/1k
                      </p>
                      <p className="text-[11px] text-muted-foreground">
                        {t.nicheRadar.estRpm}
                      </p>
                    </div>
                  </div>
                ))}
                <p className="text-[11px] text-muted-foreground">
                  {t.nicheRadar.rpmDisclaimer}
                </p>
              </CardContent>
            </Card>
          )}

          {/* Filters */}
          <div className="space-y-2">
            <div className="flex gap-2">
              <select
                value={filterMarket ?? ''}
                onChange={(e) => setFilterMarket(e.target.value || null)}
                className="flex-1 h-10 rounded-lg border border-gray-200 bg-white px-2 text-sm"
              >
                <option value="">{t.nicheRadar.allMarkets}</option>
                {MARKETS.map((m) => (
                  <option key={m.key} value={m.key}>
                    {m.flag} {language === 'vi' ? m.labelVi : m.labelEn}
                  </option>
                ))}
              </select>
              <select
                value={filterCategory ?? ''}
                onChange={(e) => setFilterCategory(e.target.value || null)}
                className="flex-1 h-10 rounded-lg border border-gray-200 bg-white px-2 text-sm"
              >
                <option value="">{t.nicheRadar.allCategories}</option>
                {CATEGORIES.map((c) => (
                  <option key={c.key} value={c.key}>
                    {language === 'vi' ? c.labelVi : c.labelEn} (×{c.rpmMultiplier})
                  </option>
                ))}
              </select>
            </div>
            <div className="flex gap-2">
              <div className="flex gap-1 bg-white rounded-lg p-1 shadow-sm flex-1">
                {(Object.keys(PERIOD_DAYS) as PeriodKey[]).map((p) => (
                  <button
                    key={p}
                    onClick={() => setPeriod(p)}
                    className={`flex-1 px-2 py-1.5 rounded-md text-xs font-medium transition-colors ${
                      period === p
                        ? 'bg-primary text-primary-foreground'
                        : 'text-muted-foreground hover:bg-gray-100'
                    }`}
                  >
                    {t.nicheRadar[p]}
                  </button>
                ))}
              </div>
              <select
                value={sortMode}
                onChange={(e) => setSortMode(e.target.value as SortMode)}
                className="h-10 rounded-lg border border-gray-200 bg-white px-2 text-sm"
              >
                <option value="niche">{t.nicheRadar.sortNiche}</option>
                <option value="rpm">{t.nicheRadar.sortRpm}</option>
                <option value="revenue">{t.nicheRadar.sortRevenue}</option>
              </select>
            </div>
          </div>

          {/* Results */}
          {isLoading && (
            <p className="text-center text-sm text-muted-foreground py-8">
              {t.common.loading}
            </p>
          )}
          {!isLoading && rows.length === 0 && (
            <Card className="bg-white rounded-xl shadow-sm">
              <CardContent className="p-8 text-center text-muted-foreground">
                <Radar className="h-10 w-10 mx-auto mb-3 opacity-30" />
                <p className="text-sm font-medium">{t.nicheRadar.empty}</p>
                <p className="text-xs mt-1">{t.nicheRadar.emptyHint}</p>
              </CardContent>
            </Card>
          )}

          {rows.length > 0 && (
            <>
              <div className="flex items-center justify-between px-1">
                <span className="text-xs text-muted-foreground">
                  {t.nicheRadar.results}: {rows.length}
                </span>
                <Button variant="outline" size="sm" onClick={handleExport}>
                  <Download className="h-4 w-4 mr-1" />
                  {t.common.export}
                </Button>
              </div>

              <div className="space-y-2">
                {rows.map((r) => {
                  const revenue = ((r.est_rpm ?? 0) * (r.avg_views ?? 0)) / 1000
                  const isOpen = expanded === r.id
                  return (
                    <Card key={r.id} className="bg-white rounded-xl shadow-sm">
                      <CardContent className="p-3.5">
                        <button
                          className="w-full text-left"
                          onClick={() => setExpanded(isOpen ? null : r.id)}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="min-w-0 flex-1">
                              <h3 className="text-sm font-semibold truncate">{r.keyword}</h3>
                              <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
                                <span className="text-xs">
                                  {MARKET_MAP[r.market]?.flag}
                                </span>
                                <Badge
                                  variant="outline"
                                  className={`text-[11px] ${nicheColor(r.niche_score)}`}
                                >
                                  {t.nicheRadar.nicheScore} {r.niche_score}
                                </Badge>
                                <Badge
                                  variant="outline"
                                  className={`text-[11px] ${difficultyColor(r.difficulty_score)}`}
                                >
                                  {t.nicheRadar.difficulty} {r.difficulty_score}
                                </Badge>
                                {r.est_rpm != null && (
                                  <Badge
                                    variant="outline"
                                    className="text-[11px] bg-emerald-50 text-emerald-700 border-emerald-200"
                                  >
                                    {formatUsd(Number(r.est_rpm))}/1k
                                  </Badge>
                                )}
                              </div>
                              <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 mt-1.5 text-[11px] text-muted-foreground">
                                <span className="truncate max-w-[140px]">
                                  {industryLabel(r.industry)}
                                </span>
                                {r.avg_views != null && (
                                  <span>
                                    {t.nicheRadar.avgViews}:{' '}
                                    {formatCompactNumber(Number(r.avg_views))}
                                  </span>
                                )}
                                {revenue > 0 && (
                                  <span className="font-medium text-emerald-700">
                                    {t.nicheRadar.revenuePerVideo}: ~{formatUsd(revenue)}
                                  </span>
                                )}
                                <span>{formatDistanceToNow(new Date(r.discovered_at), t.common)}</span>
                              </div>
                            </div>
                            <ChevronDown
                              className={`h-4 w-4 shrink-0 text-muted-foreground transition-transform ${
                                isOpen ? 'rotate-180' : ''
                              }`}
                            />
                          </div>
                        </button>

                        {isOpen && (
                          <div className="mt-3 pt-3 border-t border-gray-100 space-y-3">
                            {r.sample_videos?.length > 0 && (
                              <div>
                                <p className="text-[11px] font-semibold text-muted-foreground uppercase mb-1.5">
                                  {t.nicheRadar.sampleVideos}
                                </p>
                                <div className="space-y-1">
                                  {r.sample_videos.map((v) => (
                                    <a
                                      key={v.id}
                                      href={`https://www.youtube.com/watch?v=${v.id}`}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="block text-xs text-blue-600 hover:underline truncate"
                                    >
                                      {v.title} · {formatCompactNumber(v.views)}
                                    </a>
                                  ))}
                                </div>
                              </div>
                            )}
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                variant="outline"
                                className="flex-1"
                                onClick={() =>
                                  navigate(
                                    `/keyword-explorer?q=${encodeURIComponent(r.keyword)}`,
                                  )
                                }
                              >
                                <Search className="h-4 w-4 mr-1" />
                                {t.nicheRadar.analyze}
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                className="flex-1"
                                disabled={saveDiscovered.isPending}
                                onClick={() =>
                                  saveDiscovered.mutate(r, {
                                    onSuccess: () => toast.success(t.nicheRadar.saved),
                                    onError: () => toast.error(t.common.error),
                                  })
                                }
                              >
                                <Bookmark className="h-4 w-4 mr-1" />
                                {t.nicheRadar.save}
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                className="text-muted-foreground hover:text-red-600"
                                disabled={deleteDiscovered.isPending}
                                onClick={() =>
                                  deleteDiscovered.mutate(r.id, {
                                    onSuccess: () => toast.success(t.common.success),
                                    onError: () => toast.error(t.common.error),
                                  })
                                }
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  )
                })}
              </div>
            </>
          )}

          <p className="text-[11px] text-center text-muted-foreground pb-2">
            {t.nicheRadar.zeroQuota}
          </p>
        </div>
      </div>
    </PageTransition>
  )
}
