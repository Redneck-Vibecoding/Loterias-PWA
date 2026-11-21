<script setup lang="ts">
import type { PeriodFilter, PeriodType } from '~/utils/lotteryPeriods'
import {
  generateRecentWeeks,
  getIsoWeekString,
  formatWeekLabel
} from '~/utils/lotteryPeriods'

const props = defineProps<{
  ticketDates?: string[]
}>()

const filter = defineModel<PeriodFilter>('modelValue', {
  default: () => ({
    type: 'week',
    week: getIsoWeekString(new Date())
  })
})

const currentYear = new Date().getFullYear()
const currentMonth = new Date().getMonth() + 1

const availableWeeks = computed(() => generateRecentWeeks(props.ticketDates || []))

const monthsList = [
  { value: 0, label: 'Todo el año' },
  { value: 1, label: 'Enero' },
  { value: 2, label: 'Febrero' },
  { value: 3, label: 'Marzo' },
  { value: 4, label: 'Abril' },
  { value: 5, label: 'Mayo' },
  { value: 6, label: 'Junio' },
  { value: 7, label: 'Julio' },
  { value: 8, label: 'Agosto' },
  { value: 9, label: 'Septiembre' },
  { value: 10, label: 'Octubre' },
  { value: 11, label: 'Noviembre' },
  { value: 12, label: 'Diciembre' }
]

const yearsList = computed(() => {
  const years = [currentYear, currentYear - 1, currentYear - 2, currentYear - 3]
  return years
})

const setPeriodType = (type: PeriodType) => {
  if (type === 'week') {
    filter.value = {
      type: 'week',
      week: filter.value.week || getIsoWeekString(new Date())
    }
  } else if (type === 'month') {
    filter.value = {
      type: 'month',
      year: filter.value.year || currentYear,
      month: filter.value.month || currentMonth
    }
  } else if (type === 'year') {
    filter.value = {
      type: 'year',
      year: filter.value.year || currentYear
    }
  } else if (type === 'all') {
    filter.value = {
      type: 'all'
    }
  } else if (type === 'custom') {
    const today = new Date().toISOString().slice(0, 10)
    filter.value = {
      type: 'custom',
      startDate: filter.value.startDate || today,
      endDate: filter.value.endDate || today
    }
  }
}
</script>

<template>
  <div class="rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 p-3 sm:p-4 shadow-xs space-y-3">
    <!-- Period Type Tabs -->
    <div class="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
      <button
        type="button"
        class="px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer shrink-0"
        :class="filter.type === 'week'
          ? 'bg-brand-600 text-white shadow-xs'
          : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'"
        @click="setPeriodType('week')"
      >
        <span class="flex items-center gap-1.5">
          <UIcon name="i-heroicons-calendar" class="size-3.5" />
          Semanal
        </span>
      </button>

      <button
        type="button"
        class="px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer shrink-0"
        :class="filter.type === 'month'
          ? 'bg-brand-600 text-white shadow-xs'
          : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'"
        @click="setPeriodType('month')"
      >
        <span class="flex items-center gap-1.5">
          <UIcon name="i-heroicons-calendar-days" class="size-3.5" />
          Mensual
        </span>
      </button>

      <button
        type="button"
        class="px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer shrink-0"
        :class="filter.type === 'year'
          ? 'bg-brand-600 text-white shadow-xs'
          : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'"
        @click="setPeriodType('year')"
      >
        <span class="flex items-center gap-1.5">
          <UIcon name="i-heroicons-clock" class="size-3.5" />
          Anual
        </span>
      </button>

      <button
        type="button"
        class="px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer shrink-0"
        :class="filter.type === 'all'
          ? 'bg-brand-600 text-white shadow-xs'
          : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'"
        @click="setPeriodType('all')"
      >
        <span class="flex items-center gap-1.5">
          <UIcon name="i-heroicons-archive-box" class="size-3.5" />
          Todo el Histórico
        </span>
      </button>

      <button
        type="button"
        class="px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer shrink-0"
        :class="filter.type === 'custom'
          ? 'bg-brand-600 text-white shadow-xs'
          : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'"
        @click="setPeriodType('custom')"
      >
        <span class="flex items-center gap-1.5">
          <UIcon name="i-heroicons-adjustments-horizontal" class="size-3.5" />
          Rango
        </span>
      </button>
    </div>

    <!-- Period Sub-controls -->
    <div class="pt-1 flex flex-wrap items-center gap-3">
      <!-- Week selector -->
      <div v-if="filter.type === 'week'" class="flex items-center gap-2 w-full sm:w-auto">
        <label class="text-xs text-gray-500 dark:text-gray-400 font-semibold shrink-0">
          Semana:
        </label>
        <select
          v-model="filter.week"
          class="flex-1 sm:w-72 px-3 py-1.5 rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-xs font-bold text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-brand-500"
        >
          <option v-for="w in availableWeeks" :key="w.value" :value="w.value">
            {{ w.label }}
          </option>
        </select>
      </div>

      <!-- Month & Year selector -->
      <div v-else-if="filter.type === 'month'" class="flex items-center gap-2 w-full sm:w-auto">
        <select
          v-model.number="filter.month"
          class="px-3 py-1.5 rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-xs font-bold text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-brand-500"
        >
          <option v-for="m in monthsList" :key="m.value" :value="m.value">
            {{ m.label }}
          </option>
        </select>

        <select
          v-model.number="filter.year"
          class="px-3 py-1.5 rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-xs font-bold text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-brand-500"
        >
          <option v-for="y in yearsList" :key="y" :value="y">
            {{ y }}
          </option>
        </select>
      </div>

      <!-- Year only selector -->
      <div v-else-if="filter.type === 'year'" class="flex items-center gap-2">
        <label class="text-xs text-gray-500 dark:text-gray-400 font-semibold">Año:</label>
        <select
          v-model.number="filter.year"
          class="px-3 py-1.5 rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-xs font-bold text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-brand-500"
        >
          <option v-for="y in yearsList" :key="y" :value="y">
            {{ y }}
          </option>
        </select>
      </div>

      <!-- Custom Date range selector -->
      <div v-else-if="filter.type === 'custom'" class="flex flex-wrap items-center gap-2">
        <div class="flex items-center gap-1.5">
          <span class="text-xs text-gray-500">Desde:</span>
          <input
            v-model="filter.startDate"
            type="date"
            class="px-2.5 py-1 rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-xs font-medium text-gray-900 dark:text-white"
          />
        </div>
        <div class="flex items-center gap-1.5">
          <span class="text-xs text-gray-500">Hasta:</span>
          <input
            v-model="filter.endDate"
            type="date"
            class="px-2.5 py-1 rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-xs font-medium text-gray-900 dark:text-white"
          />
        </div>
      </div>

      <!-- All time summary badge -->
      <div v-else-if="filter.type === 'all'" class="text-xs text-gray-500 dark:text-gray-400">
        Mostrando todas las apuestas registradas desde el inicio
      </div>
    </div>
  </div>
</template>
