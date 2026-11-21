<script setup lang="ts">
import { storeToRefs } from 'pinia'
import type { LotteryTicket } from '~/stores/lottery'
import type { LotteryOrganization, LotteryStatus } from '~/utils/lotteryGames'
import type { PeriodFilter } from '~/utils/lotteryPeriods'
import { getIsoWeekString } from '~/utils/lotteryPeriods'

const lotteryStore = useLotteryStore()
const { tickets } = storeToRefs(lotteryStore)

// Active filters
const currentWeek = getIsoWeekString(new Date())
const selectedPeriod = ref<PeriodFilter>({
  type: 'week',
  week: currentWeek
})
const selectedOrg = ref<LotteryOrganization | 'all'>('all')

// Modals
const isFormModalOpen = ref(false)
const selectedTicketForEdit = ref<LotteryTicket | null>(null)

const isPrizeModalOpen = ref(false)
const selectedTicketForPrize = ref<LotteryTicket | null>(null)

const isViewerModalOpen = ref(false)
const viewerPhotoUrl = ref<string | null>(null)
const viewerPhotoTitle = ref<string>('')

// All ticket dates for the period generator
const allDates = computed(() => tickets.value.map(t => t.drawDate || t.date))

// Filtered tickets based on active period and organization
const filteredTickets = computed(() => {
  return lotteryStore.getFilteredTickets({
    period: selectedPeriod.value,
    organization: selectedOrg.value
  })
})

// Financial metrics computed simultaneously
const metrics = computed(() => {
  return lotteryStore.calculateMetrics(filteredTickets.value)
})

// Modal Openers
const handleOpenNewTicket = () => {
  selectedTicketForEdit.value = null
  isFormModalOpen.value = true
}

const handleEditTicket = (ticket: LotteryTicket) => {
  selectedTicketForEdit.value = ticket
  isFormModalOpen.value = true
}

const handleCheckPrize = (ticket: LotteryTicket) => {
  selectedTicketForPrize.value = ticket
  isPrizeModalOpen.value = true
}

const handleUpdatePrize = async (payload: { ticketId: string, status: LotteryStatus, prize: number }) => {
  await lotteryStore.updatePrizeStatus(payload.ticketId, payload.status, payload.prize)
}

const handleDeleteTicket = async (id: string) => {
  if (confirm('¿Eliminar este boleto?')) {
    await lotteryStore.deleteTicket(id)
  }
}

const handleViewPhoto = (url: string, title: string) => {
  viewerPhotoUrl.value = url
  viewerPhotoTitle.value = title
  isViewerModalOpen.value = true
}
</script>

