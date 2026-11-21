<script setup lang="ts">
import { storeToRefs } from 'pinia'
import type { LotteryTicket } from '~/stores/lottery'
import type { LotteryOrganization, LotteryStatus } from '~/utils/lotteryGames'
import {
  getGamesByOrganization
} from '~/utils/lotteryGames'
import type { PeriodFilter } from '~/utils/lotteryPeriods'

const lotteryStore = useLotteryStore()
const { tickets } = storeToRefs(lotteryStore)

// Filters State
const searchQuery = ref('')
const selectedOrg = ref<LotteryOrganization | 'all'>('all')
const selectedGame = ref<string | 'all'>('all')
const selectedStatus = ref<LotteryStatus | 'all'>('all')

const selectedPeriod = ref<PeriodFilter>({
  type: 'all' // By default on tickets page show all or filter by period
})

// Modals
const isFormModalOpen = ref(false)
const selectedTicketForEdit = ref<LotteryTicket | null>(null)

const isPrizeModalOpen = ref(false)
const selectedTicketForPrize = ref<LotteryTicket | null>(null)

const isViewerModalOpen = ref(false)
const viewerPhotoUrl = ref<string | null>(null)
const viewerPhotoTitle = ref<string>('')

// Available games based on selected organization
const availableGames = computed(() => {
  return getGamesByOrganization(selectedOrg.value)
})

watch(selectedOrg, () => {
  selectedGame.value = 'all'
})

// All ticket dates for the period generator
const allDates = computed(() => tickets.value.map(t => t.drawDate || t.date))

// Filtered tickets
const filteredTickets = computed(() => {
  return lotteryStore.getFilteredTickets({
    period: selectedPeriod.value,
    organization: selectedOrg.value,
    game: selectedGame.value,
    status: selectedStatus.value,
    search: searchQuery.value
  })
})

// Metrics for the filtered subset
const metrics = computed(() => {
  return lotteryStore.calculateMetrics(filteredTickets.value)
})

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

const resetFilters = () => {
  searchQuery.value = ''
  selectedOrg.value = 'all'
  selectedGame.value = 'all'
  selectedStatus.value = 'all'
  selectedPeriod.value = { type: 'all' }
}
</script>

