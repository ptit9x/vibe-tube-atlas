// Date formatting utilities

interface TranslationDates {
  justNow: string
  minutesAgo: string
  hoursAgo: string
  daysAgo: string
}

export function formatDistanceToNow(date: Date, t: TranslationDates): string {
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMin = Math.floor(diffMs / 60000)
  const diffHr = Math.floor(diffMs / 3600000)
  const diffDay = Math.floor(diffMs / 86400000)

  if (diffMin < 1) return t.justNow
  if (diffMin < 60) return `${diffMin} ${t.minutesAgo}`
  if (diffHr < 24) return `${diffHr} ${t.hoursAgo}`
  return `${diffDay} ${t.daysAgo}`
}
