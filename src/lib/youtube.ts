import { supabase } from './supabase'
import type {
  YouTubeVideo,
  YouTubeChannel,
  KeywordMetrics,
  CompetitionLevel,
  EngagementLevel,
  DifficultyLevel,
  SearchVideosParams,
  AnalyzeKeywordParams,
} from '@/types'
import { QUOTA_COSTS } from '@/constants/youtube'

// Difficulty/Niche scoring lives in the shared module so the daily-scan
// Edge Function and the web app use the exact same formulas.
export { calcDifficultyScore, calcNicheScore } from '@shared/scoring'
import { calcDifficultyScore, calcNicheScore } from '@shared/scoring'

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

// ===== Phase 1: Enhanced Difficulty Score (0-100) =====
// Multi-factor algorithm: combines result count, channel authority (avg subs),
// content freshness (video age), and view momentum (views/day of top video).
// Higher score = harder to rank for this keyword.
// → Implementation moved to supabase/functions/_shared/scoring.ts (shared
//   with the daily-scan Edge Function). Re-exported at the top of this file.

function calcDifficultyLevel(score: number): DifficultyLevel {
  if (score >= 67) return 'high'
  if (score >= 34) return 'medium'
  return 'low'
}

// ===== Phase 1: Niche Opportunity Score (0-100) =====
// Designed for niche keyword discovery: high demand + low difficulty = good niche.
// Combines difficulty (inverted), views/day, and engagement.
// → Implementation moved to supabase/functions/_shared/scoring.ts.

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

  const sortedTopVideos = detailedVideos.sort((a, b) => (b.viewCount ?? 0) - (a.viewCount ?? 0))

  // Step 4: Fetch channel stats for enhanced difficulty score
  const channelIdSet = new Set<string>()
  for (const v of detailedVideos) {
    channelIdSet.add(v.channelId)
  }
  const channelIds = Array.from(channelIdSet).slice(0, 50)
  let channelStats: YouTubeChannel[] = []
  let avgChannelSubs = 0
  try {
    channelStats = await getChannelStats(channelIds)
    const totalSubs = channelStats.reduce((sum, c) => sum + (c.subscriberCount ?? 0), 0)
    avgChannelSubs = channelStats.length > 0 ? Math.round(totalSubs / channelStats.length) : 0
  } catch {
    // Non-critical — difficulty score will use 0 for channel authority
  }

  // Step 5: Calculate video age and momentum (views/day for #1 video)
  const now = Date.now()
  const videoAgesDays = detailedVideos.map(v => {
    if (!v.publishedAt) return 365
    return Math.max(1, (now - new Date(v.publishedAt).getTime()) / (1000 * 60 * 60 * 24))
  })
  const avgVideoAgeDays = Math.round(
    videoAgesDays.reduce((sum, age) => sum + age, 0) / (videoAgesDays.length || 1)
  )

  // Views/day of the top video — best indicator of active demand
  const topVideo = sortedTopVideos[0]
  const topVideoAgeDays = topVideo?.publishedAt
    ? Math.max(1, (now - new Date(topVideo.publishedAt).getTime()) / (1000 * 60 * 60 * 24))
    : 365
  const viewsPerDayTop = topVideo
    ? Math.round((topVideo.viewCount ?? 0) / topVideoAgeDays)
    : 0

  // Step 6: Calculate enhanced scores
  const difficultyScore = calcDifficultyScore(totalResults, avgChannelSubs, avgVideoAgeDays, viewsPerDayTop)
  const difficultyLevel = calcDifficultyLevel(difficultyScore)
  const nicheScore = calcNicheScore(difficultyScore, viewsPerDayTop, engagementRate)

  return {
    keyword: params.keyword,
    resultCount: totalResults,
    competition: calcCompetitionLevel(totalResults),
    avgViews,
    avgLikes,
    avgComments,
    engagementRate,
    engagementLevel: calcEngagementLevel(engagementRate),
    topVideos: sortedTopVideos,
    analyzedAt: new Date().toISOString(),
    avgChannelSubs,
    avgVideoAgeDays,
    viewsPerDayTop,
    difficultyScore,
    difficultyLevel,
    nicheScore,
  }
}

