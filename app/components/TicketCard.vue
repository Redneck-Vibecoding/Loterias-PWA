<script setup lang="ts">
import type { LotteryTicket } from '~/stores/lottery'
import {
  LOTTERY_ORGANIZATIONS,
  LOTTERY_STATUSES,
  getGameById
} from '~/utils/lotteryGames'
import { getLotteryAttachment } from '~/utils/lotteryAttachments'

const props = defineProps<{
  ticket: LotteryTicket
}>()

const emit = defineEmits<{
  (e: 'edit', ticket: LotteryTicket): void
  (e: 'delete', id: string): void
  (e: 'checkPrize', ticket: LotteryTicket): void
  (e: 'viewPhoto', photoUrl: string, title: string): void
}>()

const gameDef = computed(() => getGameById(props.ticket.game))
const orgDef = computed(() => LOTTERY_ORGANIZATIONS[props.ticket.organization] || LOTTERY_ORGANIZATIONS.otros)
const statusDef = computed(() => LOTTERY_STATUSES[props.ticket.status] || LOTTERY_STATUSES.pending)

const netResult = computed(() => {
  if (props.ticket.status === 'pending') return 0
  return (props.ticket.prize || 0) - (props.ticket.cost || 0)
})

const photoThumbnail = ref<string | null>(props.ticket.ticketPhoto || null)
const isLoadingPhoto = ref(false)

onMounted(async () => {
  if (!photoThumbnail.value && props.ticket.ticketPhotoId) {
    isLoadingPhoto.value = true
    try {
      const att = await getLotteryAttachment(props.ticket.ticketPhotoId)
      if (att?.dataUrl) {
        photoThumbnail.value = att.dataUrl
      }
    } finally {
      isLoadingPhoto.value = false
    }
  }
})

const handleViewPhoto = () => {
  if (photoThumbnail.value) {
    emit('viewPhoto', photoThumbnail.value, props.ticket.title)
  }
}
</script>

