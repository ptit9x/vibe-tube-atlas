// CSV export utility for keyword/video/channel data

export function exportToCSV(filename: string, headers: string[], rows: (string | number)[][]) {
  const csvContent = [
    headers.join(','),
    ...rows.map(row =>
      row.map(cell => {
        const str = String(cell ?? '')
        // Escape quotes and wrap in quotes if contains comma/quote/newline
        if (str.includes('"') || str.includes(',') || str.includes('\n')) {
          return `"${str.replace(/"/g, '""')}"`
        }
        return str
      }).join(',')
    ),
  ].join('\n')

  const blob = new Blob([`\uFEFF${csvContent}`], { type: 'text/csv;charset=utf-8;' })
  const link = document.createElement('a')
  link.href = URL.createObjectURL(blob)
  link.download = filename
  link.click()
  URL.revokeObjectURL(link.href)
}

export function exportKeywordsCSV(keywords: { keyword: string; avgViews: number; avgLikes: number; competition: string; engagementRate: number }[]) {
  exportToCSV(
    `keywords_${new Date().toISOString().slice(0, 10)}.csv`,
    ['Keyword', 'Avg Views', 'Avg Likes', 'Competition', 'Engagement Rate (%)'],
    keywords.map(k => [k.keyword, k.avgViews, k.avgLikes, k.competition, k.engagementRate]),
  )
}

export function exportVideosCSV(videos: { id: string; title: string; channelTitle: string; viewCount: number; likeCount: number }[]) {
  exportToCSV(
    `videos_${new Date().toISOString().slice(0, 10)}.csv`,
    ['Video ID', 'Title', 'Channel', 'Views', 'Likes'],
    videos.map(v => [v.id, v.title, v.channelTitle, v.viewCount ?? 0, v.likeCount ?? 0]),
  )
}

export function exportChannelsCSV(channels: { id: string; title: string; subscriberCount: number; videoCount: number; viewCount: number }[]) {
  exportToCSV(
    `channels_${new Date().toISOString().slice(0, 10)}.csv`,
    ['Channel ID', 'Title', 'Subscribers', 'Videos', 'Total Views'],
    channels.map(c => [c.id, c.title, c.subscriberCount ?? 0, c.videoCount ?? 0, c.viewCount ?? 0]),
  )
}
