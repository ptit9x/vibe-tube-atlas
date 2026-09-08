import { describe, it, expect } from 'vitest'
import {
  MARKETS,
  MARKET_MAP,
  estimateRpm,
  DEFAULT_MARKETS,
  MAX_MARKETS,
} from '@shared/markets'
import { INDUSTRIES, CATEGORIES } from '@shared/taxonomy'

describe('markets', () => {
  it('has unique keys', () => {
    expect(new Set(MARKETS.map((m) => m.key)).size).toBe(MARKETS.length)
  })

  it('US RPM > JP > KR > VN ordering (heuristic tiers)', () => {
    expect(MARKET_MAP.US.baseRpm).toBeGreaterThan(MARKET_MAP.JP.baseRpm)
    expect(MARKET_MAP.JP.baseRpm).toBeGreaterThan(MARKET_MAP.KR.baseRpm)
    expect(MARKET_MAP.KR.baseRpm).toBeGreaterThan(MARKET_MAP.VN.baseRpm)
  })

  it('finance in US ≈ $18/1k', () => {
    expect(estimateRpm('US', 3.0)).toBeCloseTo(18.0, 2)
  })

  it('gaming in VN ≈ $0.48/1k', () => {
    expect(estimateRpm('VN', 0.6)).toBeCloseTo(0.48, 2)
  })

  it('unknown market returns 0', () => {
    expect(estimateRpm('XX', 3.0)).toBe(0)
  })

  it('defaults are valid and within max', () => {
    expect(DEFAULT_MARKETS.every((k) => MARKET_MAP[k])).toBe(true)
    expect(DEFAULT_MARKETS.length).toBeLessThanOrEqual(MAX_MARKETS)
  })
})

describe('taxonomy', () => {
  it('has 28 industries across 8 categories', () => {
    expect(INDUSTRIES.length).toBe(28)
    expect(CATEGORIES.length).toBe(8)
  })

  it('every industry references a valid category', () => {
    const keys = new Set(CATEGORIES.map((c) => c.key))
    expect(INDUSTRIES.every((i) => keys.has(i.category))).toBe(true)
  })

  it('every industry has vi + en seeds (>=6 each)', () => {
    for (const i of INDUSTRIES) {
      expect(i.seeds.vi.length).toBeGreaterThanOrEqual(6)
      expect(i.seeds.en.length).toBeGreaterThanOrEqual(6)
    }
  })

  it('industry keys unique', () => {
    expect(new Set(INDUSTRIES.map((i) => i.key)).size).toBe(INDUSTRIES.length)
  })
})