<template>
  <div
    class="relative rounded-3xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 p-4 sm:p-5 shadow-xs hover:shadow-md transition-all duration-200 flex flex-col justify-between gap-4"
    :class="{
      'border-l-4 border-l-brand-600 dark:border-l-brand-500': ticket.organization === 'onlae',
      'border-l-4 border-l-emerald-600 dark:border-l-emerald-500': ticket.organization === 'once',
      'border-l-4 border-l-purple-600 dark:border-l-purple-500': ticket.organization === 'otros',
      'ring-1 ring-emerald-500/20 bg-emerald-50/10 dark:bg-emerald-950/10': ticket.status === 'won'
    }"
  >
    <!-- Header: Org Badge + Game Title + Status -->
    <div class="flex items-start justify-between gap-2">
      <div class="flex items-start gap-3">
        <!-- Game Icon Circle -->
        <div
          class="size-11 rounded-2xl flex items-center justify-center shrink-0 shadow-xs"
          :style="{
            backgroundColor: ticket.organization === 'onlae' ? '#eff6ff' : (ticket.organization === 'once' ? '#ecfdf5' : '#f5f3ff'),
            color: gameDef.hexColor
          }"
        >
          <UIcon :name="gameDef.icon" class="size-6" />
        </div>

        <div>
          <!-- Tags / Badges -->
          <div class="flex flex-wrap items-center gap-1.5 mb-1">
            <span
              class="px-2 py-0.5 rounded-md text-[11px] font-bold tracking-wide uppercase"
              :class="{
                'bg-blue-100 text-blue-800 dark:bg-blue-900/60 dark:text-blue-200': ticket.organization === 'onlae',
                'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/60 dark:text-emerald-200': ticket.organization === 'once',
                'bg-purple-100 text-purple-800 dark:bg-purple-900/60 dark:text-purple-200': ticket.organization === 'otros'
              }"
            >
              {{ orgDef.shortName }}
            </span>

            <span class="text-xs text-gray-400 font-medium">·</span>
            <span class="text-xs font-semibold text-gray-700 dark:text-gray-300">{{ gameDef.name }}</span>
          </div>

          <h3 class="text-base font-bold text-gray-900 dark:text-white leading-tight">
            {{ ticket.title }}
          </h3>

          <div class="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400 mt-1">
            <UIcon name="i-heroicons-calendar" class="size-3.5" />
            <span>Sorteo: {{ ticket.drawDate || ticket.date }}</span>
            <span v-if="ticket.betsCount && ticket.betsCount > 1" class="text-gray-400">
              ({{ ticket.betsCount }} apuestas)
            </span>
          </div>
        </div>
      </div>

      <!-- Status Badge -->
      <div class="shrink-0 text-right">
        <UBadge
          :label="statusDef.label"
          :color="statusDef.color"
          :variant="statusDef.badgeVariant"
          size="sm"
          class="font-semibold"
        />
      </div>
    </div>

    <!-- Numbers or Combinations played (if any) -->
    <div
      v-if="ticket.numbers"
      class="p-2.5 rounded-xl bg-blue-50/50 dark:bg-blue-950/30 border border-blue-100 dark:border-blue-900/50 flex items-center justify-between text-xs"
    >
      <div class="flex items-center gap-2 overflow-hidden">
        <UIcon name="i-heroicons-sparkles" class="size-4 text-brand-600 dark:text-brand-400 shrink-0" />
        <span class="font-mono font-medium text-gray-800 dark:text-gray-200 truncate">
          {{ ticket.numbers }}
        </span>
      </div>
    </div>

    <!-- Photo Attachment Thumbnail (if present) -->
    <div v-if="photoThumbnail || isLoadingPhoto" class="flex items-center gap-3">
      <button
        v-if="photoThumbnail"
        type="button"
        class="group relative size-14 rounded-xl overflow-hidden border border-gray-200 dark:border-gray-700 shadow-xs hover:ring-2 hover:ring-brand-500 transition-all shrink-0 cursor-pointer"
        title="Ver foto del boleto"
        @click="handleViewPhoto"
      >
        <img :src="photoThumbnail" alt="Foto del boleto" class="w-full h-full object-cover group-hover:scale-105 transition-transform" />
        <div class="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity text-white">
          <UIcon name="i-heroicons-magnifying-glass-plus" class="size-5" />
        </div>
      </button>

      <div v-else-if="isLoadingPhoto" class="size-14 rounded-xl bg-gray-100 dark:bg-gray-800 animate-pulse flex items-center justify-center">
        <UIcon name="i-heroicons-arrow-path" class="size-5 text-gray-400 animate-spin" />
      </div>

      <div class="text-xs text-gray-500 dark:text-gray-400">
        <span class="font-medium text-gray-700 dark:text-gray-300 block">Boleto adjunto con foto</span>
        <button
          type="button"
          class="text-brand-600 dark:text-brand-400 hover:underline flex items-center gap-1 mt-0.5"
          @click="handleViewPhoto"
        >
          <UIcon name="i-heroicons-photo" class="size-3.5" />
          <span>Ver imagen ampliada</span>
        </button>
      </div>
    </div>

    <!-- Notes if any -->
    <p v-if="ticket.notes" class="text-xs text-gray-500 dark:text-gray-400 italic">
      "{{ ticket.notes }}"
    </p>

    <!-- Financial Breakdown: Gasto, Premio & Balance -->
    <div class="pt-3 border-t border-gray-100 dark:border-gray-800 flex items-center justify-between">
      <div class="flex items-center gap-4">
        <!-- Gasto -->
        <div>
          <span class="block text-[11px] font-semibold uppercase text-gray-400">Gasto</span>
          <span class="text-sm font-bold text-gray-900 dark:text-white">
            {{ ticket.cost.toFixed(2) }} €
          </span>
        </div>

        <!-- Premio -->
        <div>
          <span class="block text-[11px] font-semibold uppercase text-gray-400">Premio</span>
          <span
            class="text-sm font-bold"
            :class="ticket.prize > 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-gray-500'"
          >
            {{ ticket.prize ? ticket.prize.toFixed(2) : '0.00' }} €
          </span>
        </div>

        <!-- Balance / Retorno -->
        <div v-if="ticket.status !== 'pending'">
          <span class="block text-[11px] font-semibold uppercase text-gray-400">Balance</span>
          <span
            class="text-sm font-black px-1.5 py-0.5 rounded-md inline-block"
            :class="{
              'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300': netResult > 0,
              'bg-cyan-100 text-cyan-800 dark:bg-cyan-950/60 dark:text-cyan-300': netResult === 0,
              'bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300': netResult < 0
            }"
          >
            {{ netResult > 0 ? `+${netResult.toFixed(2)}` : netResult.toFixed(2) }} €
          </span>
        </div>
      </div>

      <!-- Action Buttons -->
      <div class="flex items-center gap-1">
        <UButton
          size="xs"
          color="primary"
          variant="subtle"
          icon="i-heroicons-check-circle"
          label="Premios"
          title="Asignar premio o resultado"
          @click="emit('checkPrize', ticket)"
        />

        <UDropdownMenu
          :items="[
            [
              {
                label: 'Editar boleto',
                icon: 'i-heroicons-pencil-square',
                onSelect: () => emit('edit', ticket)
              },
              {
                label: 'Eliminar',
                icon: 'i-heroicons-trash',
                color: 'error',
                onSelect: () => emit('delete', ticket.id)
              }
            ]
          ]"
        >
          <UButton
            icon="i-heroicons-ellipsis-vertical"
            color="neutral"
            variant="ghost"
            size="xs"
          />
        </UDropdownMenu>
      </div>
    </div>
  </div>
</template>
