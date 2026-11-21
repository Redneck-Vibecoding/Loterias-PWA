export type PeriodType = 'all' | 'week' | 'month' | 'year' | 'custom'

export interface PeriodFilter {
  type: PeriodType
  year?: number
  month?: number // 1-12, or 0 = all
  week?: string // 'YYYY-Www', e.g., '2026-W47'
  startDate?: string // 'YYYY-MM-DD'
  endDate?: string // 'YYYY-MM-DD'
}

/**
 * Returns ISO week number and year string, e.g. "2026-W47"
 */
export const getIsoWeekString = (dateInput: Date | string): string => {
  const d = new Date(dateInput)
  if (Number.isNaN(d.getTime())) return ''

  // Thursday in current week decides the year.
  const target = new Date(d.valueOf())
  const dayNr = (d.getDay() + 6) % 7
  target.setDate(target.getDate() - dayNr + 3)
  const firstThursday = target.valueOf()
  target.setMonth(0, 1)
  if (target.getDay() !== 4) {
    target.setMonth(0, 1 + ((4 - target.getDay()) + 7) % 7)
  }
  const weekNum = 1 + Math.ceil((firstThursday - target.valueOf()) / 604800000)
  const year = new Date(firstThursday).getFullYear()
  return `${year}-W${String(weekNum).padStart(2, '0')}`
}

/**
 * Returns { start: Date, end: Date } for a given ISO week string "YYYY-Www"
 * Start is Monday 00:00:00, end is Sunday 23:59:59.999
 */
export const getIsoWeekBounds = (weekStr: string): { start: Date, end: Date } => {
  const match = weekStr.match(/^(\d{4})-W(\d{2})$/)
  if (!match) {
    const now = new Date()
    return { start: now, end: now }
  }

  const year = parseInt(match[1], 10)
  const week = parseInt(match[2], 10)

  // 4th of January is always in week 1
  const jan4 = new Date(year, 0, 4)
  const dayOfWeek = (jan4.getDay() + 6) % 7 // Monday = 0
  const mondayWeek1 = new Date(jan4.getTime() - dayOfWeek * 86400000)

  const mondayTarget = new Date(mondayWeek1.getTime() + (week - 1) * 7 * 86400000)
  mondayTarget.setHours(0, 0, 0, 0)

  const sundayTarget = new Date(mondayTarget.getTime() + 6 * 86400000)
  sundayTarget.setHours(23, 59, 59, 999)

  return { start: mondayTarget, end: sundayTarget }
}

/**
 * Human-readable label for a week string, e.g. "Semana 47 (17 - 23 Nov 2026)"
 */
export const formatWeekLabel = (weekStr: string): string => {
  const match = weekStr.match(/^(\d{4})-W(\d{2})$/)
  if (!match) return weekStr

  const { start, end } = getIsoWeekBounds(weekStr)
  const startDay = start.getDate()
  const endDay = end.getDate()
  const monthNames = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic']
  const startMonth = monthNames[start.getMonth()]
  const endMonth = monthNames[end.getMonth()]
  const year = start.getFullYear()

  if (start.getMonth() === end.getMonth()) {
    return `Semana ${match[2]} (${startDay} - ${endDay} ${startMonth} ${year})`
  }
  return `Semana ${match[2]} (${startDay} ${startMonth} - ${endDay} ${endMonth} ${year})`
}

/**
 * Returns an array of available week options relative to current date and records
 */
export const generateRecentWeeks = (ticketDates: string[] = [], weeksBack = 12): { value: string, label: string }[] => {
  const weekMap = new Map<string, string>()

  // Current week
  const currentWeek = getIsoWeekString(new Date())
  if (currentWeek) {
    weekMap.set(currentWeek, `Esta semana · ${formatWeekLabel(currentWeek)}`)
  }

  // Last week
  const lastWeekDate = new Date()
  lastWeekDate.setDate(lastWeekDate.getDate() - 7)
  const lastWeek = getIsoWeekString(lastWeekDate)
  if (lastWeek && !weekMap.has(lastWeek)) {
    weekMap.set(lastWeek, `Semana pasada · ${formatWeekLabel(lastWeek)}`)
  }

  // Weeks from tickets
  ticketDates.forEach(d => {
    const w = getIsoWeekString(d)
    if (w && !weekMap.has(w)) {
      weekMap.set(w, formatWeekLabel(w))
    }
  })

  // Fill recent weeks
  for (let i = 2; i <= weeksBack; i++) {
    const prevDate = new Date()
    prevDate.setDate(prevDate.getDate() - i * 7)
    const w = getIsoWeekString(prevDate)
    if (w && !weekMap.has(w)) {
      weekMap.set(w, formatWeekLabel(w))
    }
  }

  return Array.from(weekMap.entries())
    .map(([value, label]) => ({ value, label }))
    .sort((a, b) => b.value.localeCompare(a.value))
}

/**
 * Checks whether an ISO date string falls into the given PeriodFilter
 */
export const isDateInPeriod = (dateStr: string, filter: PeriodFilter): boolean => {
  if (filter.type === 'all') return true

  const d = new Date(dateStr)
  if (Number.isNaN(d.getTime())) return false

  if (filter.type === 'week') {
    if (!filter.week) return true
    const ticketWeek = getIsoWeekString(d)
    return ticketWeek === filter.week
  }

  if (filter.type === 'month') {
    if (filter.year && d.getFullYear() !== filter.year) return false
    if (filter.month && filter.month !== 0 && (d.getMonth() + 1) !== filter.month) return false
    return true
  }

  if (filter.type === 'year') {
    if (!filter.year) return true
    return d.getFullYear() === filter.year
  }

  if (filter.type === 'custom') {
    if (filter.startDate) {
      const start = new Date(filter.startDate)
      start.setHours(0, 0, 0, 0)
      if (d < start) return false
    }
    if (filter.endDate) {
      const end = new Date(filter.endDate)
      end.setHours(23, 59, 59, 999)
      if (d > end) return false
    }
    return true
  }

  return true
}

export const getPeriodSummaryLabel = (filter: PeriodFilter): string => {
  switch (filter.type) {
    case 'all':
      return 'Todo el histórico'
    case 'week':
      return filter.week ? formatWeekLabel(filter.week) : 'Semana seleccionada'
    case 'month': {
      const monthNames = [
        'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
        'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
      ]
      const m = filter.month && filter.month > 0 ? monthNames[filter.month - 1] : 'Todos los meses'
      return `${m} ${filter.year || ''}`.trim()
    }
    case 'year':
      return `Año ${filter.year || ''}`
    case 'custom':
      return `${filter.startDate || '...'} a ${filter.endDate || '...'}`
    default:
      return 'Periodo'
  }
}
