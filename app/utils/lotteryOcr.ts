import type { LotteryOrganization } from '~/utils/lotteryGames'
import { getGameById } from '~/utils/lotteryGames'

export interface ParsedLotteryData {
  organization: LotteryOrganization
  game: string
  gameName: string
  title: string
  drawDate?: string
  cost?: number
  betsCount?: number
  numbers?: string
  rawText: string
}

export const parseLotteryTicketText = (text: string): ParsedLotteryData => {
  const upper = text.toUpperCase()

  let organization: LotteryOrganization = 'onlae'
  let game = 'bonoloto'
  let betsCount: number | undefined
  let cost: number | undefined
  let drawDate: string | undefined
  let numbers: string | undefined

  // Detect Organization & Game
  if (upper.includes('EUROMILLONES') || upper.includes('EUROMILLIONS') || upper.includes('EL MILLON')) {
    organization = 'onlae'
    game = 'euromillones'
  } else if (upper.includes('BONOLOTO')) {
    organization = 'onlae'
    game = 'bonoloto'
  } else if (upper.includes('PRIMITIVA') && !upper.includes('GORDO')) {
    organization = 'onlae'
    game = 'primitiva'
  } else if (upper.includes('GORDO')) {
    organization = 'onlae'
    game = 'gordo_primitiva'
  } else if (upper.includes('EURODREAMS')) {
    organization = 'onlae'
    game = 'eurodreams'
  } else if (upper.includes('QUINIELA')) {
    organization = 'onlae'
    game = 'quiniela'
  } else if (upper.includes('QUINIGOL')) {
    organization = 'onlae'
    game = 'quinigol'
  } else if (upper.includes('LOTERIA NACIONAL') || (upper.includes('DECIMO') && !upper.includes('ONCE'))) {
    organization = 'onlae'
    game = 'nacional'
  } else if (upper.includes('NAVIDAD') || upper.includes('EL NIÑO')) {
    organization = 'onlae'
    game = 'navidad_nino'
  } else if (upper.includes('CUPONAZO')) {
    organization = 'once'
    game = 'cuponazo'
  } else if (upper.includes('SUELDAZO')) {
    organization = 'once'
    game = 'sueldazo'
  } else if (upper.includes('EUROJACKPOT')) {
    organization = 'once'
    game = 'eurojackpot'
  } else if (upper.includes('TRIPLEX')) {
    organization = 'once'
    game = 'triplex'
  } else if (upper.includes('MI DIA')) {
    organization = 'once'
    game = 'mi_dia'
  } else if (upper.includes('SUPER ONCE')) {
    organization = 'once'
    game = 'super_once'
  } else if (upper.includes('RASCA')) {
    organization = 'once'
    game = 'rascas'
  } else if (upper.includes('ONCE') || upper.includes('CUPON')) {
    organization = 'once'
    game = 'cupon_diario'
  } else if (upper.includes('GROSSA') || upper.includes('CATALUNYA') || upper.includes('6/49')) {
    organization = 'otros'
    game = 'loto_catalunya'
  } else if (upper.includes('RIFA') || upper.includes('CESTA')) {
    organization = 'otros'
    game = 'rifas'
  }

  // Detect Date
  // Patterns like 21/11/2026 or 21-11-26
  const dateMatch = text.match(/\b(\d{1,2})[/.-](\d{1,2})[/.-](\d{2,4})\b/)
  if (dateMatch && dateMatch[1] && dateMatch[2] && dateMatch[3]) {
    const day = dateMatch[1].padStart(2, '0')
    const month = dateMatch[2].padStart(2, '0')
    let year = dateMatch[3]
    if (year.length === 2) year = '20' + year
    drawDate = `${year}-${month}-${day}`
  }

  // Detect Cost / Amount
  const priceRegexes = [
    /(?:TOTAL|IMPORTE|PRECIO|EUROS?|€)\s*[:=]?\s*(\d+[.,]\d{2})/i,
    /(\d+[.,]\d{2})\s*€/,
    /PRECIO\s+(\d+[.,]\d{2})/i
  ]
  for (const rg of priceRegexes) {
    const match = text.match(rg)
    if (match && match[1]) {
      const parsed = parseFloat(match[1].replace(',', '.'))
      if (parsed > 0 && parsed < 1000) {
        cost = parsed
        break
      }
    }
  }

  // Detect Bets count
  const betsMatch = text.match(/(\d+)\s*(?:APUESTAS?|COLUMNAS?|JUGADAS?)/i)
  if (betsMatch && betsMatch[1]) {
    betsCount = parseInt(betsMatch[1], 10)
  }

  // Detect Played Numbers / Series
  const seriesFracMatch = text.match(/(?:SERIE\s*[:=]?\s*(\d+))?[,\s]*(?:FRACC?I[OÓ]N\s*[:=]?\s*(\d+))?/i)
  const numbersMatch = text.match(/\b\d{5}\b/)
  if (numbersMatch) {
    numbers = numbersMatch[0]
    if (seriesFracMatch && (seriesFracMatch[1] || seriesFracMatch[2])) {
      if (seriesFracMatch[1]) numbers += ` Serie ${seriesFracMatch[1]}`
      if (seriesFracMatch[2]) numbers += ` Frac. ${seriesFracMatch[2]}`
    }
  }

  const gameDef = getGameById(game)

  return {
    organization,
    game,
    gameName: gameDef.name,
    title: `${gameDef.name}${drawDate ? ` (${drawDate})` : ''}`,
    drawDate: drawDate || new Date().toISOString().slice(0, 10),
    cost: cost ?? gameDef.defaultCost,
    betsCount: betsCount ?? 1,
    numbers,
    rawText: text
  }
}
