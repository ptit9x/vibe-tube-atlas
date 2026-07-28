// YouTube Data API v3 constants

// Approximate category IDs (US default). Use videoCategories.list for per-country accuracy.
export const YOUTUBE_CATEGORIES: { id: string; label: string; labelVi: string }[] = [
  { id: '1',  label: 'Film & Animation',       labelVi: 'Phim ảnh & Hoạt hình' },
  { id: '2',  label: 'Autos & Vehicles',        labelVi: 'Ô tô & Phương tiện' },
  { id: '10', label: 'Music',                   labelVi: 'Âm nhạc' },
  { id: '15', label: 'Pets & Animals',          labelVi: 'Thú cưng & Động vật' },
  { id: '17', label: 'Sports',                  labelVi: 'Thể thao' },
  { id: '19', label: 'Travel & Events',         labelVi: 'Du lịch & Sự kiện' },
  { id: '20', label: 'Gaming',                  labelVi: 'Game' },
  { id: '22', label: 'People & Blogs',          labelVi: 'Con người & Blog' },
  { id: '23', label: 'Comedy',                  labelVi: 'Hài hước' },
  { id: '24', label: 'Entertainment',           labelVi: 'Giải trí' },
  { id: '25', label: 'News & Politics',         labelVi: 'Tin tức & Chính trị' },
  { id: '26', label: 'Howto & Style',           labelVi: 'Hướng dẫn & Phong cách' },
  { id: '27', label: 'Education',               labelVi: 'Giáo dục' },
  { id: '28', label: 'Science & Technology',    labelVi: 'Khoa học & Công nghệ' },
  { id: '29', label: 'Nonprofits & Activism',   labelVi: 'Phi lợi nhuận' },
]

export const YOUTUBE_COUNTRIES: { code: string; name: string }[] = [
  { code: 'VN', name: 'Vietnam' },
  { code: 'US', name: 'United States' },
  { code: 'KR', name: 'Korea' },
  { code: 'JP', name: 'Japan' },
  { code: 'CN', name: 'China' },
  { code: 'TH', name: 'Thailand' },
  { code: 'ID', name: 'Indonesia' },
  { code: 'PH', name: 'Philippines' },
  { code: 'MY', name: 'Malaysia' },
  { code: 'SG', name: 'Singapore' },
  { code: 'IN', name: 'India' },
  { code: 'GB', name: 'United Kingdom' },
  { code: 'FR', name: 'France' },
  { code: 'DE', name: 'Germany' },
  { code: 'BR', name: 'Brazil' },
  { code: 'CA', name: 'Canada' },
  { code: 'AU', name: 'Australia' },
  { code: 'RU', name: 'Russia' },
  { code: 'TW', name: 'Taiwan' },
  { code: 'HK', name: 'Hong Kong' },
]

export const YOUTUBE_LANGUAGES: { code: string; name: string }[] = [
  { code: 'vi', name: 'Tiếng Việt' },
  { code: 'en', name: 'English' },
  { code: 'ko', name: '한국어' },
  { code: 'ja', name: '日本語' },
  { code: 'zh', name: '中文' },
  { code: 'th', name: 'ภาษาไทย' },
  { code: 'id', name: 'Bahasa Indonesia' },
  { code: 'es', name: 'Español' },
  { code: 'pt', name: 'Português' },
  { code: 'fr', name: 'Français' },
  { code: 'de', name: 'Deutsch' },
  { code: 'ru', name: 'Русский' },
]

// Quota cost constants (YouTube Data API v3)
export const QUOTA_COSTS = {
  search: 100,
  videos: 1,
  channels: 1,
  videoCategories: 1,
  commentThreads: 1,
} as const

export const DEFAULT_QUOTA_LIMIT = 10000
