import { describe, it, expect } from 'vitest'
import { parseLotteryTicketText } from '~/utils/lotteryOcr'

describe('lotteryOcr', () => {
  it('detects Euromillones tickets and extracts details', () => {
    const rawOcrText = `
      LOTERIAS Y APUESTAS DEL ESTADO
      EUROMILLONES
      FECHA: 20/11/2026
      2 APUESTAS
      PRECIO: 5,00 €
      08 19 24 33 46 + 02 08
    `

    const parsed = parseLotteryTicketText(rawOcrText)
    expect(parsed.organization).toBe('onlae')
    expect(parsed.game).toBe('euromillones')
    expect(parsed.cost).toBe(5.00)
    expect(parsed.betsCount).toBe(2)
    expect(parsed.drawDate).toBe('2026-11-20')
  })

  it('detects Cuponazo ONCE tickets', () => {
    const rawOcrText = `
      ORGANIZACION NACIONAL DE CIEGOS ESPAÑOLES
      CUPONAZO DE LA ONCE
      VIERNES 21/11/2026
      NUMERO: 84920
      SERIE: 042
      PRECIO: 3,00 €
    `

    const parsed = parseLotteryTicketText(rawOcrText)
    expect(parsed.organization).toBe('once')
    expect(parsed.game).toBe('cuponazo')
    expect(parsed.cost).toBe(3.00)
    expect(parsed.numbers).toContain('84920')
  })

  it('detects Bonoloto and Lotería Nacional', () => {
    const bonolotoText = 'LOTERIAS DEL ESTADO BONOLOTO 15/11/2026 PRECIO 1,00€'
    const parsedBono = parseLotteryTicketText(bonolotoText)
    expect(parsedBono.organization).toBe('onlae')
    expect(parsedBono.game).toBe('bonoloto')
    expect(parsedBono.cost).toBe(1.00)

    const nacionalText = 'LOTERIA NACIONAL SORTEO DEL JUEVES 12/11/2026 DECIMO 54201 PRECIO 3,00€'
    const parsedNac = parseLotteryTicketText(nacionalText)
    expect(parsedNac.organization).toBe('onlae')
    expect(parsedNac.game).toBe('nacional')
    expect(parsedNac.cost).toBe(3.00)
  })
})