// ===== Opportunity Score =====
// A 0-100 score combining competition (inverted), average views, and engagement.
// Higher = better opportunity (low competition + high views + high engagement).

export function calcOpportunityScore(metrics: KeywordMetrics): number {
  // Competition score: fewer results = better (0-40 points)
  // <1K results = 40, <10K = 30, <50K = 20, <100K = 10, else 5
  let competitionScore: number
  if (metrics.resultCount < 1_000) competitionScore = 40
  else if (metrics.resultCount < 10_000) competitionScore = 30
  else if (metrics.resultCount < 50_000) competitionScore = 20
  else if (metrics.resultCount < 100_000) competitionScore = 10
  else competitionScore = 5

  // Views score: log scale (0-35 points)
  // 1M avg views ≈ 35, 100K ≈ 28, 10K ≈ 21, 1K ≈ 14, 100 ≈ 7
  const viewsScore = metrics.avgViews > 0
    ? Math.min(35, Math.log10(metrics.avgViews + 1) * 5.8)
    : 0

  // Engagement score: direct mapping (0-25 points)
  // >10% = 25, >5% = 20, >2% = 15, >1% = 10, else 5
  let engagementScore: number
  if (metrics.engagementRate > 10) engagementScore = 25
  else if (metrics.engagementRate > 5) engagementScore = 20
  else if (metrics.engagementRate > 2) engagementScore = 15
  else if (metrics.engagementRate > 1) engagementScore = 10
  else engagementScore = 5

  return Math.round(competitionScore + viewsScore + engagementScore)
}

// ===== Related Keywords (Free, No Quota) =====
// Uses YouTube autocomplete suggestions with the keyword as prefix,
// which returns variations and related searches.

export async function getRelatedKeywords(keyword: string, hl = 'vi', gl = 'VN'): Promise<string[]> {
  const suggestions = await getSuggestions(keyword, hl, gl)
  // Filter out the exact keyword and deduplicate (case-insensitive)
  const lower = keyword.toLowerCase()
  return suggestions
    .filter(s => s.toLowerCase() !== lower)
    .slice(0, 10)
}

// ===== Phase 1: Question Keywords (Free, No Quota) =====
// Fetches autocomplete suggestions with question-word prefixes to discover
// content-gap opportunities (people searching for tutorials, explanations, etc.)

const QUESTION_PREFIXES_VI = ['cách', 'tại sao', 'thế nào', 'khi nào', 'ở đâu', 'ai', 'giá bao nhiêu']
const QUESTION_PREFIXES_EN = ['how to', 'what is', 'why', 'when', 'where', 'who', 'how much']

export async function getQuestionKeywords(
  keyword: string,
  lang: 'vi' | 'en' = 'vi',
  gl = 'VN',
): Promise<string[]> {
  const prefixes = lang === 'vi' ? QUESTION_PREFIXES_VI : QUESTION_PREFIXES_EN
  const hl = lang

  // Fetch suggestions for each question prefix in parallel
  const promises = prefixes.map(prefix => {
    const query = `${prefix} ${keyword}`
    return getSuggestions(query, hl, gl)
  })

  const results = await Promise.all(promises)

  // Flatten, deduplicate, and filter out empty/exact keyword
  const seen = new Set<string>()
  const questions: string[] = []
  const lower = keyword.toLowerCase()

  for (const suggestions of results) {
    for (const s of suggestions) {
      const sLower = s.toLowerCase()
      // Skip if it's just the keyword itself or too short
      if (sLower === lower || s.length < 5) continue
      if (!seen.has(sLower)) {
        seen.add(sLower)
        questions.push(s)
      }
    }
  }

  return questions.slice(0, 15)
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
