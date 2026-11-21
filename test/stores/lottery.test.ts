import { describe, it, expect, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useLotteryStore, type LotteryTicket } from '~/stores/lottery'

describe('useLotteryStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('calculates total cost, total prizes, and net balance correctly', () => {
    const store = useLotteryStore()

    const ticket1: LotteryTicket = {
      id: '1',
      title: 'Bonoloto',
      organization: 'onlae',
      game: 'bonoloto',
      gameName: 'Bonoloto',
      date: '2026-11-20',
      drawDate: '2026-11-20',
      cost: 2.00,
      prize: 0,
      status: 'lost',
      createdAt: '2026-11-20T10:00:00Z',
      updatedAt: '2026-11-20T10:00:00Z'
    }

    const ticket2: LotteryTicket = {
      id: '2',
      title: 'Cuponazo',
      organization: 'once',
      game: 'cuponazo',
      gameName: 'Cuponazo',
      date: '2026-11-21',
      drawDate: '2026-11-21',
      cost: 3.00,
      prize: 25.00,
      status: 'won',
      createdAt: '2026-11-21T10:00:00Z',
      updatedAt: '2026-11-21T10:00:00Z'
    }

    store.tickets = [ticket1, ticket2]

    expect(store.allTotalCost).toBe(5.00)
    expect(store.allTotalPrizes).toBe(25.00)
    expect(store.allNetBalance).toBe(20.00)

    const metrics = store.calculateMetrics(store.tickets)
    expect(metrics.totalCost).toBe(5.00)
    expect(metrics.totalPrizes).toBe(25.00)
    expect(metrics.netBalance).toBe(20.00)
    expect(metrics.roi).toBe(500) // 25 / 5 * 100 = 500%
    expect(metrics.wonCount).toBe(1)
    expect(metrics.lostCount).toBe(1)
  })

  it('filters tickets by organization and status correctly', () => {
    const store = useLotteryStore()

    store.tickets = [
      {
        id: '1',
        title: 'Euromillones',
        organization: 'onlae',
        game: 'euromillones',
        gameName: 'Euromillones',
        date: '2026-11-20',
        cost: 2.50,
        prize: 0,
        status: 'pending',
        createdAt: '2026-11-20T10:00:00Z',
        updatedAt: '2026-11-20T10:00:00Z'
      },
      {
        id: '2',
        title: 'Cuponazo ONCE',
        organization: 'once',
        game: 'cuponazo',
        gameName: 'Cuponazo',
        date: '2026-11-21',
        cost: 3.00,
        prize: 50.00,
        status: 'won',
        createdAt: '2026-11-21T10:00:00Z',
        updatedAt: '2026-11-21T10:00:00Z'
      }
    ]

    const onlaeTickets = store.getFilteredTickets({ organization: 'onlae' })
    expect(onlaeTickets).toHaveLength(1)
    expect(onlaeTickets[0]?.organization).toBe('onlae')

    const onceTickets = store.getFilteredTickets({ organization: 'once' })
    expect(onceTickets).toHaveLength(1)
    expect(onceTickets[0]?.organization).toBe('once')

    const wonTickets = store.getFilteredTickets({ status: 'won' })
    expect(wonTickets).toHaveLength(1)
    expect(wonTickets[0]?.status).toBe('won')
  })
})
