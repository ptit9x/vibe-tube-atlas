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
import { getSuggestions, getRelatedKeywords, formatCompactNumber, parseISODuration, calcOpportunityScore } from '@/lib/youtube'
import type { AnalyzeKeywordParams, CompetitionLevel } from '@/types'
import { toast } from 'sonner'
import { Search, Bookmark, TrendingUp, Eye, ThumbsUp, MessageCircle, Sparkles, Loader2 } from 'lucide-react'

export default function KeywordExplorer() {
  const { t } = useI18n()
  const [searchParams, setSearchParams] = useSearchParams()
  const [input, setInput] = useState('')
  const [params, setParams] = useState<AnalyzeKeywordParams | null>(null)
  const [suggestions, setSuggestions] = useState<string[]>([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [relatedKeywords, setRelatedKeywords] = useState<string[]>([])

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
      return
    }
    getRelatedKeywords(params.keyword).then(setRelatedKeywords).catch(() => setRelatedKeywords([]))
  }, [params?.keyword])

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
                    <Button
                      variant={isSaved ? 'secondary' : 'outline'}
                      size="sm"
                      onClick={handleSave}
                      disabled={saveMutation.isPending}
                      className="shrink-0"
                    >
                      <Bookmark className={`h-4 w-4 ${isSaved ? 'fill-current' : ''}`} />
                      {isSaved ? t.keywordExplorer.saved : t.common.saveKeyword}
                    </Button>
                  </div>

                  {/* Competition + Engagement badges */}
                  <div className="flex flex-wrap gap-2">
                    <Badge variant="outline" className={competitionColor[metrics.competition]}>
                      {t.keywordExplorer.competition}: {t.keywordExplorer.competitionLevels[metrics.competition]}
                    </Badge>
                    <Badge variant="outline" className={engagementColor[metrics.engagementLevel]}>
                      {t.keywordExplorer.engagementRate}: {t.keywordExplorer.engagementLevels[metrics.engagementLevel]}
                    </Badge>
                  </div>

                  {/* Metrics grid */}
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
                    <MetricCard
                      icon={ThumbsUp}
                      label={t.keywordExplorer.avgLikes}
                      value={formatCompactNumber(metrics.avgLikes)}
                    />
                    <MetricCard
                      icon={MessageCircle}
                      label={t.keywordExplorer.avgComments}
                      value={formatCompactNumber(metrics.avgComments)}
                    />
                  </div>

                  {/* Engagement rate highlight */}
                  <div className="rounded-lg bg-gradient-to-r from-blue-50 to-purple-50 p-3 text-center">
                    <div className="text-xs text-muted-foreground">{t.keywordExplorer.engagementRate}</div>
                    <div className="text-2xl font-bold text-blue-600">{metrics.engagementRate}%</div>
                  </div>
                </CardContent>
              </Card>

              {/* Opportunity Score Gauge */}
              {(() => {
                const score = calcOpportunityScore(metrics)
                const label = score >= 75 ? t.keywordExtra.scoreExcellent
                  : score >= 50 ? t.keywordExtra.scoreGood
                  : score >= 30 ? t.keywordExtra.scoreFair
                  : t.keywordExtra.scorePoor
                const gaugeColor = score >= 75 ? 'text-emerald-500'
                  : score >= 50 ? 'text-blue-500'
                  : score >= 30 ? 'text-amber-500'
                  : 'text-red-500'
                const barColor = score >= 75 ? 'bg-emerald-500'
                  : score >= 50 ? 'bg-blue-500'
                  : score >= 30 ? 'bg-amber-500'
                  : 'bg-red-500'
                return (
                  <div className="rounded-lg bg-gray-50 p-4 text-center">
                    <div className="text-xs text-muted-foreground mb-1">{t.keywordExtra.opportunityScore}</div>
                    <div className={`text-4xl font-bold ${gaugeColor}`}>{score}<span className="text-lg text-muted-foreground">/100</span></div>
                    <div className={`text-xs font-medium mt-0.5 ${gaugeColor}`}>{label}</div>
                    {/* Score bar */}
                    <div className="mt-2 h-2 rounded-full bg-gray-200 overflow-hidden">
                      <div className={`h-full rounded-full transition-all duration-500 ${barColor}`} style={{ width: `${score}%` }} />
                    </div>
                    <div className="text-[10px] text-muted-foreground mt-1.5">{t.keywordExtra.opportunityHint}</div>
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
                          <div className="relative w-28 shrink-0">
                            <img
                              src={video.thumbnails?.medium?.url ?? video.thumbnails?.default?.url}
                              alt={video.title}
                              className="w-28 h-16 rounded-lg object-cover"
                              loading="lazy"
                            />
                            {video.duration && (
                              <span className="absolute bottom-1 right-1 bg-black/80 text-white text-[10px] px-1 rounded">
                                {parseISODuration(video.duration)}
                              </span>
                            )}
                          </div>
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
