import { defineStore } from 'pinia'
import {
  getTickets as persistGetTickets,
  setTickets as persistSetTickets
} from '~/utils/appDatabase'
import {
  buildLotteryAttachmentId,
  deleteLotteryAttachment,
  deleteLotteryAttachments,
  saveLotteryAttachment
} from '~/utils/lotteryAttachments'
import type { LotteryOrganization, LotteryStatus } from '~/utils/lotteryGames'
import { getGameById } from '~/utils/lotteryGames'
import { isDateInPeriod, type PeriodFilter } from '~/utils/lotteryPeriods'

export interface LotteryTicket {
  id: string
  title: string
  organization: LotteryOrganization
  game: string // e.g. 'bonoloto', 'primitiva', 'euromillones', 'cupon_diario', 'cuponazo', 'nacional', etc.
  gameName: string
  date: string // ISO string of purchase or registration
  drawDate?: string // ISO string of the draw (fecha del sorteo)
  numbers?: string // e.g. "04 15 23 38 42 49 (R: 5)", "74819 serie 4 frac 1"
  betsCount?: number // number of bets played
  cost: number // Gasto en euros
  status: LotteryStatus // 'pending' | 'won' | 'lost' | 'refund'
  prize: number // Premio obtenido en euros (0 si no premiado o pendiente)
  ticketPhoto?: string // data URL in memory
  ticketPhotoId?: string // IndexedDB key
  ticketPhotoName?: string
  ticketPhotoType?: string
  ticketPhotoSize?: number
  notes?: string
  createdAt: string
  updatedAt: string
}

export interface LotterySaveResult {
  ticket: LotteryTicket
  attachmentRemoved: boolean
}

const stripPersistedTicketPhoto = (ticket: LotteryTicket): LotteryTicket => {
  if (!ticket.ticketPhoto) return ticket
  const { ticketPhoto: _p, ...rest } = ticket
  return rest as LotteryTicket
}

const persistTicketsSnapshot = async (tickets: LotteryTicket[]): Promise<void> => {
  await persistSetTickets(tickets.map(stripPersistedTicketPhoto))
}

const prepareTicketForSave = async (ticket: LotteryTicket): Promise<LotteryTicket> => {
  if (!ticket.ticketPhoto) return ticket

  const photoId = ticket.ticketPhotoId || buildLotteryAttachmentId(ticket.id)
  const saved = await saveLotteryAttachment({
    id: photoId,
    dataUrl: ticket.ticketPhoto,
    name: ticket.ticketPhotoName,
    type: ticket.ticketPhotoType
  })

  return {
    ...ticket,
    ticketPhotoId: photoId,
    ticketPhotoSize: saved.size
  }
}