<template>
  <div class="space-y-6">
    <!-- Header with Action -->
    <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
      <div>
        <h1 class="text-2xl sm:text-3xl font-black text-gray-900 dark:text-white tracking-tight">
          Mis Boletos de Lotería
        </h1>
        <p class="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-0.5">
          Filtra por organización, tipo de juego, fechas o estado de premios
        </p>
      </div>

      <div class="flex items-center gap-2">
        <UButton
          color="primary"
          size="md"
          icon="i-heroicons-camera"
          label="Añadir Boleto"
          class="font-bold shadow-sm"
          @click="handleOpenNewTicket"
        />
      </div>
    </div>

    <!-- 1. PERIOD FILTER BAR (Semanal, Mensual, Anual, Histórico, Rango) -->
    <PeriodFilterBar v-model="selectedPeriod" :ticket-dates="allDates" />

    <!-- 2. SEARCH & ADVANCED FILTERS (ORGANIZATION, GAME, STATUS) -->
    <div class="rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 p-4 shadow-xs space-y-3">
      <!-- Search Input -->
      <div class="relative">
        <UIcon name="i-heroicons-magnifying-glass" class="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-gray-400" />
        <input
          v-model="searchQuery"
          type="text"
          placeholder="Buscar por nombre, números jugados o notas..."
          class="w-full pl-10 pr-4 py-2 rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-xs sm:text-sm text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-brand-500"
        />
        <button
          v-if="searchQuery"
          type="button"
          class="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 cursor-pointer"
          @click="searchQuery = ''"
        >
          <UIcon name="i-heroicons-x-mark" class="size-4" />
        </button>
      </div>

      <!-- Filter Selectors -->
      <div class="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
        <!-- Organization Selector -->
        <div class="space-y-1">
          <label class="block text-[11px] font-bold text-gray-500 uppercase tracking-wider">
            Organización
          </label>
          <select
            v-model="selectedOrg"
            class="w-full px-3 py-2 rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-xs font-semibold text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-brand-500"
          >
            <option value="all">Todas (ONLAE, ONCE, Otros)</option>
            <option value="onlae">ONLAE / Loterías del Estado</option>
            <option value="once">ONCE</option>
            <option value="otros">Otros Sorteos y Rifas</option>
          </select>
        </div>

        <!-- Game Type Selector -->
        <div class="space-y-1">
          <label class="block text-[11px] font-bold text-gray-500 uppercase tracking-wider">
            Tipo de Juego
          </label>
          <select
            v-model="selectedGame"
            class="w-full px-3 py-2 rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-xs font-semibold text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-brand-500"
          >
            <option value="all">Todos los juegos</option>
            <option v-for="g in availableGames" :key="g.id" :value="g.id">
              {{ g.name }}
            </option>
          </select>
        </div>

        <!-- Status Selector -->
        <div class="space-y-1">
          <label class="block text-[11px] font-bold text-gray-500 uppercase tracking-wider">
            Estado del Premio
          </label>
          <select
            v-model="selectedStatus"
            class="w-full px-3 py-2 rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-xs font-semibold text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-brand-500"
          >
            <option value="all">Todos los estados</option>
            <option value="pending">Pendientes de sorteo</option>
            <option value="won">Premiados</option>
            <option value="refund">Reintegros</option>
            <option value="lost">No premiados</option>
          </select>
        </div>
      </div>
    </div>

    <!-- 3. SUMMARY BADGES FOR CURRENT SELECTION -->
    <div class="p-3.5 rounded-2xl bg-blue-50/60 dark:bg-blue-950/30 border border-blue-100 dark:border-blue-900/50 flex flex-wrap items-center justify-between gap-3 text-xs">
      <div class="flex flex-wrap items-center gap-4 text-gray-700 dark:text-gray-300">
        <span>Mostrando <strong class="text-brand-600 dark:text-brand-400 font-black">{{ filteredTickets.length }}</strong> boletos</span>
        <span>Gasto: <strong>{{ metrics.totalCost.toFixed(2) }} €</strong></span>
        <span>Premios: <strong class="text-emerald-600 dark:text-emerald-400">{{ metrics.totalPrizes.toFixed(2) }} €</strong></span>
        <span>
          Balance:
          <strong :class="metrics.netBalance >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'">
            {{ metrics.netBalance >= 0 ? `+${metrics.netBalance.toFixed(2)}` : metrics.netBalance.toFixed(2) }} €
          </strong>
        </span>
      </div>

      <button
        v-if="searchQuery || selectedOrg !== 'all' || selectedGame !== 'all' || selectedStatus !== 'all' || selectedPeriod.type !== 'all'"
        type="button"
        class="text-xs text-brand-600 dark:text-brand-400 hover:underline font-bold cursor-pointer"
        @click="resetFilters"
      >
        Limpiar filtros
      </button>
    </div>

    <!-- 4. TICKETS GRID -->
    <div v-if="filteredTickets.length === 0" class="p-12 text-center rounded-3xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 space-y-3">
      <UIcon name="i-heroicons-ticket" class="size-12 text-gray-300 dark:text-gray-600 mx-auto" />
      <h3 class="text-base font-bold text-gray-900 dark:text-white">
        No hay boletos que coincidan con los filtros
      </h3>
      <p class="text-xs text-gray-500 dark:text-gray-400">
        Prueba a cambiar el periodo temporal, la organización o el tipo de juego seleccionado.
      </p>
      <div class="pt-2">
        <UButton
          color="neutral"
          variant="outline"
          size="sm"
          label="Restablecer filtros"
          @click="resetFilters"
        />
      </div>
    </div>

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
