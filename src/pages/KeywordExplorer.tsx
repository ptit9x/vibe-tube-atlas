import { useState, useEffect, useCallback } from 'react'
import { useSearchParams } from 'react-router-dom'
import { PageTransition } from '@/components/shared'
import PageHeader from '@/components/PageHeader'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { useI18n } from '@/lib/i18n'
import { useAnalyzeKeyword, useSaveKeyword, useSavedKeywords } from '@/hooks/useKeywords'
import {
  getSuggestions,
  getRelatedKeywords,
  getQuestionKeywords,
  formatCompactNumber,
  parseISODuration,
} from '@/lib/youtube'
import { exportKeywordsCSV } from '@/lib/csv'
import type { AnalyzeKeywordParams, CompetitionLevel, DifficultyLevel } from '@/types'
import { toast } from 'sonner'
import { Search, Bookmark, TrendingUp, Eye, ThumbsUp, Users, Flame, HelpCircle, Sparkles, Loader2, Download } from 'lucide-react'

export default function KeywordExplorer() {
  const { t, language: lang } = useI18n()
  const [searchParams, setSearchParams] = useSearchParams()
  const [input, setInput] = useState('')
  const [params, setParams] = useState<AnalyzeKeywordParams | null>(null)
  const [suggestions, setSuggestions] = useState<string[]>([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [relatedKeywords, setRelatedKeywords] = useState<string[]>([])
  const [questionKeywords, setQuestionKeywords] = useState<string[]>([])

  // Honor ?q= deep-link from SearchHistory — run once on mount.
  useEffect(() => {
    const q = searchParams.get('q')
    if (q) {
      setInput(q)
      setParams({ keyword: q })
      searchParams.delete('q')
      setSearchParams(searchParams, { replace: true })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const { data: metrics, isLoading, error } = useAnalyzeKeyword(params)
  const { data: savedKeywords } = useSavedKeywords()
  const saveMutation = useSaveKeyword()

  const isSaved = savedKeywords?.some(
    (k) => k.keyword.toLowerCase() === params?.keyword?.toLowerCase(),
  )

  // Debounced autocomplete
  useEffect(() => {
    if (!input.trim() || input === params?.keyword) return
    const timer = setTimeout(async () => {
      const result = await getSuggestions(input)
      setSuggestions(result.slice(0, 8))
    }, 300)
    return () => clearTimeout(timer)
  }, [input, params?.keyword])

  // Fetch related keywords when a search completes (free, 0 quota)
  useEffect(() => {
    if (!params?.keyword) {
      setRelatedKeywords([])
      setQuestionKeywords([])
      return
    }
    getRelatedKeywords(params.keyword).then(setRelatedKeywords).catch(() => setRelatedKeywords([]))
    getQuestionKeywords(params.keyword, lang).then(setQuestionKeywords).catch(() => setQuestionKeywords([]))
  }, [params?.keyword, lang])

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault()
      const keyword = input.trim()
      if (!keyword) return
      setParams({ keyword })
      setShowSuggestions(false)
    },
    [input],
  )

  const handleSuggestionClick = (suggestion: string) => {
    setInput(suggestion)
    setParams({ keyword: suggestion })
    setShowSuggestions(false)
  }

  const handleRelatedClick = (kw: string) => {
    setInput(kw)
    setParams({ keyword: kw })
  }

  const handleSave = () => {
    if (!metrics) return
    saveMutation.mutate(
      { keyword: metrics.keyword, metrics },
      {
        onSuccess: () => toast.success(t.keywordExplorer.saveSuccess),
        onError: () => toast.error(t.common.error),
      },
    )
  }

  const competitionColor: Record<CompetitionLevel, string> = {
    low: 'bg-green-100 text-green-700 border-green-200',
    medium: 'bg-amber-100 text-amber-700 border-amber-200',
    high: 'bg-red-100 text-red-700 border-red-200',
  }

  const engagementColor: Record<string, string> = {
    low: 'bg-gray-100 text-gray-700',
    medium: 'bg-blue-100 text-blue-700',
    high: 'bg-purple-100 text-purple-700',
  }

  const difficultyColor: Record<DifficultyLevel, string> = {
    low: 'bg-green-100 text-green-700 border-green-200',
    medium: 'bg-amber-100 text-amber-700 border-amber-200',
    high: 'bg-red-100 text-red-700 border-red-200',
  }

  return (
    <PageTransition>
      <div className="min-h-screen bg-gray-50 pb-20">
        <PageHeader>
          <h1 className="text-xl font-bold text-white">{t.keywordExplorer.title}</h1>
          <p className="text-sm text-white/80">{t.keywordExplorer.subtitle}</p>
        </PageHeader>

        <div className="px-4 mt-4 space-y-4">
          {/* Search */}
          <div className="relative">
            <form onSubmit={handleSubmit} className="flex gap-2">
              <div className="relative flex-1 min-w-0">
                <Input
                  value={input}
                  onChange={(e) => {
                    setInput(e.target.value)
                    setShowSuggestions(true)
                  }}
                  onFocus={() => setShowSuggestions(true)}
                  onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
                  placeholder={t.keywordExplorer.searchPlaceholder}
                  className="pr-10"
                />
                <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              </div>
              <Button type="submit" disabled={isLoading || !input.trim()} className="shrink-0">
                {isLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    {t.keywordExplorer.analyzing}
                  </>
                ) : (
                  t.keywordExplorer.analyze
                )}
              </Button>
            </form>

            {/* Autocomplete */}
            {showSuggestions && suggestions.length > 0 && (
              <Card className="absolute z-50 w-full mt-1 bg-white rounded-xl shadow-lg max-h-64 overflow-y-auto">
                <CardContent className="p-0">
                  {suggestions.map((s) => (
                    <button
                      key={s}
                      type="button"
                      onMouseDown={() => handleSuggestionClick(s)}
                      className="w-full text-left px-4 py-2.5 hover:bg-gray-50 transition-colors text-sm flex items-center gap-2 border-b border-gray-50 last:border-0"
                    >
                      <Search className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                      {s}
                    </button>
                  ))}
                </CardContent>
              </Card>
            )}
          </div>

          {/* Quota warning */}
          {!params && (
            <Card className="bg-amber-50 border-amber-200 rounded-xl">
              <CardContent className="p-3 flex items-start gap-2">
                <Sparkles className="h-4 w-4 text-amber-600 mt-0.5 shrink-0" />
                <p className="text-xs text-amber-800">{t.keywordExplorer.quotaWarning}</p>
              </CardContent>
            </Card>
          )}

          {/* Error */}
          {error && (
            <Card className="bg-red-50 border-red-200 rounded-xl">
              <CardContent className="p-3">
                <p className="text-sm text-red-700">{(error as Error).message}</p>
              </CardContent>
            </Card>
          )}

          {/* Metrics */}
          {metrics && (
            <>
              <Card className="bg-white rounded-xl shadow-sm">
                <CardContent className="p-4 space-y-4">
                  <div className="flex items-center justify-between gap-2">
                    <h2 className="font-bold text-lg min-w-0 flex-1 truncate">{metrics.keyword}</h2>
                    <div className="flex items-center gap-2 shrink-0">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          exportKeywordsCSV([
                            {
                              keyword: metrics.keyword,
                              avgViews: metrics.avgViews,
                              avgLikes: metrics.avgLikes,
                              competition: metrics.competition,
                              engagementRate: metrics.engagementRate,
                            },
                          ])
                        }
                      >
                        <Download className="h-4 w-4" />
                        {t.common.export}
                      </Button>
                      <Button
                        variant={isSaved ? 'secondary' : 'outline'}
                        size="sm"
                        onClick={handleSave}
                        disabled={saveMutation.isPending}
                      >
                        <Bookmark className={`h-4 w-4 ${isSaved ? 'fill-current' : ''}`} />
                        {isSaved ? t.keywordExplorer.saved : t.common.saveKeyword}
                      </Button>
                    </div>
                  </div>

                  {/* Competition + Engagement + Difficulty badges */}
                  <div className="flex flex-wrap gap-2">
                    <Badge variant="outline" className={competitionColor[metrics.competition]}>
                      {t.keywordExplorer.competition}: {t.keywordExplorer.competitionLevels[metrics.competition]}
                    </Badge>
                    <Badge variant="outline" className={engagementColor[metrics.engagementLevel]}>
                      {t.keywordExplorer.engagementRate}: {t.keywordExplorer.engagementLevels[metrics.engagementLevel]}
                    </Badge>
                    {metrics.difficultyLevel && (
                      <Badge variant="outline" className={difficultyColor[metrics.difficultyLevel]}>
                        {t.keywordExtra.difficultyScore}: {t.keywordExtra.difficultyLevels[metrics.difficultyLevel]}
                      </Badge>
                    )}
                  </div>

                  {/* Enhanced metrics grid */}
                  <div className="grid grid-cols-2 gap-3">
                    <MetricCard
                      icon={TrendingUp}
                      label={t.keywordExplorer.resultCount}
                      value={formatCompactNumber(metrics.resultCount)}
                    />
                    <MetricCard
                      icon={Eye}
                      label={t.keywordExplorer.avgViews}
                      value={formatCompactNumber(metrics.avgViews)}
                    />
                    {metrics.avgChannelSubs != null && (
                      <MetricCard
                        icon={Users}
                        label={t.keywordExtra.avgChannelSubs}
                        value={formatCompactNumber(metrics.avgChannelSubs)}
                      />
                    )}
                    {metrics.viewsPerDayTop != null && (
                      <MetricCard
                        icon={Flame}
                        label={t.keywordExtra.viewsPerDay}
                        value={formatCompactNumber(metrics.viewsPerDayTop)}
                      />
                    )}
                  </div>

                  {/* Engagement rate highlight */}
                  <div className="rounded-lg bg-gradient-to-r from-blue-50 to-purple-50 p-3 text-center">
                    <div className="text-xs text-muted-foreground">{t.keywordExplorer.engagementRate}</div>
                    <div className="text-2xl font-bold text-blue-600">{metrics.engagementRate}%</div>
                  </div>
                </CardContent>
              </Card>

              {/* Difficulty Score + Niche Score */}
              {(() => {
                const dScore = metrics.difficultyScore ?? 0
                const dLabel = metrics.difficultyLevel
                  ? t.keywordExtra.difficultyLevels[metrics.difficultyLevel]
                  : ''
                const dBarColor = dScore >= 67 ? 'bg-red-500'
                  : dScore >= 34 ? 'bg-amber-500'
                  : 'bg-green-500'
                const dTextColor = dScore >= 67 ? 'text-red-500'
                  : dScore >= 34 ? 'text-amber-500'
                  : 'text-green-500'

                const nScore = metrics.nicheScore ?? 0
                const nLabel = nScore >= 75 ? t.keywordExtra.nicheExcellent
                  : nScore >= 50 ? t.keywordExtra.nicheGood
                  : nScore >= 30 ? t.keywordExtra.nicheFair
                  : t.keywordExtra.nichePoor
                const nBarColor = nScore >= 75 ? 'bg-emerald-500'
                  : nScore >= 50 ? 'bg-blue-500'
                  : nScore >= 30 ? 'bg-amber-500'
                  : 'bg-red-500'
                const nTextColor = nScore >= 75 ? 'text-emerald-500'
                  : nScore >= 50 ? 'text-blue-500'
                  : nScore >= 30 ? 'text-amber-500'
                  : 'text-red-500'

                return (
                  <div className="grid grid-cols-2 gap-3">
                    {/* Difficulty Score */}
                    <div className="rounded-lg bg-gray-50 p-3 text-center">
                      <div className="text-xs text-muted-foreground mb-1">{t.keywordExtra.difficultyScore}</div>
                      <div className={`text-3xl font-bold ${dTextColor}`}>{dScore}<span className="text-sm text-muted-foreground">/100</span></div>
                      <div className={`text-xs font-medium mt-0.5 ${dTextColor}`}>{dLabel}</div>
                      <div className="mt-2 h-2 rounded-full bg-gray-200 overflow-hidden">
                        <div className={`h-full rounded-full transition-all duration-500 ${dBarColor}`} style={{ width: `${dScore}%` }} />
                      </div>
                      <div className="text-[10px] text-muted-foreground mt-1.5">{t.keywordExtra.difficultyHint}</div>
                    </div>

                    {/* Niche Score */}
                    <div className="rounded-lg bg-gray-50 p-3 text-center">
                      <div className="text-xs text-muted-foreground mb-1">{t.keywordExtra.nicheScore}</div>
                      <div className={`text-3xl font-bold ${nTextColor}`}>{nScore}<span className="text-sm text-muted-foreground">/100</span></div>
                      <div className={`text-xs font-medium mt-0.5 ${nTextColor}`}>{nLabel}</div>
                      <div className="mt-2 h-2 rounded-full bg-gray-200 overflow-hidden">
                        <div className={`h-full rounded-full transition-all duration-500 ${nBarColor}`} style={{ width: `${nScore}%` }} />
                      </div>
                      <div className="text-[10px] text-muted-foreground mt-1.5">{t.keywordExtra.nicheHint}</div>
                    </div>
                  </div>
                )
              })()}

              {/* Views Distribution Chart */}
              {metrics.topVideos.length > 1 && (
                <ViewsDistribution videos={metrics.topVideos.slice(0, 10)} />
              )}

              {/* Related Keywords */}
              {relatedKeywords.length > 0 && (
                <div className="space-y-2">
                  <h3 className="text-sm font-semibold text-muted-foreground px-1">{t.keywordExtra.relatedKeywords}</h3>
                  <div className="flex flex-wrap gap-2">
                    {relatedKeywords.map((kw) => (
                      <button
                        key={kw}
                        onClick={() => handleRelatedClick(kw)}
                        className="px-3 py-1.5 rounded-full bg-red-50 hover:bg-red-100 text-red-700 text-xs font-medium transition-colors border border-red-100"
                      >
                        {kw}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Question Keywords (Phase 1) */}
              {questionKeywords.length > 0 && (
                <div className="space-y-2">
                  <h3 className="text-sm font-semibold text-muted-foreground px-1 flex items-center gap-1.5">
                    <HelpCircle className="h-3.5 w-3.5" />
                    {t.keywordExtra.questionKeywords}
                  </h3>
                  <div className="space-y-1.5">
                    {questionKeywords.map((kw) => (
                      <button
                        key={kw}
                        onClick={() => handleRelatedClick(kw)}
                        className="w-full text-left px-3 py-2 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-medium transition-colors border border-blue-100 flex items-center gap-2"
                      >
                        <HelpCircle className="h-3 w-3 shrink-0 opacity-60" />
                        <span className="truncate">{kw}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Top Videos */}
              {metrics.topVideos.length > 0 && (
                <div className="space-y-2">
                  <h2 className="text-sm font-semibold text-muted-foreground px-1">
                    {t.keywordExplorer.topVideos}
                  </h2>
                  <div className="space-y-3">
                    {metrics.topVideos.slice(0, 10).map((video) => (
                      <Card key={video.id} className="bg-white rounded-xl shadow-sm overflow-hidden">
                        <div className="flex gap-3 p-3">
                          <a
                            href={`https://www.youtube.com/watch?v=${video.id}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="relative w-28 shrink-0 cursor-pointer"
                          >
                            <img
                              src={video.thumbnails?.medium?.url ?? video.thumbnails?.default?.url}
                              alt={video.title}
                              className="w-28 h-16 rounded-lg object-cover transition-opacity hover:opacity-80"
                              loading="lazy"
                            />
                            {video.duration && (
                              <span className="absolute bottom-1 right-1 bg-black/80 text-white text-[10px] px-1 rounded">
                                {parseISODuration(video.duration)}
                              </span>
                            )}
                          </a>
                          <div className="flex-1 min-w-0">
                            <h3 className="text-sm font-medium line-clamp-2">{video.title}</h3>
                            <p className="text-xs text-muted-foreground mt-1">{video.channelTitle}</p>
                            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1.5 text-xs text-muted-foreground">
                              {video.viewCount != null && (
                                <span className="flex items-center gap-1">
                                  <Eye className="h-3 w-3" />
                                  {formatCompactNumber(video.viewCount)}
                                </span>
                              )}
                              {video.likeCount != null && (
                                <span className="flex items-center gap-1">
                                  <ThumbsUp className="h-3 w-3" />
                                  {formatCompactNumber(video.likeCount)}
                                </span>
                              )}
                            </div>
                            {video.tags && video.tags.length > 0 && (
                              <div className="flex flex-wrap gap-1 mt-1.5 line-clamp-1">
                                {video.tags.slice(0, 5).map((tag) => (
                                  <span
                                    key={tag}
                                    className="text-[10px] px-2 py-0.5 rounded-full bg-gray-100 text-gray-500"
                                  >
                                    {tag}
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      </Card>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}

          {/* Empty state */}
          {!metrics && !isLoading && !error && (
            <Card className="bg-white rounded-xl shadow-sm">
              <CardContent className="p-8 text-center text-muted-foreground">
                <Search className="h-10 w-10 mx-auto mb-3 opacity-30" />
                <p className="text-sm">{t.keywordExplorer.searchPlaceholder}</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </PageTransition>
  )
}

function MetricCard({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ElementType
  label: string
  value: string
}) {
  return (
    <div className="rounded-lg bg-gray-50 p-3">
      <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-1">
        <Icon className="h-3.5 w-3.5" />
        {label}
      </div>
      <div className="text-lg font-bold">{value}</div>
    </div>
  )
}

function ViewsDistribution({ videos }: { videos: import('@/types').YouTubeVideo[] }) {
  const { t } = useI18n()
  const maxViews = Math.max(...videos.map(v => v.viewCount ?? 0), 1)

  return (
    <div className="rounded-lg bg-gray-50 p-4 space-y-2">
      <h3 className="text-sm font-semibold text-muted-foreground">{t.keywordExtra.viewsDistribution}</h3>
      <div className="space-y-1.5">
        {videos.map((v, i) => {
          const views = v.viewCount ?? 0
          const pct = (views / maxViews) * 100
          // Gradient from red (top) to lighter (bottom)
          const opacity = 1 - (i / videos.length) * 0.6
          return (
            <div key={v.id} className="flex items-center gap-2">
              <div className="w-5 text-[10px] font-medium text-muted-foreground text-right shrink-0">{i + 1}</div>
              <div className="flex-1 min-w-0">
                <div className="h-5 rounded bg-gray-200 overflow-hidden">
                  <div
                    className="h-full rounded transition-all duration-500 flex items-center justify-end pr-1.5"
                    style={{
                      width: `${Math.max(pct, 3)}%`,
                      backgroundColor: `rgb(239, 68, 68, ${opacity})`,
                    }}
                  >
                    <span className="text-[9px] font-medium text-white whitespace-nowrap">{formatCompactNumber(views)}</span>
                  </div>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
