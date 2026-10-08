import { describe, it, expect, vi } from 'vitest'

// youtube.ts transitively creates the Supabase client at import time, which
// throws without env vars — stub before the dynamic import below.
vi.stubEnv('VITE_SUPABASE_URL', 'https://placeholder.supabase.co')
vi.stubEnv('VITE_SUPABASE_ANON_KEY', 'placeholder-anon-key')
const { ptDayStartUtc, parseISODuration } = await import('./youtube')

describe('ptDayStartUtc', () => {
  it('returns midnight PDT (UTC-7) during summer time', () => {
    expect(ptDayStartUtc(new Date('2026-09-04T12:00:00Z')).toISOString())
      .toBe('2026-09-04T07:00:00.000Z')
  })

  it('returns midnight PST (UTC-8) during winter time', () => {
    expect(ptDayStartUtc(new Date('2026-01-15T12:00:00Z')).toISOString())
      .toBe('2026-01-15T08:00:00.000Z')
  })

  it('rolls to the previous PT day just before PT midnight', () => {
    expect(ptDayStartUtc(new Date('2026-09-04T06:59:59Z')).toISOString())
      .toBe('2026-09-03T07:00:00.000Z')
  })
})

describe('parseISODuration', () => {
  it.each([
    ['PT1H2M3S', '1:02:03'],
    ['PT5M30S', '5:30'],
    ['PT45S', '0:45'],
    ['P1DT2H', '26:00:00'], // days fold into hours
    ['garbage', '0:00'],
  ])('%s → %s', (input, expected) => {
    expect(parseISODuration(input)).toBe(expected)
  })
})
