<script setup lang="ts">
import { storeToRefs } from 'pinia'
import type { LotteryTicket } from '~/stores/lottery'
import type { LotteryOrganization } from '~/utils/lotteryGames'
import {
  LOTTERY_ORGANIZATIONS,
  getGameById
} from '~/utils/lotteryGames'
import type { PeriodFilter } from '~/utils/lotteryPeriods'
import {
  getIsoWeekString,
  getPeriodSummaryLabel,
  isDateInPeriod
} from '~/utils/lotteryPeriods'

const lotteryStore = useLotteryStore()
const { tickets } = storeToRefs(lotteryStore)

// Period Filter
const currentWeek = getIsoWeekString(new Date())
const selectedPeriod = ref<PeriodFilter>({
  type: 'week',
  week: currentWeek
})

const selectedOrg = ref<LotteryOrganization | 'all'>('all')

const allDates = computed(() => tickets.value.map(t => t.drawDate || t.date))

// Filtered Tickets
const filteredTickets = computed(() => {
  return lotteryStore.getFilteredTickets({
    period: selectedPeriod.value,
    organization: selectedOrg.value
  })
})

// Simultaneous Core Metrics
const metrics = computed(() => {
  return lotteryStore.calculateMetrics(filteredTickets.value)
})

// Breakdown by Organization (ONLAE vs ONCE vs Otros)
const orgStats = computed(() => {
  const orgs: LotteryOrganization[] = ['onlae', 'once', 'otros']
  return orgs.map(orgKey => {
    const orgTickets = filteredTickets.value.filter(t => t.organization === orgKey)
    const cost = orgTickets.reduce((sum, t) => sum + (t.cost || 0), 0)
    const prize = orgTickets.reduce((sum, t) => sum + (t.prize || 0), 0)
    const balance = prize - cost
    const roi = cost > 0 ? (prize / cost) * 100 : 0
    const info = LOTTERY_ORGANIZATIONS[orgKey]

    return {
      orgKey,
      info,
      count: orgTickets.length,
      cost,
      prize,
      balance,
      roi,
      costPercentage: metrics.value.totalCost > 0 ? (cost / metrics.value.totalCost) * 100 : 0
    }
  }).filter(o => o.count > 0 || selectedOrg.value === o.orgKey)
})

// Breakdown by Game
const gameStats = computed(() => {
  const map = new Map<string, {
    gameId: string
    count: number
    cost: number
    prize: number
    wonCount: number
  }>()

  filteredTickets.value.forEach(t => {
    const existing = map.get(t.game) || {
      gameId: t.game,
      count: 0,
      cost: 0,
      prize: 0,
      wonCount: 0
    }
    existing.count += 1
    existing.cost += (t.cost || 0)
    existing.prize += (t.prize || 0)
    if (t.status === 'won' || t.status === 'refund') {
      existing.wonCount += 1
    }
    map.set(t.game, existing)
  })

  return Array.from(map.values()).map(g => {
    const gameDef = getGameById(g.gameId)
    const balance = g.prize - g.cost
    const roi = g.cost > 0 ? (g.prize / g.cost) * 100 : 0
    const winRate = g.count > 0 ? (g.wonCount / g.count) * 100 : 0
    return {
      ...g,
      gameDef,
      balance,
      roi,
      winRate
    }
  }).sort((a, b) => b.cost - a.cost)
})

