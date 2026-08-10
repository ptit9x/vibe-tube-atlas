import { useState } from 'react'
import { PageTransition } from '@/components/shared'
import PageHeader from '@/components/PageHeader'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useI18n } from '@/lib/i18n'
import { getTrendingVideos, formatCompactNumber, parseISODuration } from '@/lib/youtube'
import { YOUTUBE_COUNTRIES, YOUTUBE_CATEGORIES } from '@/constants/youtube'
import type { YouTubeVideo } from '@/types'
import { toast } from 'sonner'
import { Flame, Eye, ThumbsUp, Calendar, Loader2 } from 'lucide-react'

export default function Trending() {
  const { t, language } = useI18n()
  const [country, setCountry] = useState('VN')
  const [category, setCategory] = useState<string>('all')
  const [videos, setVideos] = useState<YouTubeVideo[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [hasLoaded, setHasLoaded] = useState(false)

  const handleLoadTrending = async () => {
    setIsLoading(true)
    try {
      const result = await getTrendingVideos(
        country,
        category === 'all' ? undefined : category,
        20,
      )
      setVideos(result)
      setHasLoaded(true)
      if (result.length === 0) {
        toast.info(t.trending.noResults)
      }
    } catch (err) {
      toast.error((err as Error).message || t.common.error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <PageTransition>
      <div className="min-h-screen bg-gray-50 pb-20">
        <PageHeader>
          <h1 className="text-xl font-bold text-white">{t.trending.title}</h1>
          <p className="text-sm text-white/80">{t.trending.subtitle}</p>
        </PageHeader>

        <div className="px-4 -mt-4 space-y-4">
          {/* Filters */}
          <Card className="bg-white rounded-xl shadow-sm">
            <CardContent className="p-4 space-y-3">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground">{t.trending.country}</label>
                <Select value={country} onValueChange={setCountry}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {YOUTUBE_COUNTRIES.map((c) => (
                      <SelectItem key={c.code} value={c.code}>
                        {c.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground">{t.trending.category}</label>
                <Select value={category} onValueChange={setCategory}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{t.common.all}</SelectItem>
                    {YOUTUBE_CATEGORIES.map((cat) => (
                      <SelectItem key={cat.id} value={cat.id}>
                        {language === 'vi' ? cat.labelVi : cat.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <Button className="w-full" onClick={handleLoadTrending} disabled={isLoading}>
                {isLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Flame className="h-4 w-4" />
                )}
                {t.trending.loadTrending}
              </Button>
            </CardContent>
          </Card>

          {/* Loading */}
          {isLoading && (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          )}

          {/* Results */}
          {!isLoading && videos.length > 0 && (
            <div className="space-y-3">
              {videos.map((video) => (
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
                  </div>
                </Card>
              ))}
            </div>
          )}

          {/* Empty state */}
          {!isLoading && hasLoaded && videos.length === 0 && (
            <Card className="bg-white rounded-xl shadow-sm">
              <CardContent className="p-8 text-center text-muted-foreground">
                <Flame className="h-10 w-10 mx-auto mb-3 opacity-30" />
                <p className="text-sm">{t.trending.noResults}</p>
              </CardContent>
            </Card>
          )}

          {/* Initial state */}
          {!isLoading && !hasLoaded && (
            <Card className="bg-white rounded-xl shadow-sm">
              <CardContent className="p-8 text-center text-muted-foreground">
                <Flame className="h-10 w-10 mx-auto mb-3 opacity-30" />
                <p className="text-sm">{t.trending.subtitle}</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </PageTransition>
  )
}
