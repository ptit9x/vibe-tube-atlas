import { supabase } from './supabase'
import type {
  YouTubeVideo,
  YouTubeChannel,
  KeywordMetrics,
  CompetitionLevel,
  EngagementLevel,
  SearchVideosParams,
  AnalyzeKeywordParams,
} from '@/types'
import { QUOTA_COSTS } from '@/constants/youtube'

// ===== Edge Function Proxy Calls =====

interface ProxyEnvelope<T> {
  data?: T
  totalResults?: number
  error?: string
}

async function callProxyRaw<T>(action: string, params: Record<string, unknown>): Promise<{ data: T; totalResults: number }> {
  // supabase.functions.invoke automatically sends both Authorization (JWT)
  // and apikey headers — required by Supabase Edge Functions
  const { data, error } = await supabase.functions.invoke('youtube-search', {
    body: { action, params },
  })

  if (error) throw error

  const result = data as ProxyEnvelope<T>
  if (result.error) throw new Error(result.error)
  if (!result.data) throw new Error('No data returned from proxy')
  const fallback = Array.isArray(result.data) ? (result.data as unknown[]).length : 0
  return { data: result.data, totalResults: result.totalResults ?? fallback }
}

async function callProxy<T>(action: string, params: Record<string, unknown>): Promise<T> {
  const { data } = await callProxyRaw<T>(action, params)
  return data
}

// ===== Autocomplete (Free, No API Key) =====

export async function getSuggestions(query: string, hl = 'vi', gl = 'VN'): Promise<string[]> {
  if (!query.trim()) return []

  try {
    const { data, error } = await supabase.functions.invoke('youtube-suggest', {
      body: { query: query.trim(), hl, gl },
    })

    if (error || !data?.suggestions) return []
    return data.suggestions as string[]
  } catch {
    // Degrade gracefully — autocomplete is non-critical
    return []
  }
}

// ===== Search Videos =====

export async function searchVideos(params: SearchVideosParams): Promise<{ results: YouTubeVideo[]; totalResults: number }> {
  const { data, totalResults } = await callProxyRaw<YouTubeVideo[]>('search', {
    keyword: params.keyword,
    type: params.type ?? 'video',
    maxResults: params.maxResults ?? 20,
    order: params.order ?? 'relevance',
    publishedAfter: params.publishedAfter,
    regionCode: params.regionCode ?? 'VN',
    relevanceLanguage: params.relevanceLanguage ?? 'vi',
    videoCategoryId: params.videoCategoryId,
  })
  return { results: data, totalResults }
}

// ===== Get Video Statistics (batch up to 50 IDs) =====

export async function getVideoStats(videoIds: string[]): Promise<YouTubeVideo[]> {
  if (videoIds.length === 0) return []
  return callProxy<YouTubeVideo[]>('videos', { ids: videoIds.join(',') })
}

// ===== Trending Videos (chart=mostPopular) =====

export async function getTrendingVideos(
  regionCode = 'VN',
  videoCategoryId?: string,
  maxResults = 20,
): Promise<YouTubeVideo[]> {
  return callProxy<YouTubeVideo[]>('videos', {
    chart: 'mostPopular',
    regionCode,
    videoCategoryId,
    maxResults,
  })
}

// ===== Get Channel Statistics (batch up to 50 IDs) =====

export async function getChannelStats(channelIds: string[]): Promise<YouTubeChannel[]> {
  if (channelIds.length === 0) return []
  return callProxy<YouTubeChannel[]>('channels', { ids: channelIds.join(',') })
}

// ===== Search Channels by Keyword =====
// YouTube Data API has no "search channels by name" endpoint.
// Workaround: search videos → extract unique channelIds → batch fetch channel stats.