// Recent Weeks Timeline Comparison (Last 6 weeks)
const recentWeeksTimeline = computed(() => {
  const weeks: { week: string, label: string, cost: number, prize: number, balance: number }[] = []
  const today = new Date()

  for (let i = 5; i >= 0; i--) {
    const d = new Date(today.getTime() - i * 7 * 86400000)
    const w = getIsoWeekString(d)
    const weekFilter: PeriodFilter = { type: 'week', week: w }

    const weekTickets = tickets.value.filter(t => {
      if (selectedOrg.value !== 'all' && t.organization !== selectedOrg.value) return false
      return isDateInPeriod(t.drawDate || t.date, weekFilter)
    })

    const cost = weekTickets.reduce((sum, t) => sum + (t.cost || 0), 0)
    const prize = weekTickets.reduce((sum, t) => sum + (t.prize || 0), 0)

    weeks.push({
      week: w,
      label: i === 0 ? 'Esta sem.' : (i === 1 ? 'Sem. ant.' : `W${w.split('-W')[1]}`),
      cost,
      prize,
      balance: prize - cost
    })
  }

  return weeks
})

const maxTimelineValue = computed(() => {
  let max = 10
  recentWeeksTimeline.value.forEach(w => {
    if (w.cost > max) max = w.cost
    if (w.prize > max) max = w.prize
  })
  return max
})
</script>

