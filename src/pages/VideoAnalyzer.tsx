import { useState, useEffect, useCallback } from 'react'
import { PageTransition } from '@/components/shared'
import PageHeader from '@/components/PageHeader'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useI18n } from '@/lib/i18n'
import { useVideoSearch, useSavedVideos, useSaveVideo, useDeleteVideo, isVideoSaved } from '@/hooks/useVideos'
import { getSuggestions, formatCompactNumber, parseISODuration } from '@/lib/youtube'
import type { SearchVideosParams, YouTubeVideo } from '@/types'
import { toast } from 'sonner'
import { Search, Eye, ThumbsUp, Bookmark, Loader2, Calendar } from 'lucide-react'

type SortOrder = 'date' | 'viewCount' | 'rating' | 'relevance'

export default function VideoAnalyzer() {
  const { t } = useI18n()
  const [input, setInput] = useState('')
  const [keyword, setKeyword] = useState('')
  const [sortOrder, setSortOrder] = useState<SortOrder>('relevance')
  const [suggestions, setSuggestions] = useState<string[]>([])
  const [showSuggestions, setShowSuggestions] = useState(false)

  const params: SearchVideosParams | null = keyword
    ? { keyword, order: sortOrder, type: 'video', maxResults: 20 }
    : null

  const { data: searchResult, isLoading, error } = useVideoSearch(params)
  const videos = searchResult?.results
  const { data: savedVideos } = useSavedVideos()
  const saveMutation = useSaveVideo()
  const deleteMutation = useDeleteVideo()

  // Debounced autocomplete
  useEffect(() => {
    if (!input.trim() || input === keyword) return
    const timer = setTimeout(async () => {
      const result = await getSuggestions(input)
      setSuggestions(result.slice(0, 8))
    }, 300)
    return () => clearTimeout(timer)
  }, [input, keyword])

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault()
      const kw = input.trim()
      if (!kw) return
      setKeyword(kw)
      setShowSuggestions(false)
    },
    [input],
  )

  const handleSuggestionClick = (suggestion: string) => {
    setInput(suggestion)
    setKeyword(suggestion)
    setShowSuggestions(false)
  }

  const handleToggleSave = (video: YouTubeVideo) => {
    const saved = isVideoSaved(savedVideos, video.id)
    if (saved) {
      const entry = savedVideos!.find((v) => v.video_id === video.id)
      if (entry) {
        deleteMutation.mutate(entry.id, {
          onSuccess: () => toast.success(t.videoAnalyzer.videoUnsaved),
          onError: () => toast.error(t.common.error),
        })
      }
    } else {
      saveMutation.mutate(
        {
          video_id: video.id,
          title: video.title,
          channel_title: video.channelTitle,
          thumbnail_url: video.thumbnails?.medium?.url ?? video.thumbnails?.default?.url,
          view_count: video.viewCount,
          like_count: video.likeCount,
          comment_count: video.commentCount,
          published_at: video.publishedAt,
        },
        {
          onSuccess: () => toast.success(t.videoAnalyzer.videoSaved),
          onError: () => toast.error(t.common.error),
        },
      )
    }
  }

  return (
    <PageTransition>
      <div className="min-h-screen bg-gray-50 pb-20">
        <PageHeader>
          <h1 className="text-xl font-bold text-white">{t.videoAnalyzer.title}</h1>
          <p className="text-sm text-white/80">{t.videoAnalyzer.subtitle}</p>
        </PageHeader>

        <div className="px-4 -mt-4 space-y-4">
          {/* Search + Sort */}
          <div className="relative space-y-2">
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
                  placeholder={t.videoAnalyzer.searchPlaceholder}
                  className="pr-10"
                />
                <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              </div>
              <Button type="submit" disabled={isLoading || !input.trim()} className="shrink-0">
                {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : t.common.search}
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

          {/* Sort selector */}
          {keyword && (
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-sm text-muted-foreground shrink-0">{t.videoAnalyzer.sortBy}:</span>
              <Select value={sortOrder} onValueChange={(v) => setSortOrder(v as SortOrder)}>
                <SelectTrigger className="h-9 w-full sm:w-40 text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="date">{t.videoAnalyzer.sortDate}</SelectItem>
                  <SelectItem value="viewCount">{t.videoAnalyzer.sortViews}</SelectItem>
                  <SelectItem value="rating">{t.videoAnalyzer.sortRating}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Error */}
          {error && (
            <Card className="bg-red-50 border-red-200 rounded-xl">
              <CardContent className="p-3">
                <p className="text-sm text-red-700">{(error as Error).message}</p>
              </CardContent>
            </Card>
          )}

          {/* Loading */}
          {isLoading && (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          )}

          {/* Results */}
          {videos && videos.length > 0 && (
            <div className="space-y-3">
              <div className="text-sm text-muted-foreground px-1">
                {videos.length} {t.videoAnalyzer.results}
              </div>
              {videos.map((video) => {
                const saved = isVideoSaved(savedVideos, video.id)
                return (
                  <Card key={video.id} className="bg-white rounded-xl shadow-sm overflow-hidden">
                    <div className="flex gap-3 p-3">
                      <div className="relative w-32 shrink-0">
                        <img
                          src={video.thumbnails?.medium?.url ?? video.thumbnails?.default?.url}
                          alt={video.title}
                          className="w-32 h-20 rounded-lg object-cover"
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
                        <p className="text-xs text-muted-foreground mt-0.5">{video.channelTitle}</p>
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
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {new Date(video.publishedAt).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="shrink-0 self-start"
                        onClick={() => handleToggleSave(video)}
                        disabled={saveMutation.isPending || deleteMutation.isPending}
                      >
                        <Bookmark className={`h-4 w-4 ${saved ? 'fill-current text-blue-600' : ''}`} />
                      </Button>
                    </div>
                  </Card>
                )
              })}
            </div>
          )}

          {/* Empty state */}
          {videos && videos.length === 0 && !isLoading && (
            <Card className="bg-white rounded-xl shadow-sm">
              <CardContent className="p-8 text-center text-muted-foreground">
                <Search className="h-10 w-10 mx-auto mb-3 opacity-30" />
                <p className="text-sm">{t.videoAnalyzer.noResults}</p>
              </CardContent>
            </Card>
          )}

          {/* Initial state */}
          {!keyword && !isLoading && (
            <Card className="bg-white rounded-xl shadow-sm">
              <CardContent className="p-8 text-center text-muted-foreground">
                <Search className="h-10 w-10 mx-auto mb-3 opacity-30" />
                <p className="text-sm">{t.videoAnalyzer.searchPlaceholder}</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </PageTransition>
  )
}