<template>
  <div class="space-y-6">
    <!-- Top Greeting & Header Banner -->
    <div class="rounded-3xl lottery-gradient-header text-white p-6 sm:p-8 shadow-xl relative overflow-hidden">
      <!-- Background subtle decorative shapes -->
      <div class="absolute -right-8 -bottom-8 size-48 rounded-full bg-white/10 blur-2xl pointer-events-none" />
      <div class="absolute right-12 top-4 size-24 rounded-full bg-yellow-400/20 blur-xl pointer-events-none" />

      <div class="relative z-10 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div class="flex items-center gap-2 mb-1.5">
            <span class="px-2.5 py-0.5 rounded-full text-[11px] font-black uppercase tracking-wider bg-white/20 text-white backdrop-blur-xs">
              Control de Loterías
            </span>
            <span class="text-xs text-blue-200">ONLAE · ONCE · Otros</span>
          </div>

          <h1 class="text-2xl sm:text-3xl font-black tracking-tight text-white">
            Panel de Boletos y Premios
          </h1>
          <p class="text-sm text-blue-100 mt-1 max-w-xl">
            Registra tus boletos mediante foto, controla tus gastos semanales y analiza el retorno de tus premios.
          </p>
        </div>

        <div class="flex items-center gap-2 shrink-0">
          <UButton
            color="primary"
            variant="solid"
            size="lg"
            icon="i-heroicons-plus"
            label="Añadir Boleto"
            class="bg-white text-brand-900 hover:bg-blue-50 font-bold shadow-lg"
            @click="handleOpenNewTicket"
          />
        </div>
      </div>
    </div>

    <!-- 1. PERIOD FILTER BAR (Semanal, Mensual, Anual, Histórico, Rango) -->
    <PeriodFilterBar v-model="selectedPeriod" :ticket-dates="allDates" />

    <!-- 2. SIMULTANEOUS FINANCIAL METRICS SECTION -->
    <div class="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
      <!-- Gasto Total -->
      <div class="rounded-3xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 p-4 sm:p-5 shadow-xs flex flex-col justify-between">
        <div class="flex items-center justify-between">
          <span class="text-xs font-bold uppercase tracking-wider text-gray-400">Gasto Total</span>
          <div class="size-8 rounded-xl bg-blue-50 dark:bg-blue-950 flex items-center justify-center text-brand-600 dark:text-brand-400">
            <UIcon name="i-heroicons-shopping-bag" class="size-4" />
          </div>
        </div>
        <div class="mt-2">
          <span class="text-2xl sm:text-3xl font-black text-gray-900 dark:text-white block">
            {{ metrics.totalCost.toFixed(2) }} €
          </span>
          <span class="text-xs text-gray-500 dark:text-gray-400 mt-0.5 block">
            En {{ metrics.totalCount }} boletos jugados
          </span>
        </div>
      </div>

      <!-- Premios Totales -->
      <div class="rounded-3xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 p-4 sm:p-5 shadow-xs flex flex-col justify-between">
        <div class="flex items-center justify-between">
          <span class="text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">Premios Totales</span>
          <div class="size-8 rounded-xl bg-emerald-50 dark:bg-emerald-950 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
            <UIcon name="i-heroicons-trophy" class="size-4" />
          </div>
        </div>
        <div class="mt-2">
          <span class="text-2xl sm:text-3xl font-black text-emerald-600 dark:text-emerald-400 block">
            {{ metrics.totalPrizes.toFixed(2) }} €
          </span>
          <span class="text-xs text-gray-500 dark:text-gray-400 mt-0.5 block">
            {{ metrics.wonCount }} premiados + {{ metrics.refundCount }} reintegros
          </span>
        </div>
      </div>

      <!-- BALANCE NETO (PREMIOS - GASTO) -->
      <div
        class="rounded-3xl p-4 sm:p-5 shadow-xs flex flex-col justify-between border"
        :class="{
          'bg-emerald-500/10 border-emerald-500/30 text-emerald-950 dark:text-emerald-100': metrics.netBalance > 0,
          'bg-cyan-500/10 border-cyan-500/30 text-cyan-950 dark:text-cyan-100': metrics.netBalance === 0,
          'bg-rose-500/10 border-rose-500/30 text-rose-950 dark:text-rose-100': metrics.netBalance < 0
        }"
      >
        <div class="flex items-center justify-between">
          <span class="text-xs font-bold uppercase tracking-wider" :class="metrics.netBalance >= 0 ? 'text-emerald-700 dark:text-emerald-300' : 'text-rose-700 dark:text-rose-300'">
            Balance Neto
          </span>
          <div
            class="size-8 rounded-xl flex items-center justify-center"
            :class="metrics.netBalance >= 0 ? 'bg-emerald-100 dark:bg-emerald-900 text-emerald-700 dark:text-emerald-200' : 'bg-rose-100 dark:bg-rose-900 text-rose-700 dark:text-rose-200'"
          >
            <UIcon :name="metrics.netBalance >= 0 ? 'i-heroicons-arrow-trending-up' : 'i-heroicons-arrow-trending-down'" class="size-4" />
          </div>
        </div>
        <div class="mt-2">
          <span
            class="text-2xl sm:text-3xl font-black block"
            :class="metrics.netBalance > 0 ? 'text-emerald-600 dark:text-emerald-400' : (metrics.netBalance === 0 ? 'text-cyan-600 dark:text-cyan-400' : 'text-rose-600 dark:text-rose-400')"
          >
            {{ metrics.netBalance > 0 ? `+${metrics.netBalance.toFixed(2)}` : metrics.netBalance.toFixed(2) }} €
          </span>
          <span class="text-xs opacity-75 mt-0.5 block font-medium">
            {{ metrics.netBalance > 0 ? 'Beneficio en el periodo' : (metrics.netBalance === 0 ? 'Equilibrado' : 'Retorno inferior a gasto') }}
          </span>
        </div>
      </div>

      <!-- Retorno / ROI (%) -->
      <div class="rounded-3xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 p-4 sm:p-5 shadow-xs flex flex-col justify-between">
        <div class="flex items-center justify-between">
          <span class="text-xs font-bold uppercase tracking-wider text-gray-400">Retorno (ROI)</span>
          <div class="size-8 rounded-xl bg-purple-50 dark:bg-purple-950 flex items-center justify-center text-purple-600 dark:text-purple-400">
            <UIcon name="i-heroicons-chart-pie" class="size-4" />
          </div>
        </div>
        <div class="mt-2">
          <span class="text-2xl sm:text-3xl font-black text-gray-900 dark:text-white block">
            {{ metrics.roi.toFixed(1) }} %
          </span>
          <span class="text-xs text-gray-500 dark:text-gray-400 mt-0.5 block">
            {{ metrics.winRate.toFixed(1) }}% boletos premiados
          </span>
        </div>
      </div>
    </div>

    <!-- 3. ORGANIZATION FILTER PILLS -->
    <div class="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
      <button
        type="button"
        class="px-4 py-2 rounded-2xl text-xs font-bold transition-all cursor-pointer shrink-0 border"
        :class="selectedOrg === 'all'
          ? 'bg-brand-600 text-white border-brand-600 shadow-xs'
          : 'bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-800 hover:bg-gray-50'"
        @click="selectedOrg = 'all'"
      >
        Todas las Organizaciones ({{ tickets.length }})
      </button>

      <button
        type="button"
        class="px-4 py-2 rounded-2xl text-xs font-bold transition-all cursor-pointer shrink-0 border flex items-center gap-2"
        :class="selectedOrg === 'onlae'
          ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
          : 'bg-white dark:bg-gray-900 text-blue-700 dark:text-blue-300 border-gray-200 dark:border-gray-800 hover:bg-blue-50/50'"
        @click="selectedOrg = 'onlae'"
      >
        <UIcon name="i-heroicons-building-library" class="size-4" />
        ONLAE / SELAE
      </button>

      <button
        type="button"
        class="px-4 py-2 rounded-2xl text-xs font-bold transition-all cursor-pointer shrink-0 border flex items-center gap-2"
        :class="selectedOrg === 'once'
          ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
          : 'bg-white dark:bg-gray-900 text-emerald-700 dark:text-emerald-300 border-gray-200 dark:border-gray-800 hover:bg-emerald-50/50'"
        @click="selectedOrg = 'once'"
      >
        <UIcon name="i-heroicons-sparkles" class="size-4" />
        ONCE
      </button>

      <button
        type="button"
        class="px-4 py-2 rounded-2xl text-xs font-bold transition-all cursor-pointer shrink-0 border flex items-center gap-2"
        :class="selectedOrg === 'otros'
          ? 'bg-purple-600 text-white border-purple-600 shadow-xs'
          : 'bg-white dark:bg-gray-900 text-purple-700 dark:text-purple-300 border-gray-200 dark:border-gray-800 hover:bg-purple-50/50'"
        @click="selectedOrg = 'otros'"
      >
        <UIcon name="i-heroicons-puzzle-piece" class="size-4" />
        Otras Loterías
      </button>
    </div>

    <!-- 4. TICKETS LIST SECTION -->
    <div class="space-y-4">
      <div class="flex items-center justify-between">
        <div>
          <h2 class="text-lg font-black text-gray-900 dark:text-white">
            Boletos en este periodo
          </h2>
          <p class="text-xs text-gray-500 dark:text-gray-400">
            {{ filteredTickets.length }} boletos registrados
          </p>
        </div>

        <NuxtLink
          to="/tickets"
          class="text-xs font-bold text-brand-600 dark:text-brand-400 hover:underline flex items-center gap-1"
        >
          <span>Ver todos los boletos</span>
          <UIcon name="i-heroicons-arrow-right" class="size-3.5" />
        </NuxtLink>
      </div>

      <!-- Empty State -->
      <div
        v-if="filteredTickets.length === 0"
        class="p-12 text-center rounded-3xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 space-y-3"
      >
        <div class="size-14 rounded-2xl bg-blue-50 dark:bg-blue-950 flex items-center justify-center text-brand-600 dark:text-brand-400 mx-auto">
          <UIcon name="i-heroicons-ticket" class="size-7" />
        </div>
        <h3 class="text-base font-bold text-gray-900 dark:text-white">
          No hay boletos en este periodo
        </h3>
        <p class="text-xs text-gray-500 dark:text-gray-400 max-w-sm mx-auto">
          Añade tu primer boleto de lotería sacándole una foto o seleccionando el sorteo.
        </p>
        <div class="pt-2 flex flex-wrap justify-center gap-2">
          <UButton
            color="primary"
            icon="i-heroicons-camera"
            label="Añadir Boleto con Foto"
            @click="handleOpenNewTicket"
          />
          <UButton
            color="neutral"
            variant="ghost"
            icon="i-heroicons-sparkles"
            label="Cargar Boletos de Prueba"
            @click="lotteryStore.loadSampleData"
          />
        </div>
      </div>

      <!-- Grid of Ticket Cards -->
      <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <TicketCard
          v-for="ticket in filteredTickets"
          :key="ticket.id"
          :ticket="ticket"
          @edit="handleEditTicket"
          @delete="handleDeleteTicket"
          @check-prize="handleCheckPrize"
          @view-photo="handleViewPhoto"
        />
      </div>
    </div>

    <!-- Floating Action Button for Mobile -->
    <div class="fixed page-floating-action right-5 z-40 md:hidden">
      <UButton
        size="xl"
        color="primary"
        icon="i-heroicons-camera"
        class="rounded-full shadow-2xl p-4"
        aria-label="Añadir boleto"
        @click="handleOpenNewTicket"
      />
    </div>

    <!-- Modals -->
    <TicketFormModal
      v-model:open="isFormModalOpen"
      :initial-data="selectedTicketForEdit"
    />

    <CheckPrizeModal
      v-model:open="isPrizeModalOpen"
      :ticket="selectedTicketForPrize"
      @update="handleUpdatePrize"
    />

    <TicketViewerModal
      v-model:open="isViewerModalOpen"
      :src="viewerPhotoUrl"
      :title="viewerPhotoTitle"
    />
  </div>
</template>