<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
      <div>
        <h1 class="text-2xl sm:text-3xl font-black text-gray-900 dark:text-white tracking-tight">
          Estadísticas de Gasto y Premios
        </h1>
        <p class="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-0.5">
          Análisis del balance financiero y retorno de inversión en loterías
        </p>
      </div>

      <!-- Quick Org Toggle -->
      <div class="flex items-center gap-1.5 bg-gray-100 dark:bg-gray-800 p-1 rounded-2xl">
        <button
          type="button"
          class="px-3 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer"
          :class="selectedOrg === 'all' ? 'bg-white dark:bg-gray-900 text-brand-600 shadow-xs' : 'text-gray-500 hover:text-gray-900 dark:hover:text-white'"
          @click="selectedOrg = 'all'"
        >
          Todas
        </button>
        <button
          type="button"
          class="px-3 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer"
          :class="selectedOrg === 'onlae' ? 'bg-white dark:bg-gray-900 text-blue-600 shadow-xs' : 'text-gray-500 hover:text-gray-900 dark:hover:text-white'"
          @click="selectedOrg = 'onlae'"
        >
          ONLAE
        </button>
        <button
          type="button"
          class="px-3 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer"
          :class="selectedOrg === 'once' ? 'bg-white dark:bg-gray-900 text-emerald-600 shadow-xs' : 'text-gray-500 hover:text-gray-900 dark:hover:text-white'"
          @click="selectedOrg = 'once'"
        >
          ONCE
        </button>
        <button
          type="button"
          class="px-3 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer"
          :class="selectedOrg === 'otros' ? 'bg-white dark:bg-gray-900 text-purple-600 shadow-xs' : 'text-gray-500 hover:text-gray-900 dark:hover:text-white'"
          @click="selectedOrg = 'otros'"
        >
          Otros
        </button>
      </div>
    </div>

    <!-- 1. PERIOD FILTER BAR (Semanal, Mensual, Anual, Histórico, Rango) -->
    <PeriodFilterBar v-model="selectedPeriod" :ticket-dates="allDates" />

    <!-- 2. SIMULTANEOUS KEY FINANCIAL CARDS -->
    <div class="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
      <!-- Gasto Total -->
      <div class="rounded-3xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 p-4 sm:p-5 shadow-xs">
        <span class="block text-[11px] font-bold uppercase tracking-wider text-gray-400">Total Gastado</span>
        <span class="text-2xl sm:text-3xl font-black text-gray-900 dark:text-white mt-1 block">
          {{ metrics.totalCost.toFixed(2) }} €
        </span>
        <span class="text-xs text-gray-500 mt-1 block">
          {{ metrics.totalCount }} boletos en este periodo
        </span>
      </div>

      <!-- Premios Totales -->
      <div class="rounded-3xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 p-4 sm:p-5 shadow-xs">
        <span class="block text-[11px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">Total Premios</span>
        <span class="text-2xl sm:text-3xl font-black text-emerald-600 dark:text-emerald-400 mt-1 block">
          {{ metrics.totalPrizes.toFixed(2) }} €
        </span>
        <span class="text-xs text-gray-500 mt-1 block">
          Mayor premio: {{ metrics.maxPrize.toFixed(2) }} €
        </span>
      </div>

      <!-- BALANCE NETO (SIMULTÁNEO) -->
      <div
        class="rounded-3xl p-4 sm:p-5 shadow-xs border"
        :class="{
          'bg-emerald-500/10 border-emerald-500/30 text-emerald-950 dark:text-emerald-100': metrics.netBalance > 0,
          'bg-cyan-500/10 border-cyan-500/30 text-cyan-950 dark:text-cyan-100': metrics.netBalance === 0,
          'bg-rose-500/10 border-rose-500/30 text-rose-950 dark:text-rose-100': metrics.netBalance < 0
        }"
      >
        <span class="block text-[11px] font-bold uppercase tracking-wider" :class="metrics.netBalance >= 0 ? 'text-emerald-700 dark:text-emerald-300' : 'text-rose-700 dark:text-rose-300'">
          Balance Neto (Premios - Gasto)
        </span>
        <span
          class="text-2xl sm:text-3xl font-black mt-1 block"
          :class="metrics.netBalance > 0 ? 'text-emerald-600 dark:text-emerald-400' : (metrics.netBalance === 0 ? 'text-cyan-600 dark:text-cyan-400' : 'text-rose-600 dark:text-rose-400')"
        >
          {{ metrics.netBalance > 0 ? `+${metrics.netBalance.toFixed(2)}` : metrics.netBalance.toFixed(2) }} €
        </span>
        <span class="text-xs opacity-75 mt-1 block font-medium">
          {{ metrics.netBalance > 0 ? '¡Ganancia neta positiva!' : (metrics.netBalance === 0 ? 'Gasto cubierto al 100%' : 'Pérdida neta en apuestas') }}
        </span>
      </div>

      <!-- Retorno de Inversión (ROI %) -->
      <div class="rounded-3xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 p-4 sm:p-5 shadow-xs">
        <span class="block text-[11px] font-bold uppercase tracking-wider text-gray-400">Retorno (ROI)</span>
        <span class="text-2xl sm:text-3xl font-black text-gray-900 dark:text-white mt-1 block">
          {{ metrics.roi.toFixed(1) }} %
        </span>
        <span class="text-xs text-gray-500 mt-1 block">
          {{ metrics.winRate.toFixed(1) }}% de boletos con premio
        </span>
      </div>
    </div>

    <!-- 3. COMPARATIVE VISUAL BALANCE BAR -->
    <div class="rounded-3xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 p-5 sm:p-6 shadow-xs space-y-4">
      <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <div>
          <h3 class="text-base font-bold text-gray-900 dark:text-white">
            Comparativa Visual: Gasto vs Premios
          </h3>
          <p class="text-xs text-gray-500 dark:text-gray-400">
            Relación de dinero apostado frente a retorno obtenido en {{ getPeriodSummaryLabel(selectedPeriod) }}
          </p>
        </div>

        <div class="flex items-center gap-4 text-xs font-bold">
          <span class="flex items-center gap-1.5 text-brand-600 dark:text-brand-400">
            <span class="size-3 rounded-full bg-brand-600 inline-block" />
            Gasto: {{ metrics.totalCost.toFixed(2) }} €
          </span>
          <span class="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400">
            <span class="size-3 rounded-full bg-emerald-500 inline-block" />
            Premios: {{ metrics.totalPrizes.toFixed(2) }} €
          </span>
        </div>
      </div>

      <!-- Comparative Bar -->
      <div class="space-y-2">
        <div class="w-full h-5 rounded-full bg-gray-100 dark:bg-gray-800 overflow-hidden flex p-1">
          <div
            class="h-full rounded-l-full bg-brand-600 transition-all duration-500"
            :style="{
              width: `${(metrics.totalCost + metrics.totalPrizes) > 0 ? (metrics.totalCost / (metrics.totalCost + metrics.totalPrizes)) * 100 : 50}%`
            }"
            title="Gasto en Loterías"
          />
          <div
            class="h-full rounded-r-full bg-emerald-500 transition-all duration-500"
            :style="{
              width: `${(metrics.totalCost + metrics.totalPrizes) > 0 ? (metrics.totalPrizes / (metrics.totalCost + metrics.totalPrizes)) * 100 : 50}%`
            }"
            title="Premios Obtenidos"
          />
        </div>

        <div class="flex justify-between text-[11px] text-gray-400 font-semibold px-1">
          <span>Gasto ({{ (metrics.totalCost + metrics.totalPrizes) > 0 ? ((metrics.totalCost / (metrics.totalCost + metrics.totalPrizes)) * 100).toFixed(0) : 50 }}%)</span>
          <span>Premios ({{ (metrics.totalCost + metrics.totalPrizes) > 0 ? ((metrics.totalPrizes / (metrics.totalCost + metrics.totalPrizes)) * 100).toFixed(0) : 50 }}%)</span>
        </div>
      </div>
    </div>

    <!-- 4. TIMELINE BAR CHART (LAST 6 WEEKS) -->
    <div class="rounded-3xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 p-5 sm:p-6 shadow-xs space-y-4">
      <div>
        <h3 class="text-base font-bold text-gray-900 dark:text-white">
          Evolución Semanal Reciente (Gasto vs Premios)
        </h3>
        <p class="text-xs text-gray-500 dark:text-gray-400">
          Trayectoria de apuestas y premios a lo largo de las últimas 6 semanas
        </p>
      </div>

      <div class="grid grid-cols-6 gap-2 sm:gap-4 pt-4 items-end h-44">
        <div
          v-for="item in recentWeeksTimeline"
          :key="item.week"
          class="flex flex-col items-center h-full justify-end group"
        >
          <!-- Bars container -->
          <div class="flex items-end gap-1 sm:gap-2 h-32 w-full justify-center">
            <!-- Gasto bar -->
            <div
              class="w-3 sm:w-6 bg-brand-500 rounded-t-md transition-all duration-300 relative group-hover:bg-brand-600"
              :style="{ height: `${Math.max(4, (item.cost / maxTimelineValue) * 100)}%` }"
              :title="`Gasto: ${item.cost.toFixed(2)} €`"
            />
            <!-- Premio bar -->
            <div
              class="w-3 sm:w-6 bg-emerald-500 rounded-t-md transition-all duration-300 relative group-hover:bg-emerald-600"
              :style="{ height: `${Math.max(4, (item.prize / maxTimelineValue) * 100)}%` }"
              :title="`Premios: ${item.prize.toFixed(2)} €`"
            />
          </div>

          <!-- Label -->
          <span class="text-[11px] font-bold text-gray-500 dark:text-gray-400 mt-2 truncate w-full text-center">
            {{ item.label }}
          </span>

          <!-- Net result badge -->
          <span
            class="text-[10px] font-extrabold mt-0.5"
            :class="item.balance >= 0 ? 'text-emerald-600' : 'text-gray-400'"
          >
            {{ item.balance > 0 ? `+${item.balance.toFixed(0)}€` : (item.balance === 0 ? '0€' : `${item.balance.toFixed(0)}€`) }}
          </span>
        </div>
      </div>
    </div>

    <!-- 5. BREAKDOWN BY ORGANIZATION & BY GAME -->
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <!-- Breakdown by Organization -->
      <div class="rounded-3xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 p-5 sm:p-6 shadow-xs space-y-4">
        <div>
          <h3 class="text-base font-bold text-gray-900 dark:text-white">
            Por Organización (ONLAE / ONCE / Otros)
          </h3>
          <p class="text-xs text-gray-500 dark:text-gray-400">
            Comparativa de gasto y rentabilidad por organismo de lotería
          </p>
        </div>

        <div v-if="orgStats.length === 0" class="text-center py-8 text-xs text-gray-400">
          No hay datos en este periodo
        </div>

        <div v-else class="space-y-3">
          <div
            v-for="org in orgStats"
            :key="org.orgKey"
            class="p-3.5 rounded-2xl bg-gray-50 dark:bg-gray-800/40 border border-gray-100 dark:border-gray-800 space-y-2"
          >
            <div class="flex items-center justify-between text-xs">
              <div class="flex items-center gap-2">
                <UIcon :name="org.info.icon" class="size-4" :style="{ color: org.info.hexColor }" />
                <span class="font-bold text-gray-900 dark:text-white">{{ org.info.name }}</span>
                <span class="text-gray-400">({{ org.count }} boletos)</span>
              </div>

              <!-- ROI -->
              <span
                class="px-2 py-0.5 rounded-md text-[11px] font-black"
                :class="org.balance >= 0 ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300' : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'"
              >
                ROI: {{ org.roi.toFixed(1) }}%
              </span>
            </div>

            <!-- Numbers -->
            <div class="grid grid-cols-3 gap-2 text-xs pt-1">
              <div>
                <span class="text-gray-400 block text-[10px] uppercase">Gasto</span>
                <strong class="text-gray-900 dark:text-white">{{ org.cost.toFixed(2) }} €</strong>
              </div>
              <div>
                <span class="text-gray-400 block text-[10px] uppercase">Premios</span>
                <strong class="text-emerald-600 dark:text-emerald-400">{{ org.prize.toFixed(2) }} €</strong>
              </div>
              <div>
                <span class="text-gray-400 block text-[10px] uppercase">Balance</span>
                <strong :class="org.balance >= 0 ? 'text-emerald-600' : 'text-rose-600'">
                  {{ org.balance > 0 ? `+${org.balance.toFixed(2)}` : org.balance.toFixed(2) }} €
                </strong>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Breakdown by Game -->
      <div class="rounded-3xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 p-5 sm:p-6 shadow-xs space-y-4">
        <div>
          <h3 class="text-base font-bold text-gray-900 dark:text-white">
            Rentabilidad por Tipo de Juego
          </h3>
          <p class="text-xs text-gray-500 dark:text-gray-400">
            Juegos con mayor volumen y tasa de retorno
          </p>
        </div>

        <div v-if="gameStats.length === 0" class="text-center py-8 text-xs text-gray-400">
          No hay datos en este periodo
        </div>

        <div v-else class="space-y-2.5 max-h-[380px] overflow-y-auto pr-1">
          <div
            v-for="game in gameStats"
            :key="game.gameId"
            class="p-3 rounded-2xl bg-gray-50 dark:bg-gray-800/40 border border-gray-100 dark:border-gray-800 flex items-center justify-between text-xs"
          >
            <div class="flex items-center gap-3">
              <div
                class="size-8 rounded-xl flex items-center justify-center shrink-0"
                :style="{ backgroundColor: `${game.gameDef.hexColor}20`, color: game.gameDef.hexColor }"
              >
                <UIcon :name="game.gameDef.icon" class="size-4" />
              </div>
              <div>
                <span class="font-bold text-gray-900 dark:text-white block">{{ game.gameDef.name }}</span>
                <span class="text-[11px] text-gray-400">
                  {{ game.count }} apuestas · {{ game.winRate.toFixed(0) }}% aciertos
                </span>
              </div>
            </div>

            <div class="text-right">
              <span class="font-bold text-gray-900 dark:text-white block">
                {{ game.cost.toFixed(2) }} € jugados
              </span>
              <span
                class="text-[11px] font-black"
                :class="game.balance >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'"
              >
                {{ game.balance > 0 ? `+${game.balance.toFixed(2)}` : game.balance.toFixed(2) }} € ({{ game.roi.toFixed(0) }}%)
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
