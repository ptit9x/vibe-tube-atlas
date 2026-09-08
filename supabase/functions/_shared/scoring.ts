// Shared scoring — imported by BOTH the web app (via the @shared vite/tsconfig
// alias) and the daily-scan Edge Function (relative Deno import).
// Keep this file dependency-free and environment-agnostic.

// ===== Difficulty Score (0-100) =====
// Multi-factor algorithm: combines result count, channel authority (avg subs),
// content freshness (video age), and view momentum (views/day of top video).
// Higher score = harder to rank for this keyword.

export function calcDifficultyScore(
  resultCount: number,
  avgChannelSubs: number,
  avgVideoAgeDays: number,
  viewsPerDayTop: number,
): number {
  // Factor 1: Result count (0-30 pts) — more results = harder
  // <1K=5, <10K=12, <50K=18, <100K=24, <500K=28, else=30
  let resultScore: number
  if (resultCount < 1_000) resultScore = 5
  else if (resultCount < 10_000) resultScore = 12
  else if (resultCount < 50_000) resultScore = 18
  else if (resultCount < 100_000) resultScore = 24
  else if (resultCount < 500_000) resultScore = 28
  else resultScore = 30

  // Factor 2: Channel authority (0-30 pts) — bigger channels ranking = harder
  // Log scale: 0 subs=0, 1K=10, 10K=18, 100K=24, 1M=28, 10M+=30
  const subScore = avgChannelSubs > 0
    ? Math.min(30, Math.log10(avgChannelSubs + 1) * 4)
    : 0

  // Factor 3: Content freshness (0-20 pts) — old videos still ranking = easier
  // to compete with (content gap). Recent videos dominating = harder.
  // <7 days=20, <30=16, <90=12, <365=8, else=4
  let freshnessScore: number
  if (avgVideoAgeDays < 7) freshnessScore = 20
  else if (avgVideoAgeDays < 30) freshnessScore = 16
  else if (avgVideoAgeDays < 90) freshnessScore = 12
  else if (avgVideoAgeDays < 365) freshnessScore = 8
  else freshnessScore = 4

  // Factor 4: View momentum (0-20 pts) — high views/day means audience actively
  // watching this topic = harder to outrank but also more demand.
  // <100/day=4, <1K=10, <10K=16, <100K=19, else=20
  let momentumScore: number
  if (viewsPerDayTop < 100) momentumScore = 4
  else if (viewsPerDayTop < 1_000) momentumScore = 10
  else if (viewsPerDayTop < 10_000) momentumScore = 16
  else if (viewsPerDayTop < 100_000) momentumScore = 19
  else momentumScore = 20

  return Math.round(resultScore + subScore + freshnessScore + momentumScore)
}

// ===== Niche Opportunity Score (0-100) =====
// Designed for niche keyword discovery: high demand + low difficulty = good niche.
// Combines difficulty (inverted), views/day, and engagement.

export function calcNicheScore(
  difficultyScore: number,
  viewsPerDayTop: number,
  engagementRate: number,
): number {
  // Difficulty inverted (0-40): easier keywords score higher
  const easyScore = Math.round((100 - difficultyScore) / 100 * 40)

  // Demand from views/day (0-35): log scale
  // 100/day≈14, 1K≈21, 10K≈28, 100K≈35
  const demandScore = viewsPerDayTop > 0
    ? Math.min(35, Math.log10(viewsPerDayTop + 1) * 7)
    : 0

  // Engagement (0-25): direct mapping
  let engScore: number
  if (engagementRate > 10) engScore = 25
  else if (engagementRate > 5) engScore = 20
  else if (engagementRate > 2) engScore = 15
  else if (engagementRate > 1) engScore = 10
  else engScore = 5

  return Math.round(easyScore + demandScore + engScore)
}

/** Parse a YouTube relative publish-time string (vi/en/ja/ko) → approximate age in days. */
export function relativeTimeToDays(text: string): number {
  const t = (text || '').toLowerCase()
  const n = parseInt(t.match(/\d+/)?.[0] ?? '1', 10) || 1
  // Hours (vi: giờ, en: hour, ja: 時間前, ko: 시간)
  if (t.includes('giờ') || t.includes('hour') || t.includes('時間') || t.includes('시간')) {
    return Math.max(n / 24, 1 / 24)
  }
  // Days (vi: ngày, en: day, ja: 日前, ko: 일 전)
  if (t.includes('ngày') || t.includes('day') || t.includes('日前') || t.includes('일 전')) return n
  // Weeks (vi: tuần, en: week, ko: 주 전; ja has no distinct weekly form — uses 日/か月)
  if (t.includes('tuần') || t.includes('week') || t.includes('주 전')) return n * 7
  // Months (vi: tháng, en: month, ja: か月/ヶ月, ko: 개월)
  if (t.includes('tháng') || t.includes('month') || t.includes('か月') || t.includes('개월')) return n * 30
  // Years (vi: năm, en: year, ja: 年前, ko: 년 전)
  if (t.includes('năm') || t.includes('year') || t.includes('年前') || t.includes('년 전')) return n * 365
  // Unknown (live streams, "được phát trực tiếp", empty) → conservative default
  return 365
}