export async function searchChannelsByKeyword(
  keyword: string,
  maxResults = 10,
  regionCode = 'VN',
  relevanceLanguage = 'vi',
): Promise<YouTubeChannel[]> {
  // Step 1: Search videos to discover channels
  const { results: videos } = await searchVideos({
    keyword,
    maxResults: Math.min(maxResults * 3, 50),  // over-fetch to find unique channels
    regionCode,
    relevanceLanguage,
  })

  // Step 2: Extract unique channel IDs
  const channelIdSet = new Set<string>()
  for (const v of videos) {
    channelIdSet.add(v.channelId)
  }
  const uniqueChannelIds = Array.from(channelIdSet).slice(0, 50)

  // Step 3: Batch fetch channel stats
  return getChannelStats(uniqueChannelIds)
}

// ===== Keyword Analysis =====

function calcCompetitionLevel(resultCount: number): CompetitionLevel {
  if (resultCount > 100_000) return 'high'
  if (resultCount > 10_000) return 'medium'
  return 'low'
}

function calcEngagementLevel(rate: number): EngagementLevel {
  if (rate > 5) return 'high'
  if (rate > 1.5) return 'medium'
  return 'low'
}

export async function analyzeKeyword(params: AnalyzeKeywordParams): Promise<KeywordMetrics> {
  const maxResults = params.maxResults ?? 20

  // Step 1: Search for videos with this keyword
  const { results: videos, totalResults } = await searchVideos({
    keyword: params.keyword,
    maxResults,
    regionCode: params.regionCode ?? 'VN',
    relevanceLanguage: params.relevanceLanguage ?? 'vi',
    order: 'viewCount',  // Get top videos by views for better metrics
  })

  // Step 2: Get detailed stats for these videos
  const videoIds = videos.map(v => v.id)
  const detailedVideos = await getVideoStats(videoIds)

  // Step 3: Calculate metrics from detailed stats
  const totalViews = detailedVideos.reduce((sum, v) => sum + (v.viewCount ?? 0), 0)
  const totalLikes = detailedVideos.reduce((sum, v) => sum + (v.likeCount ?? 0), 0)
  const totalComments = detailedVideos.reduce((sum, v) => sum + (v.commentCount ?? 0), 0)

  const count = detailedVideos.length || 1
  const avgViews = Math.round(totalViews / count)
  const avgLikes = Math.round(totalLikes / count)
  const avgComments = Math.round(totalComments / count)
  const engagementRate = totalViews > 0
    ? Number(((totalLikes + totalComments) / totalViews * 100).toFixed(2))
    : 0

  return {
    keyword: params.keyword,
    resultCount: totalResults,
    competition: calcCompetitionLevel(totalResults),
    avgViews,
    avgLikes,
    avgComments,
    engagementRate,
    engagementLevel: calcEngagementLevel(engagementRate),
    topVideos: detailedVideos.sort((a, b) => (b.viewCount ?? 0) - (a.viewCount ?? 0)),
    analyzedAt: new Date().toISOString(),
  }
}

// ===== ISO 8601 Duration Parser =====

export function parseISODuration(iso: string): string {
  const match = iso?.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/)
  if (!match) return '0:00'
  const hours = parseInt(match[1] || '0', 10)
  const minutes = parseInt(match[2] || '0', 10)
  const seconds = parseInt(match[3] || '0', 10)
  if (hours > 0) {
    return `${hours}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
  }
  return `${minutes}:${String(seconds).padStart(2, '0')}`
}

// ===== Number Formatting =====

export function formatCompactNumber(n: number): string {
  if (n >= 1_000_000_000) return `${(n / 1_000_000_000).toFixed(1)}B`
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`
  return String(n)
}

// ===== Quota Estimate =====

export function estimateQuotaCost(actions: { search?: number; videos?: number; channels?: number }): number {
  return (actions.search ?? 0) * QUOTA_COSTS.search
    + (actions.videos ?? 0) * QUOTA_COSTS.videos
    + (actions.channels ?? 0) * QUOTA_COSTS.channels
}
