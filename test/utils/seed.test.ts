import { describe, it, expect } from 'vitest'
import { generateLotteryTickets } from '../../scripts/seed.js'

describe('generateLotteryTickets seed utility', () => {
  const refDate = new Date(2026, 10, 21) // 21 Nov 2026

  it('generates a rich list of mock lottery tickets', () => {
    const tickets = generateLotteryTickets(refDate)
    expect(tickets.length).toBeGreaterThanOrEqual(8)

    tickets.forEach(t => {
      expect(t.id).toBeDefined()
      expect(t.title).toBeTruthy()
      expect(t.organization).toBeTruthy()
      expect(t.game).toBeTruthy()
      expect(t.cost).toBeGreaterThan(0)
      expect(new Date(t.date).getTime()).not.toBeNaN()
    })
  })

  it('covers ONLAE, ONCE and Otros organizations', () => {
    const tickets = generateLotteryTickets(refDate)
    const orgs = new Set(tickets.map(t => t.organization))

    expect(orgs.has('onlae')).toBe(true)
    expect(orgs.has('once')).toBe(true)
    expect(orgs.has('otros')).toBe(true)
  })

  it('includes won, lost, refund and pending statuses', () => {
    const tickets = generateLotteryTickets(refDate)
    const statuses = new Set(tickets.map(t => t.status))

    expect(statuses.has('won')).toBe(true)
    expect(statuses.has('lost')).toBe(true)
    expect(statuses.has('refund')).toBe(true)
    expect(statuses.has('pending')).toBe(true)
  })
})
