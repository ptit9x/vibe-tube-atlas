import { useState } from 'react'
import { PageTransition } from '@/components/shared'
import PageHeader from '@/components/PageHeader'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { useI18n } from '@/lib/i18n'
import { useSavedKeywords, useDeleteKeyword } from '@/hooks/useKeywords'
import { useSavedVideos, useDeleteVideo } from '@/hooks/useVideos'
import { useSavedChannels, useDeleteChannel } from '@/hooks/useChannels'
import { formatCompactNumber, calcOpportunityScore } from '@/lib/youtube'
import { toast } from 'sonner'
import { Trash2, Bookmark, Eye, ThumbsUp, Users, Video as VideoIcon } from 'lucide-react'
import type { CompetitionLevel } from '@/types'

type TabKey = 'keywords' | 'videos' | 'channels'

const competitionColor: Record<CompetitionLevel, string> = {
  low: 'bg-green-100 text-green-700 border-green-200',
  medium: 'bg-amber-100 text-amber-700 border-amber-200',
  high: 'bg-red-100 text-red-700 border-red-200',
}

export default function SavedItems() {
  const { t } = useI18n()
  const [activeTab, setActiveTab] = useState<TabKey>('keywords')

  const { data: savedKeywords, isLoading: loadingKeywords } = useSavedKeywords()
  const { data: savedVideos, isLoading: loadingVideos } = useSavedVideos()
  const { data: savedChannels, isLoading: loadingChannels } = useSavedChannels()
  const deleteKeyword = useDeleteKeyword()
  const deleteVideo = useDeleteVideo()
  const deleteChannel = useDeleteChannel()

  const tabs: { key: TabKey; label: string; count: number }[] = [
    { key: 'keywords', label: t.savedItems.keywords, count: savedKeywords?.length ?? 0 },
    { key: 'videos', label: t.savedItems.videos, count: savedVideos?.length ?? 0 },
    { key: 'channels', label: t.savedItems.channels, count: savedChannels?.length ?? 0 },
  ]

  return (
    <PageTransition>
      <div className="min-h-screen bg-gray-50 pb-20">
        <PageHeader>
          <h1 className="text-xl font-bold text-white">{t.savedItems.title}</h1>
        </PageHeader>

        <div className="px-4 mt-4 space-y-4">
          {/* Tabs */}
          <div className="flex gap-2 bg-white rounded-xl p-1 shadow-sm">
            {tabs.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  activeTab === tab.key
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:bg-gray-100'
                }`}
              >
                {tab.label}
                <span className="ml-1.5 text-xs opacity-80">({tab.count})</span>
              </button>
            ))}
          </div>

          {/* Keywords tab */}
          {activeTab === 'keywords' && (
            <div className="space-y-3">
              {loadingKeywords && (
                <p className="text-center text-sm text-muted-foreground py-8">{t.common.loading}</p>
              )}
              {!loadingKeywords && savedKeywords && savedKeywords.length === 0 && (
                <EmptyState message={t.savedItems.empty} />
              )}
              {savedKeywords?.map((item) => {
                const score = calcOpportunityScore(item.metrics)
                return (
                  <Card key={item.id} className="bg-white rounded-xl shadow-sm">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0 flex-1">
                          <h3 className="text-sm font-semibold truncate">{item.keyword}</h3>
                          <div className="flex flex-wrap items-center gap-2 mt-2">
                            <Badge
                              variant="outline"
                              className={competitionColor[item.metrics.competition]}
                            >
                              {t.keywordExplorer.competition}:{' '}
                              {t.keywordExplorer.competitionLevels[item.metrics.competition]}
                            </Badge>
                            <Badge variant="outline" className="bg-blue-50 text-blue-700">
                              {t.keywordExplorer.engagementRate}: {item.metrics.engagementRate}%
                            </Badge>
                          </div>
                          <div className="mt-2 text-xs text-muted-foreground">
                            <span className="font-medium text-foreground">{score}</span>{' '}
                            {t.savedItems.score}
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="shrink-0 text-muted-foreground hover:text-red-600"
                          disabled={deleteKeyword.isPending}
                          onClick={() =>
                            deleteKeyword.mutate(item.id, {
                              onSuccess: () => toast.success(t.common.success),
                              onError: () => toast.error(t.common.error),
                            })
                          }
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          )}

          {/* Videos tab */}
          {activeTab === 'videos' && (
            <div className="space-y-3">
              {loadingVideos && (
                <p className="text-center text-sm text-muted-foreground py-8">{t.common.loading}</p>
              )}
              {!loadingVideos && savedVideos && savedVideos.length === 0 && (
                <EmptyState message={t.savedItems.empty} />
              )}
              {savedVideos?.map((video) => (
                <Card key={video.id} className="bg-white rounded-xl shadow-sm overflow-hidden">
                  <CardContent className="p-3">
                    <div className="flex gap-3">
                      <a
                        href={`https://www.youtube.com/watch?v=${video.video_id}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="shrink-0 cursor-pointer"
                      >
                        {video.thumbnail_url ? (
                          <img
                            src={video.thumbnail_url}
                            alt={video.title}
                            className="w-28 h-16 rounded-lg object-cover transition-opacity hover:opacity-80"
                            loading="lazy"
                          />
                        ) : (
                          <div className="w-28 h-16 rounded-lg bg-gray-100 flex items-center justify-center">
                            <VideoIcon className="h-6 w-6 text-gray-400" />
                          </div>
                        )}
                      </a>
                      <a
                        href={`https://www.youtube.com/watch?v=${video.video_id}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex-1 min-w-0 cursor-pointer"
                      >
                        <h3 className="text-sm font-medium line-clamp-2">{video.title}</h3>
                        <p className="text-xs text-muted-foreground mt-0.5">{video.channel_title}</p>
                        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1.5 text-xs text-muted-foreground">
                          {video.view_count != null && (
                            <span className="flex items-center gap-1">
                              <Eye className="h-3 w-3" />
                              {formatCompactNumber(video.view_count)}
                            </span>
                          )}
                          {video.like_count != null && (
                            <span className="flex items-center gap-1">
                              <ThumbsUp className="h-3 w-3" />
                              {formatCompactNumber(video.like_count)}
                            </span>
                          )}
                        </div>
                      </a>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="shrink-0 self-start text-muted-foreground hover:text-red-600"
                        disabled={deleteVideo.isPending}
                        onClick={() =>
                          deleteVideo.mutate(video.id, {
                            onSuccess: () => toast.success(t.common.success),
                            onError: () => toast.error(t.common.error),
                          })
                        }
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {/* Channels tab */}
          {activeTab === 'channels' && (
            <div className="space-y-3">
              {loadingChannels && (
                <p className="text-center text-sm text-muted-foreground py-8">{t.common.loading}</p>
              )}
              {!loadingChannels && savedChannels && savedChannels.length === 0 && (
                <EmptyState message={t.savedItems.empty} />
              )}
              {savedChannels?.map((channel) => (
                <Card key={channel.id} className="bg-white rounded-xl shadow-sm">
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      {channel.thumbnail_url ? (
                        <img
                          src={channel.thumbnail_url}
                          alt={channel.title}
                          className="w-14 h-14 rounded-full object-cover shrink-0"
                          loading="lazy"
                        />
                      ) : (
                        <div className="w-14 h-14 rounded-full bg-gray-100 flex items-center justify-center shrink-0">
                          <Users className="h-6 w-6 text-gray-400" />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <h3 className="text-sm font-semibold truncate">{channel.title}</h3>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="shrink-0 text-muted-foreground hover:text-red-600"
                            disabled={deleteChannel.isPending}
                            onClick={() =>
                              deleteChannel.mutate(channel.id, {
                                onSuccess: () => toast.success(t.common.success),
                                onError: () => toast.error(t.common.error),
                              })
                            }
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                        {channel.description && (
                          <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                            {channel.description}
                          </p>
                        )}
                        <div className="flex flex-wrap items-center gap-3 mt-2 text-xs text-muted-foreground">
                          {channel.subscriber_count != null && (
                            <span className="flex items-center gap-1">
                              <Users className="h-3 w-3" />
                              {formatCompactNumber(channel.subscriber_count)}
                            </span>
                          )}
                          {channel.video_count != null && (
                            <span className="flex items-center gap-1">
                              <VideoIcon className="h-3 w-3" />
                              {formatCompactNumber(channel.video_count)}
                            </span>
                          )}
                          {channel.view_count != null && (
                            <span className="flex items-center gap-1">
                              <Eye className="h-3 w-3" />
                              {formatCompactNumber(channel.view_count)}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </PageTransition>
  )
}

function EmptyState({ message }: { message: string }) {
  return (
    <Card className="bg-white rounded-xl shadow-sm">
      <CardContent className="p-8 text-center text-muted-foreground">
        <Bookmark className="h-10 w-10 mx-auto mb-3 opacity-30" />
        <p className="text-sm">{message}</p>
      </CardContent>
    </Card>
  )
}
