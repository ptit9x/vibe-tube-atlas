// ===== Base Types =====

export type UUID = string
export type DateString = string
export type ISOString = string

// ===== YouTube Domain Types =====

export type YouTubeSearchType = 'video' | 'channel'
export type CompetitionLevel = 'low' | 'medium' | 'high'
export type EngagementLevel = 'low' | 'medium' | 'high'

/** Video search result from YouTube Data API v3 search.list */
export interface YouTubeVideo {
  id: UUID                    // YouTube video ID
  title: string
  description: string
  channelId: UUID
  channelTitle: string
  publishedAt: ISOString
  thumbnails: YouTubeThumbnails
  duration?: string           // ISO 8601 (e.g., PT4M13S)
  viewCount?: number
  likeCount?: number
  commentCount?: number
  tags?: string[]
  categoryId?: string
}

export interface YouTubeThumbnails {
  default?: { url: string; width: number; height: number }
  medium?: { url: string; width: number; height: number }
  high?: { url: string; width: number; height: number }
}

export interface YouTubeChannel {
  id: UUID                    // YouTube channel ID
  title: string
  description: string
  customUrl?: string          // e.g., @MrrGaming
  publishedAt: ISOString
  thumbnails: YouTubeThumbnails
  subscriberCount?: number
  videoCount?: number
  viewCount?: number
  country?: string
}

// ===== Keyword Analysis =====

export interface KeywordMetrics {
  keyword: string
  resultCount: number         // totalResults from search
  competition: CompetitionLevel
  avgViews: number
  avgLikes: number
  avgComments: number
  engagementRate: number      // (likes + comments) / views * 100
  engagementLevel: EngagementLevel
  topVideos: YouTubeVideo[]
  analyzedAt: ISOString
}

export interface SearchSuggestion {
  keyword: string
}

// ===== Saved Items =====

export interface SavedKeyword {
  id: UUID
  user_id: UUID
  keyword: string
  metrics: KeywordMetrics
  note?: string
  created_at: ISOString
}

export interface SavedVideo {
  id: UUID
  user_id: UUID
  video_id: string
  title: string
  channel_title: string
  thumbnail_url?: string
  view_count?: number
  like_count?: number
  comment_count?: number
  published_at?: ISOString
  note?: string
  created_at: ISOString
}

export interface SavedChannel {
  id: UUID
  user_id: UUID
  channel_id: string
  title: string
  description?: string
  thumbnail_url?: string
  subscriber_count?: number
  video_count?: number
  view_count?: number
  note?: string
  created_at: ISOString
}

// ===== Search History & API Usage =====

export interface SearchHistoryEntry {
  id: UUID
  user_id: UUID
  query: string
  search_type: YouTubeSearchType
  country: string
  results_count: number
  created_at: ISOString
}

export interface ApiUsageEntry {
  id: UUID
  user_id: UUID
  endpoint: string
  quota_cost: number
  created_at: ISOString
}

export interface ApiUsageSummary {
  totalQuotaUsed: number
  quotaLimit: number          // default 10000
  remainingQuota: number
  searchCount: number
  todayQuotaUsed: number
}

// ===== API Key =====

export interface UserApiKey {
  id: UUID
  user_id: UUID
  provider: string            // 'youtube'
  api_key_encrypted: string   // stored encrypted in DB
  is_active: boolean
  created_at: ISOString
  updated_at: ISOString
}

// ===== Auth Types =====

export interface AuthUser {
  id: UUID
  email: string
  full_name: string | null
  avatar_url: string | null
  confirmed: boolean
}

export interface LoginInput {
  email: string
  password: string
}

export interface RegisterInput extends LoginInput {
  full_name: string
}

export interface AuthResponse {
  user: AuthUser
  session: {
    access_token: string
    refresh_token: string
    expires_at: number
  }
}

// ===== Input Types =====

export interface SearchVideosParams {
  keyword: string
  type?: YouTubeSearchType
  maxResults?: number
  order?: 'date' | 'rating' | 'relevance' | 'viewCount'
  publishedAfter?: ISOString
  regionCode?: string
  relevanceLanguage?: string
  videoCategoryId?: string
}

export interface AnalyzeKeywordParams {
  keyword: string
  maxResults?: number
  regionCode?: string
  relevanceLanguage?: string
}

export interface SaveKeywordInput {
  keyword: string
  metrics: KeywordMetrics
  note?: string
}

export interface SaveVideoInput {
  video_id: string
  title: string
  channel_title: string
  thumbnail_url?: string
  view_count?: number
  like_count?: number
  comment_count?: number
  published_at?: string
  note?: string
}

export interface SaveChannelInput {
  channel_id: string
  title: string
  description?: string
  thumbnail_url?: string
  subscriber_count?: number
  video_count?: number
  view_count?: number
  note?: string
}
