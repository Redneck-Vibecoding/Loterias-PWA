import { describe, it, expect } from 'vitest'
import {
  getIsoWeekString,
  getIsoWeekBounds,
  isDateInPeriod,
  formatWeekLabel
} from '~/utils/lotteryPeriods'

describe('lotteryPeriods', () => {
  it('computes ISO week string for dates', () => {
    // 2026-11-21 is Saturday in week 47 of 2026
    const week = getIsoWeekString('2026-11-21')
    expect(week).toBe('2026-W47')
  })

  it('determines week bounds correctly (Monday to Sunday)', () => {
    const { start, end } = getIsoWeekBounds('2026-W47')
    expect(start.getDay()).toBe(1) // Monday
    expect(end.getDay()).toBe(0) // Sunday
  })

  it('formats readable week labels', () => {
    const label = formatWeekLabel('2026-W47')
    expect(label).toContain('Semana 47')
  })

  it('filters dates by weekly period', () => {
    const weekFilter = {
      type: 'week' as const,
      week: '2026-W47'
    }

    expect(isDateInPeriod('2026-11-21', weekFilter)).toBe(true)
    expect(isDateInPeriod('2026-11-10', weekFilter)).toBe(false)
  })

  it('filters dates by monthly and yearly periods', () => {
    const monthFilter = {
      type: 'month' as const,
      year: 2026,
      month: 11
    }

    expect(isDateInPeriod('2026-11-15', monthFilter)).toBe(true)
    expect(isDateInPeriod('2026-10-15', monthFilter)).toBe(false)

    const yearFilter = {
      type: 'year' as const,
      year: 2026
    }
    expect(isDateInPeriod('2026-05-10', yearFilter)).toBe(true)
    expect(isDateInPeriod('2025-12-31', yearFilter)).toBe(false)
  })
})