export const useLotteryStore = defineStore('lottery', {
  state: () => ({
    tickets: [] as LotteryTicket[],
    isLoaded: false
  }),

  getters: {
    // Total spent across all tickets
    allTotalCost: (state): number =>
      state.tickets.reduce((sum, t) => sum + (t.cost || 0), 0),

    // Total prizes won across all tickets
    allTotalPrizes: (state): number =>
      state.tickets.reduce((sum, t) => sum + (t.prize || 0), 0),

    // Net balance across all tickets (Premios - Gasto)
    allNetBalance(): number {
      return this.allTotalPrizes - this.allTotalCost
    },

    // Return filtered tickets by period, organization, game and status
    getFilteredTickets: (state) => (options?: {
      period?: PeriodFilter
      organization?: LotteryOrganization | 'all'
      game?: string | 'all'
      status?: LotteryStatus | 'all'
      search?: string
    }): LotteryTicket[] => {
      let result = [...state.tickets]

      if (options?.period && options.period.type !== 'all') {
        result = result.filter(t => isDateInPeriod(t.drawDate || t.date, options.period!))
      }

      if (options?.organization && options.organization !== 'all') {
        result = result.filter(t => t.organization === options.organization)
      }

      if (options?.game && options.game !== 'all') {
        result = result.filter(t => t.game === options.game)
      }

      if (options?.status && options.status !== 'all') {
        result = result.filter(t => t.status === options.status)
      }

      if (options?.search && options.search.trim()) {
        const query = options.search.toLowerCase().trim()
        result = result.filter(t =>
          t.title.toLowerCase().includes(query) ||
          t.gameName.toLowerCase().includes(query) ||
          (t.numbers && t.numbers.toLowerCase().includes(query)) ||
          (t.notes && t.notes.toLowerCase().includes(query))
        )
      }

      // Sort by drawDate descending (most recent first)
      return result.sort((a, b) => {
        const dateA = new Date(a.drawDate || a.date).getTime()
        const dateB = new Date(b.drawDate || b.date).getTime()
        return dateB - dateA
      })
    },

    // Calculate simultaneous financial metrics for any filtered tickets subset
    calculateMetrics: () => (ticketsList: LotteryTicket[]) => {
      const totalCost = ticketsList.reduce((sum, t) => sum + (t.cost || 0), 0)
      const totalPrizes = ticketsList.reduce((sum, t) => sum + (t.prize || 0), 0)
      const netBalance = totalPrizes - totalCost
      const roi = totalCost > 0 ? (totalPrizes / totalCost) * 100 : 0

      const totalCount = ticketsList.length
      const wonCount = ticketsList.filter(t => t.status === 'won').length
      const lostCount = ticketsList.filter(t => t.status === 'lost').length
      const pendingCount = ticketsList.filter(t => t.status === 'pending').length
      const refundCount = ticketsList.filter(t => t.status === 'refund').length

      const winRate = (wonCount + refundCount + lostCount) > 0
        ? ((wonCount + refundCount) / (wonCount + refundCount + lostCount)) * 100
        : 0

      const maxPrize = ticketsList.reduce((max, t) => Math.max(max, t.prize || 0), 0)

      return {
        totalCost,
        totalPrizes,
        netBalance,
        roi,
        totalCount,
        wonCount,
        lostCount,
        pendingCount,
        refundCount,
        winRate,
        maxPrize
      }
    }
  },

  actions: {
    async loadTickets(): Promise<void> {
      if (this.isLoaded) return
      try {
        const stored = await persistGetTickets()
        if (stored && Array.isArray(stored)) {
          this.tickets = stored
        }
      } catch (e) {
        console.error('Error loading tickets from IndexedDB:', e)
      } finally {
        this.isLoaded = true
      }
    },

    async saveTicket(ticket: LotteryTicket): Promise<LotterySaveResult> {
      const now = new Date().toISOString()
      const existingIndex = this.tickets.findIndex(t => t.id === ticket.id)

      let attachmentRemoved = false
      if (existingIndex !== -1) {
        const existing = this.tickets[existingIndex]
        if (existing.ticketPhotoId && !ticket.ticketPhoto && !ticket.ticketPhotoId) {
          await deleteLotteryAttachment(existing.ticketPhotoId)
          attachmentRemoved = true
        }
      }

      const preparedTicket = await prepareTicketForSave({
        ...ticket,
        updatedAt: now,
        createdAt: ticket.createdAt || now
      })

      if (existingIndex !== -1) {
        this.tickets[existingIndex] = preparedTicket
      } else {
        this.tickets.unshift(preparedTicket)
      }

      await persistTicketsSnapshot(this.tickets)
      return { ticket: preparedTicket, attachmentRemoved }
    },

    async updatePrizeStatus(ticketId: string, status: LotteryStatus, prizeAmount: number = 0): Promise<void> {
      const ticket = this.tickets.find(t => t.id === ticketId)
      if (!ticket) return

      ticket.status = status
      ticket.prize = status === 'won' ? Math.max(0, prizeAmount) : (status === 'refund' ? ticket.cost : 0)
      ticket.updatedAt = new Date().toISOString()

      await persistTicketsSnapshot(this.tickets)
    },

    async deleteTicket(id: string): Promise<void> {
      const index = this.tickets.findIndex(t => t.id === id)
      if (index === -1) return

      const ticket = this.tickets[index]
      if (ticket.ticketPhotoId) {
        await deleteLotteryAttachment(ticket.ticketPhotoId)
      }

      this.tickets.splice(index, 1)
      await persistTicketsSnapshot(this.tickets)
    },

    async clearAll(): Promise<void> {
      const photoIds = this.tickets
        .map(t => t.ticketPhotoId)
        .filter((id): id is string => Boolean(id))

      if (photoIds.length > 0) {
        await deleteLotteryAttachments(photoIds)
      }

      this.tickets = []
      await persistTicketsSnapshot([])
    },

    /**
     * Seeds realistic lottery tickets across ONLAE, ONCE and Otros,
     * covering different weeks, wins, losses and pending draws for instant testing.
     */
    async loadSampleData(): Promise<void> {
      const today = new Date()
      const d = (daysAgo: number) => {
        const date = new Date(today.getTime() - daysAgo * 86400000)
        return date.toISOString().slice(0, 10)
      }

      const sampleTickets: LotteryTicket[] = [
        {
          id: 'sample-1',
          title: 'Euromillones 2 apuestas Viernes',
          organization: 'onlae',
          game: 'euromillones',
          gameName: 'Euromillones',
          date: d(1),
          drawDate: d(1),
          numbers: '08 19 24 33 46 + 02 08 (El Millón: BCD89234)',
          betsCount: 2,
          cost: 5.00,
          status: 'won',
          prize: 48.50,
          notes: 'Acertados 3 números + 1 estrella',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        },
        {
          id: 'sample-2',
          title: 'Bonoloto semanal 4 apuestas',
          organization: 'onlae',
          game: 'bonoloto',
          gameName: 'Bonoloto',
          date: d(3),
          drawDate: d(3),
          numbers: '03 14 22 29 35 41 (R: 7)',
          betsCount: 4,
          cost: 2.00,
          status: 'refund',
          prize: 2.00,
          notes: 'Acertado el reintegro',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        },
        {
          id: 'sample-3',
          title: 'Cuponazo de la ONCE',
          organization: 'once',
          game: 'cuponazo',
          gameName: 'Cuponazo',
          date: d(7),
          drawDate: d(7),
          numbers: '84920 Serie 042',
          betsCount: 1,
          cost: 3.00,
          status: 'won',
          prize: 150.00,
          notes: 'Premio a las cuatro últimas cifras',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        },
        {
          id: 'sample-4',
          title: 'La Primitiva + Joker',
          organization: 'onlae',
          game: 'primitiva',
          gameName: 'La Primitiva',
          date: d(10),
          drawDate: d(10),
          numbers: '05 12 18 27 34 45 (R: 3, Joker: 9283716)',
          betsCount: 2,
          cost: 3.00,
          status: 'lost',
          prize: 0,
          notes: 'Sin premio en esta jornada',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        },
        {
          id: 'sample-5',
          title: 'Sueldazo Fin de Semana ONCE',
          organization: 'once',
          game: 'sueldazo',
          gameName: 'Sueldazo',
          date: d(14),
          drawDate: d(14),
          numbers: '32109 Serie 018',
          betsCount: 1,
          cost: 2.00,
          status: 'lost',
          prize: 0,
          notes: 'No premiado',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        },
        {
          id: 'sample-6',
          title: 'Décimo Lotería Nacional Jueves',
          organization: 'onlae',
          game: 'nacional',
          gameName: 'Lotería Nacional',
          date: d(16),
          drawDate: d(16),
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
          id: 'sample-7',
          title: 'Cupón Diario ONCE',
          organization: 'once',
          game: 'cupon_diario',
          gameName: 'Cupón Diario',
          date: d(20),
          drawDate: d(20),
          numbers: '19472 Serie 005',
          betsCount: 1,
          cost: 2.00,
          status: 'lost',
          prize: 0,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        },
        {
          id: 'sample-8',
          title: 'Eurojackpot ONCE 2 columnas',
          organization: 'once',
          game: 'eurojackpot',
          gameName: 'Eurojackpot',
          date: d(22),
          drawDate: d(22),
          numbers: '11 17 28 35 44 + 03 09',
          betsCount: 2,
          cost: 4.00,
          status: 'won',
          prize: 16.40,
          notes: '2 soles + 2 números',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        },
        {
          id: 'sample-9',
          title: 'La Grossa Cap d\'Any (Loto Catalunya)',
          organization: 'otros',
          game: 'loto_catalunya',
          gameName: 'Loto Catalunya',
          date: d(25),
          drawDate: d(25),
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
          id: 'sample-10',
          title: 'Rifa Cesta de Navidad Asociación',
          organization: 'otros',
          game: 'rifas',
          gameName: 'Rifas y Cestas',
          date: d(28),
          drawDate: d(28),
          numbers: 'Tira de 5 números: 450 al 454',
          betsCount: 5,
          cost: 5.00,
          status: 'lost',
          prize: 0,
          notes: 'Colaboración benéfica',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        },
        {
          id: 'sample-11',
          title: 'Peña Euromillones del trabajo',
          organization: 'otros',
          game: 'peñas',
          gameName: 'Peñas / Amigos',
          date: d(30),
          drawDate: d(30),
          numbers: '10 apuestas múltiples peña',
          betsCount: 10,
          cost: 10.00,
          status: 'won',
          prize: 35.80,
          notes: 'Reparto de premio de peña',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        },
        {
          id: 'sample-12',
          title: 'Décimo Lotería de Navidad 2026',
          organization: 'onlae',
          game: 'navidad_nino',
          gameName: 'Navidad / El Niño',
          date: d(0),
          drawDate: '2026-12-22',
          numbers: '79241 Fracción 7 Serie 124',
          betsCount: 1,
          cost: 20.00,
          status: 'pending',
          prize: 0,
          notes: 'Comprado en Doña Manolita para el sorteo del 22 de diciembre',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        },
        {
          id: 'sample-13',
          title: 'La Primitiva de este fin de semana',
          organization: 'onlae',
          game: 'primitiva',
          gameName: 'La Primitiva',
          date: d(0),
          drawDate: d(-1),
          numbers: '07 16 25 31 40 48 (R: 4)',
          betsCount: 2,
          cost: 2.00,
          status: 'pending',
          prize: 0,
          notes: 'Pendiente de celebrar el sorteo',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }
      ]

      this.tickets = sampleTickets
      await persistTicketsSnapshot(this.tickets)
    }
  }
})
