<script setup lang="ts">
import type { LotteryTicket } from '~/stores/lottery'
import type { LotteryStatus } from '~/utils/lotteryGames'

const props = defineProps<{
  ticket: LotteryTicket | null
}>()

const emit = defineEmits<{
  (e: 'update', payload: { ticketId: string, status: LotteryStatus, prize: number }): void
}>()

const isOpen = defineModel<boolean>('open', { default: false })

const selectedStatus = ref<LotteryStatus>('won')
const prizeInput = ref<string>('')

watch(() => props.ticket, (t) => {
  if (t) {
    selectedStatus.value = t.status === 'pending' ? 'won' : t.status
    prizeInput.value = t.prize > 0 ? String(t.prize) : (t.status === 'refund' ? String(t.cost) : '')
  }
}, { immediate: true })

watch(selectedStatus, (newStatus) => {
  if (newStatus === 'refund' && props.ticket) {
    prizeInput.value = String(props.ticket.cost)
  } else if (newStatus === 'lost') {
    prizeInput.value = '0'
  } else if (newStatus === 'won' && (!prizeInput.value || prizeInput.value === '0')) {
    prizeInput.value = ''
  }
})

const handleSave = () => {
  if (!props.ticket) return
  let prizeNum = 0
  if (selectedStatus.value === 'won') {
    prizeNum = Math.max(0, parseFloat(prizeInput.value.replace(',', '.')) || 0)
  } else if (selectedStatus.value === 'refund') {
    prizeNum = props.ticket.cost || 0
  }

  emit('update', {
    ticketId: props.ticket.id,
    status: selectedStatus.value,
    prize: prizeNum
  })
  isOpen.value = false
}
</script>

<template>
  <Teleport to="body">
    <div v-if="isOpen && ticket" class="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div class="fixed inset-0 bg-gray-900/60 backdrop-blur-xs" @click="isOpen = false" />

      <div class="relative z-10 w-full max-w-md rounded-3xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 p-6 shadow-xl space-y-5">
        <!-- Header -->
        <div class="flex items-center justify-between">
          <div>
            <h3 class="text-lg font-bold text-gray-900 dark:text-white">
              Comprobar / Asignar Premio
            </h3>
            <p class="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
              {{ ticket.title }} (Coste: {{ ticket.cost.toFixed(2) }} €)
            </p>
          </div>
          <UButton
            icon="i-heroicons-x-mark"
            color="neutral"
            variant="ghost"
            size="sm"
            @click="isOpen = false"
          />
        </div>

        <!-- Status selector buttons -->
        <div class="grid grid-cols-2 gap-2">
          <!-- Premiado -->
          <button
            type="button"
            class="flex items-center gap-2.5 p-3 rounded-2xl border text-left transition-all cursor-pointer"
            :class="selectedStatus === 'won'
              ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-500 text-emerald-900 dark:text-emerald-100 font-bold ring-2 ring-emerald-500/20'
              : 'border-gray-200 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50 text-gray-700 dark:text-gray-300'"
            @click="selectedStatus = 'won'"
          >
            <UIcon name="i-heroicons-trophy" class="size-5 text-emerald-600" />
            <div>
              <span class="block text-sm">Premiado</span>
              <span class="block text-[11px] opacity-70">Obtuvo ganancias</span>
            </div>
          </button>

          <!-- Reintegro -->
          <button
            type="button"
            class="flex items-center gap-2.5 p-3 rounded-2xl border text-left transition-all cursor-pointer"
            :class="selectedStatus === 'refund'
              ? 'bg-cyan-50 dark:bg-cyan-950/40 border-cyan-500 text-cyan-900 dark:text-cyan-100 font-bold ring-2 ring-cyan-500/20'
              : 'border-gray-200 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50 text-gray-700 dark:text-gray-300'"
            @click="selectedStatus = 'refund'"
          >
            <UIcon name="i-heroicons-arrow-path" class="size-5 text-cyan-600" />
            <div>
              <span class="block text-sm">Reintegro</span>
              <span class="block text-[11px] opacity-70">Recuperas {{ ticket.cost.toFixed(2) }} €</span>
            </div>
          </button>

          <!-- No Premiado -->
          <button
            type="button"
            class="flex items-center gap-2.5 p-3 rounded-2xl border text-left transition-all cursor-pointer"
            :class="selectedStatus === 'lost'
              ? 'bg-rose-50 dark:bg-rose-950/40 border-rose-500 text-rose-900 dark:text-rose-100 font-bold ring-2 ring-rose-500/20'
              : 'border-gray-200 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50 text-gray-700 dark:text-gray-300'"
            @click="selectedStatus = 'lost'"
          >
            <UIcon name="i-heroicons-x-circle" class="size-5 text-rose-600" />
            <div>
              <span class="block text-sm">No Premiado</span>
              <span class="block text-[11px] opacity-70">Sin premio</span>
            </div>
          </button>

          <!-- Pendiente -->
          <button
            type="button"
            class="flex items-center gap-2.5 p-3 rounded-2xl border text-left transition-all cursor-pointer"
            :class="selectedStatus === 'pending'
              ? 'bg-blue-50 dark:bg-blue-950/40 border-blue-500 text-blue-900 dark:text-blue-100 font-bold ring-2 ring-blue-500/20'
              : 'border-gray-200 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50 text-gray-700 dark:text-gray-300'"
            @click="selectedStatus = 'pending'"
          >
            <UIcon name="i-heroicons-clock" class="size-5 text-blue-600" />
            <div>
              <span class="block text-sm">Pendiente</span>
              <span class="block text-[11px] opacity-70">En espera de sorteo</span>
            </div>
          </button>
        </div>

        <!-- Prize amount input if won -->
        <div v-if="selectedStatus === 'won'" class="space-y-2 p-3.5 rounded-2xl bg-emerald-50/50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/60">
          <label class="block text-xs font-bold text-emerald-900 dark:text-emerald-200 uppercase tracking-wide">
            Importe del Premio Ganado (€)
          </label>
          <div class="relative">
            <input
              v-model="prizeInput"
              type="text"
              inputmode="decimal"
              placeholder="0.00"
              class="w-full pl-4 pr-10 py-2.5 rounded-xl bg-white dark:bg-gray-900 border border-emerald-300 dark:border-emerald-700 text-lg font-black text-gray-900 dark:text-white focus:ring-2 focus:ring-emerald-500 outline-none"
            />
            <span class="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 font-bold">€</span>
          </div>
          <p class="text-[11px] text-emerald-700 dark:text-emerald-300">
            Beneficio neto estimado:
            <span class="font-bold">
              {{ ((parseFloat(prizeInput.replace(',', '.')) || 0) - ticket.cost).toFixed(2) }} €
            </span>
          </p>
        </div>

        <!-- Footer actions -->
        <div class="flex justify-end gap-2 pt-2">
          <UButton color="neutral" variant="ghost" label="Cancelar" @click="isOpen = false" />
          <UButton
            color="primary"
            icon="i-heroicons-check"
            label="Guardar Resultado"
            @click="handleSave"
          />
        </div>
      </div>
    </div>
  </Teleport>
</template>
