import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const rootDir = path.resolve(__dirname, '..')
const outputFile = path.join(rootDir, 'public', 'dev-seed.json')

const isDirectExecution = process.argv[1] && process.argv[1].replace(/\\/g, '/').endsWith('scripts/seed.js')

export const createSampleLotteryTicketImage = (gameName, numbers, dateStr) => {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="340" height="220" viewBox="0 0 340 220">
  <rect width="340" height="220" fill="#f8fafc" stroke="#3b82f6" stroke-width="3" rx="12"/>
  <rect x="0" y="0" width="340" height="36" fill="#1d4ed8" rx="8"/>
  <text x="170" y="24" font-family="system-ui, sans-serif" font-size="14" font-weight="900" text-anchor="middle" fill="#ffffff">${gameName.toUpperCase()}</text>
  <text x="20" y="65" font-family="system-ui, sans-serif" font-size="12" font-weight="bold" fill="#1e3a8a">FECHA DEL SORTEO: ${dateStr}</text>
  <rect x="20" y="80" width="300" height="50" fill="#eff6ff" stroke="#bfdbfe" rx="8"/>
  <text x="170" y="112" font-family="monospace" font-size="16" font-weight="bold" text-anchor="middle" fill="#1e40af">${numbers}</text>
  <text x="20" y="155" font-family="system-ui, sans-serif" font-size="11" fill="#64748b">COMPROBANTE OFICIAL DE APUESTA</text>
  <text x="320" y="155" font-family="system-ui, sans-serif" font-size="12" font-weight="bold" text-anchor="end" fill="#059669">VALIDADO</text>
  <line x1="20" y1="170" x2="320" y2="170" stroke="#cbd5e1" stroke-dasharray="4"/>
  <text x="170" y="195" font-family="monospace" font-size="10" text-anchor="middle" fill="#94a3b8">*** LOTERÍAS Y APUESTAS ***</text>
</svg>`

  return `data:image/svg+xml;base64,${Buffer.from(svg).toString('base64')}`
}

export function generateLotteryTickets(refDate = new Date()) {
  const makeDate = (daysAgo) => {
    const d = new Date(refDate.getTime() - daysAgo * 86400000)
    return d.toISOString().slice(0, 10)
  }

  return [
    {
      id: 'mock-ticket-1',
      title: 'Euromillones 2 apuestas Viernes',
      organization: 'onlae',
      game: 'euromillones',
      gameName: 'Euromillones',
      date: makeDate(1),
      drawDate: makeDate(1),
      numbers: '08 19 24 33 46 + 02 08',
      betsCount: 2,
      cost: 5.00,
      status: 'won',
      prize: 48.50,
      ticketPhoto: createSampleLotteryTicketImage('Euromillones', '08 19 24 33 46 + 02 08', makeDate(1)),
      notes: 'Acertados 3 números + 1 estrella',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      id: 'mock-ticket-2',
      title: 'Bonoloto semanal 4 apuestas',
      organization: 'onlae',
      game: 'bonoloto',
      gameName: 'Bonoloto',
      date: makeDate(3),
      drawDate: makeDate(3),
      numbers: '03 14 22 29 35 41 (R: 7)',
      betsCount: 4,
      cost: 2.00,
      status: 'refund',
      prize: 2.00,
      ticketPhoto: createSampleLotteryTicketImage('Bonoloto', '03 14 22 29 35 41', makeDate(3)),
      notes: 'Acertado el reintegro',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      id: 'mock-ticket-3',
      title: 'Cuponazo de la ONCE',
      organization: 'once',
      game: 'cuponazo',
      gameName: 'Cuponazo',
      date: makeDate(7),
      drawDate: makeDate(7),
      numbers: '84920 Serie 042',
      betsCount: 1,
      cost: 3.00,
      status: 'won',
      prize: 150.00,
      ticketPhoto: createSampleLotteryTicketImage('Cuponazo ONCE', '84920 Serie 042', makeDate(7)),
      notes: 'Premio a las cuatro últimas cifras',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      id: 'mock-ticket-4',
      title: 'La Primitiva + Joker',
      organization: 'onlae',
      game: 'primitiva',
      gameName: 'La Primitiva',
      date: makeDate(10),
      drawDate: makeDate(10),
      numbers: '05 12 18 27 34 45 (R: 3, Joker: 9283716)',
      betsCount: 2,
      cost: 3.00,
      status: 'lost',
      prize: 0,
      ticketPhoto: createSampleLotteryTicketImage('La Primitiva', '05 12 18 27 34 45', makeDate(10)),
      notes: 'Sin premio en esta jornada',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      id: 'mock-ticket-5',
      title: 'Sueldazo Fin de Semana ONCE',
      organization: 'once',
      game: 'sueldazo',
      gameName: 'Sueldazo',
      date: makeDate(14),
      drawDate: makeDate(14),
      numbers: '32109 Serie 018',
      betsCount: 1,
      cost: 2.00,
      status: 'lost',
      prize: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      id: 'mock-ticket-6',
      title: 'Décimo Lotería Nacional Jueves',
      organization: 'onlae',
      game: 'nacional',
      gameName: 'Lotería Nacional',
      date: makeDate(16),
      drawDate: makeDate(16),
      numbers: '54201 Fracción 3 Serie 2',
      betsCount: 1,
      cost: 3.00,
      status: 'won',
      prize: 30.00,
      notes: 'Centena premiada',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      id: 'mock-ticket-7',
      title: 'La Grossa (Loto Catalunya)',
      organization: 'otros',
      game: 'loto_catalunya',
      gameName: 'Loto Catalunya',
      date: makeDate(21),
      drawDate: makeDate(21),
      numbers: '63821',
      betsCount: 1,
      cost: 5.00,
      status: 'won',
      prize: 20.00,
      notes: 'Última cifra premiada',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      id: 'mock-ticket-8',
      title: 'Rifa Cesta de Navidad Asociación',
      organization: 'otros',
      game: 'rifas',
      gameName: 'Rifas y Cestas',
      date: makeDate(25),
      drawDate: makeDate(25),
      numbers: 'Tira de 5 números: 450 al 454',
      betsCount: 5,
      cost: 5.00,
      status: 'lost',
      prize: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      id: 'mock-ticket-9',
      title: 'Décimo Lotería de Navidad',
      organization: 'onlae',
      game: 'navidad_nino',
      gameName: 'Navidad / El Niño',
      date: makeDate(0),
      drawDate: '2026-12-22',
      numbers: '79241 Fracción 7 Serie 124',
      betsCount: 1,
      cost: 20.00,
      status: 'pending',
      prize: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
  ]
}

if (isDirectExecution) {
  const tickets = generateLotteryTickets()
  const payload = {
    seededAt: new Date().toISOString(),
    tickets
  }
  fs.writeFileSync(outputFile, JSON.stringify(payload, null, 2))
  console.log(`Seeded ${tickets.length} lottery tickets into ${outputFile}`)
}
