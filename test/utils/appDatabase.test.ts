// @vitest-environment happy-dom
import { describe, expect, it } from 'vitest'
import {
  getTickets,
  setTickets,
  getSettings,
  setSettings
} from '../../app/utils/appDatabase'

describe('appDatabase storage', () => {
  it('stores and retrieves lottery tickets in IndexedDB', async () => {
    const mockTicket = {
      id: 'ticket-1',
      title: 'Bonoloto',
      organization: 'onlae' as const,
      game: 'bonoloto',
      gameName: 'Bonoloto',
      date: '2026-11-20',
      cost: 1.00,
      prize: 0,
      status: 'pending' as const,
      createdAt: '2026-11-20T10:00:00Z',
      updatedAt: '2026-11-20T10:00:00Z'
    }

    await setTickets([mockTicket])
    const loaded = await getTickets()
    expect(loaded).toEqual([mockTicket])
  })

  it('stores and retrieves settings', async () => {
    const settings = {
      monthlyBudget: 60,
      defaultOrganization: 'once' as const,
      currency: '€'
    }

    await setSettings(settings)
    const loaded = await getSettings()
    expect(loaded).toMatchObject(settings)
  })
})
