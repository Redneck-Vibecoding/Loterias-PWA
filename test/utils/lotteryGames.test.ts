import { describe, it, expect } from 'vitest'
import {
  LOTTERY_ORGANIZATIONS,
  getGameById,
  getGamesByOrganization
} from '~/utils/lotteryGames'

describe('lotteryGames', () => {
  it('defines the three key organizations (ONLAE, ONCE, Otros)', () => {
    expect(LOTTERY_ORGANIZATIONS.onlae).toBeDefined()
    expect(LOTTERY_ORGANIZATIONS.once).toBeDefined()
    expect(LOTTERY_ORGANIZATIONS.otros).toBeDefined()
  })

  it('contains popular games for each organization', () => {
    const onlaeGames = getGamesByOrganization('onlae')
    const gameIds = onlaeGames.map(g => g.id)
    expect(gameIds).toContain('bonoloto')
    expect(gameIds).toContain('primitiva')
    expect(gameIds).toContain('euromillones')
    expect(gameIds).toContain('nacional')

    const onceGames = getGamesByOrganization('once')
    const onceGameIds = onceGames.map(g => g.id)
    expect(onceGameIds).toContain('cupon_diario')
    expect(onceGameIds).toContain('cuponazo')
    expect(onceGameIds).toContain('sueldazo')
    expect(onceGameIds).toContain('eurojackpot')

    const otrosGames = getGamesByOrganization('otros')
    const otrosGameIds = otrosGames.map(g => g.id)
    expect(otrosGameIds).toContain('loto_catalunya')
    expect(otrosGameIds).toContain('rifas')
  })

  it('retrieves games by id or returns fallback', () => {
    const bono = getGameById('bonoloto')
    expect(bono.name).toBe('Bonoloto')
    expect(bono.organization).toBe('onlae')

    const unknown = getGameById('custom_raffle')
    expect(unknown.id).toBe('custom_raffle')
    expect(unknown.organization).toBe('otros')
  })
})
