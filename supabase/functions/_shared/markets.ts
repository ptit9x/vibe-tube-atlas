// Market definitions + RPM estimation matrix.
// ⚠️ RPM values are HEURISTIC ESTIMATES (USD per 1000 monetized views,
// all-niche average) from public creator reports — NOT YouTube-published.
// They are directional: tune here, one place, affects scan + UI.
// est. RPM = market.baseRpm × category.rpmMultiplier
// Imported by BOTH the web app (via @shared alias) and the daily-scan
// Edge Function — keep dependency-free.

export interface MarketDef {
  key: string
  hl: string          // YouTube UI language for scraping/suggest
  gl: string          // geo targeting
  seedLang: 'vi' | 'en' | 'ja' | 'ko'  // which seed list to use
  baseRpm: number     // USD per 1k views, all-niche average estimate
  labelVi: string
  labelEn: string
  flag: string        // emoji flag for UI badge
}

export const MARKETS: MarketDef[] = [
  { key: 'VN', hl: 'vi', gl: 'VN', seedLang: 'vi', baseRpm: 0.8, labelVi: 'Việt Nam', labelEn: 'Vietnam', flag: '🇻🇳' },
  { key: 'US', hl: 'en', gl: 'US', seedLang: 'en', baseRpm: 6.0, labelVi: 'Mỹ', labelEn: 'United States', flag: '🇺🇸' },
  { key: 'JP', hl: 'ja', gl: 'JP', seedLang: 'ja', baseRpm: 4.2, labelVi: 'Nhật Bản', labelEn: 'Japan', flag: '🇯🇵' },
  { key: 'KR', hl: 'ko', gl: 'KR', seedLang: 'ko', baseRpm: 3.8, labelVi: 'Hàn Quốc', labelEn: 'South Korea', flag: '🇰🇷' },
  { key: 'GB', hl: 'en', gl: 'GB', seedLang: 'en', baseRpm: 4.8, labelVi: 'Anh', labelEn: 'United Kingdom', flag: '🇬🇧' },
  { key: 'CA', hl: 'en', gl: 'CA', seedLang: 'en', baseRpm: 4.5, labelVi: 'Canada', labelEn: 'Canada', flag: '🇨🇦' },
  { key: 'AU', hl: 'en', gl: 'AU', seedLang: 'en', baseRpm: 5.5, labelVi: 'Úc', labelEn: 'Australia', flag: '🇦🇺' },
  { key: 'DE', hl: 'en', gl: 'DE', seedLang: 'en', baseRpm: 3.5, labelVi: 'Đức', labelEn: 'Germany', flag: '🇩🇪' },
  { key: 'TW', hl: 'en', gl: 'TW', seedLang: 'en', baseRpm: 2.2, labelVi: 'Đài Loan', labelEn: 'Taiwan', flag: '🇹🇼' },
  { key: 'SG', hl: 'en', gl: 'SG', seedLang: 'en', baseRpm: 2.6, labelVi: 'Singapore', labelEn: 'Singapore', flag: '🇸🇬' },
]

export const MARKET_MAP: Record<string, MarketDef> = Object.fromEntries(
  MARKETS.map((m) => [m.key, m]),
)

export const DEFAULT_MARKETS = ['VN', 'US']
export const MAX_MARKETS = 4 // UI + function enforce — each market costs scrape budget

/** Estimated RPM (USD / 1k views) for an industry category in a market. */
export function estimateRpm(marketKey: string, categoryMultiplier: number): number {
  const market = MARKET_MAP[marketKey]
  if (!market) return 0
  return Math.round(market.baseRpm * categoryMultiplier * 100) / 100
}
