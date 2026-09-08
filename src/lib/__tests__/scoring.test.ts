import { describe, it, expect } from 'vitest'
import {
  calcDifficultyScore,
  calcNicheScore,
  relativeTimeToDays,
} from '@shared/scoring'

describe('calcDifficultyScore', () => {
  it('low-competition old niche → easy (<34)', () => {
    const s = calcDifficultyScore(5_000, 0, 400, 50)
    expect(s).toBeLessThan(34)
  })

  it('huge results + authoritative channels → hard (>=67)', () => {
    const s = calcDifficultyScore(2_000_000, 500_000, 10, 20_000)
    expect(s).toBeGreaterThanOrEqual(67)
  })

  it('always returns 0-100', () => {
    expect(calcDifficultyScore(0, 0, 0, 0)).toBeGreaterThanOrEqual(0)
    expect(calcDifficultyScore(10 ** 9, 10 ** 8, 1, 10 ** 6)).toBeLessThanOrEqual(100)
  })

  it('matches the original frontend formula exactly', () => {
    // Snapshot of known values from the pre-refactor implementation
    expect(calcDifficultyScore(5_000, 0, 400, 50)).toBe(20)
    expect(calcDifficultyScore(2_000_000, 500_000, 10, 20_000)).toBe(88)
    expect(calcDifficultyScore(10 ** 9, 10 ** 8, 1, 10 ** 6)).toBe(100)
  })
})

describe('calcNicheScore', () => {
  it('easy + strong demand → good niche (>=50)', () => {
    expect(calcNicheScore(20, 5_000, 0)).toBeGreaterThanOrEqual(50)
  })

  it('hard + no demand → poor (<30)', () => {
    expect(calcNicheScore(90, 1, 0)).toBeLessThan(30)
  })

  it('matches the original frontend formula exactly', () => {
    expect(calcNicheScore(20, 5_000, 0)).toBe(63)
    expect(calcNicheScore(90, 1, 0)).toBe(11)
  })
})

describe('relativeTimeToDays (vi/en/ja/ko)', () => {
  it.each([
    // Vietnamese
    ['5 giờ trước', 5 / 24],
    ['2 ngày trước', 2],
    ['3 tuần trước', 21],
    ['2 tháng trước', 60],
    ['1 năm trước', 365],
    // English
    ['3 hours ago', 3 / 24],
    ['2 days ago', 2],
    ['3 weeks ago', 21],
    ['2 months ago', 60],
    ['1 year ago', 365],
    // Japanese
    ['3時間前', 3 / 24],
    ['2日前', 2],
    ['2か月前', 60],
    ['1年前', 365],
    // Korean
    ['3시간 전', 3 / 24],
    ['2일 전', 2],
    ['2개월 전', 60],
    ['1년 전', 365],
    // Unknown / edge
    ['được phát trực tiếp', 365],
    ['', 365],
  ])('%s → %d days', (input, expected) => {
    expect(relativeTimeToDays(input)).toBeCloseTo(expected, 5)
  })
})
