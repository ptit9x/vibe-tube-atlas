import { useState, useEffect, useCallback } from 'react'
import { PageTransition } from '@/components/shared'
import PageHeader from '@/components/PageHeader'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import { Avatar } from '@/components/shared'
import { useI18n } from '@/lib/i18n'
import { useChannelSearch, useSavedChannels, useSaveChannel, useDeleteChannel } from '@/hooks/useChannels'
import { getSuggestions, formatCompactNumber } from '@/lib/youtube'
import { exportChannelsCSV } from '@/lib/csv'
import type { YouTubeChannel } from '@/types'
import { toast } from 'sonner'
import { Search, Bookmark, Users, Video, Eye, Loader2, Download } from 'lucide-react'

export default function ChannelAnalyzer() {
  const { t } = useI18n()
  const [input, setInput] = useState('')
  const [keyword, setKeyword] = useState('')
  const [suggestions, setSuggestions] = useState<string[]>([])
  const [showSuggestions, setShowSuggestions] = useState(false)

  const { data: channels, isLoading, error } = useChannelSearch(keyword || null)
  const { data: savedChannels } = useSavedChannels()
  const saveMutation = useSaveChannel()
  const deleteMutation = useDeleteChannel()

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

  const isChannelSaved = (channelId: string) =>
    savedChannels?.some((c) => c.channel_id === channelId) ?? false

  const handleToggleSave = (channel: YouTubeChannel) => {
    const saved = isChannelSaved(channel.id)
    if (saved) {
      const entry = savedChannels!.find((c) => c.channel_id === channel.id)
      if (entry) {
        deleteMutation.mutate(entry.id, {
          onSuccess: () => toast.success(t.channelAnalyzer.channelUnsaved),
          onError: () => toast.error(t.common.error),
        })
      }
    } else {
      saveMutation.mutate(
        {
          channel_id: channel.id,
          title: channel.title,
          description: channel.description,
          thumbnail_url: channel.thumbnails?.medium?.url ?? channel.thumbnails?.default?.url,
          subscriber_count: channel.subscriberCount,
          video_count: channel.videoCount,
          view_count: channel.viewCount,
        },
        {
          onSuccess: () => toast.success(t.channelAnalyzer.channelSaved),
          onError: () => toast.error(t.common.error),
        },
      )
    }
  }

  return (
    <PageTransition>
      <div className="min-h-screen bg-gray-50 pb-20">
        <PageHeader>
          <h1 className="text-xl font-bold text-white">{t.channelAnalyzer.title}</h1>
          <p className="text-sm text-white/80">{t.channelAnalyzer.subtitle}</p>
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
                  placeholder={t.channelAnalyzer.searchPlaceholder}
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
          {channels && channels.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between px-1">
                <div className="text-sm text-muted-foreground">
                  {channels.length} {t.videoAnalyzer.results}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    exportChannelsCSV(
                      channels.map((c) => ({
                        id: c.id,
                        title: c.title,
                        subscriberCount: c.subscriberCount ?? 0,
                        videoCount: c.videoCount ?? 0,
                        viewCount: c.viewCount ?? 0,
                      })),
                    )
                  }
                >
                  <Download className="h-4 w-4" />
                  {t.common.export}
                </Button>
              </div>
              {channels.map((channel) => {
                const saved = isChannelSaved(channel.id)
                return (
                  <Card key={channel.id} className="bg-white rounded-xl shadow-sm">
                    <CardContent className="p-4">
                      <div className="flex items-start gap-3">
                        <Avatar
                          src={channel.thumbnails?.medium?.url ?? channel.thumbnails?.default?.url}
                          name={channel.title}
                          className="w-14 h-14"
                        />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <div className="min-w-0">
                              <h3 className="text-sm font-semibold truncate">{channel.title}</h3>
                              {channel.customUrl && (
                                <p className="text-xs text-muted-foreground">{channel.customUrl}</p>
                              )}
                            </div>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="shrink-0"
                              onClick={() => handleToggleSave(channel)}
                              disabled={saveMutation.isPending || deleteMutation.isPending}
                            >
                              <Bookmark className={`h-4 w-4 ${saved ? 'fill-current text-blue-600' : ''}`} />
                            </Button>
                          </div>
                          <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                            {channel.description}
                          </p>
                          <div className="flex flex-wrap items-center gap-3 mt-2 text-xs text-muted-foreground">
                            {channel.subscriberCount != null && (
                              <span className="flex items-center gap-1">
                                <Users className="h-3 w-3" />
                                {formatCompactNumber(channel.subscriberCount)} {t.channelAnalyzer.subscribers}
                              </span>
                            )}
                            {channel.videoCount != null && (
                              <span className="flex items-center gap-1">
                                <Video className="h-3 w-3" />
                                {formatCompactNumber(channel.videoCount)} {t.channelAnalyzer.videoCount}
                              </span>
                            )}
                            {channel.viewCount != null && (
                              <span className="flex items-center gap-1">
                                <Eye className="h-3 w-3" />
                                {formatCompactNumber(channel.viewCount)} {t.channelAnalyzer.totalViews}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          )}

          {/* Empty state */}
          {channels && channels.length === 0 && !isLoading && keyword && (
            <Card className="bg-white rounded-xl shadow-sm">
              <CardContent className="p-8 text-center text-muted-foreground">
                <Search className="h-10 w-10 mx-auto mb-3 opacity-30" />
                <p className="text-sm">{t.channelAnalyzer.noResults}</p>
              </CardContent>
            </Card>
          )}

          {/* Initial state */}
          {!keyword && !isLoading && (
            <Card className="bg-white rounded-xl shadow-sm">
              <CardContent className="p-8 text-center text-muted-foreground">
                <Search className="h-10 w-10 mx-auto mb-3 opacity-30" />
                <p className="text-sm">{t.channelAnalyzer.searchPlaceholder}</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </PageTransition>
  )
}
