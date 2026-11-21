<script setup lang="ts">
import { v4 as uuidv4 } from 'uuid'
import type { LotteryTicket } from '~/stores/lottery'
import type { LotteryOrganization, LotteryStatus } from '~/utils/lotteryGames'
import {
  getGamesByOrganization,
  getGameById
} from '~/utils/lotteryGames'
import { compressImageToDataUrl, fileToDataUrl } from '~/utils/ticket'
import { getLotteryAttachment } from '~/utils/lotteryAttachments'
import { parseLotteryTicketText } from '~/utils/lotteryOcr'
import { recognizeImages } from '~/utils/ocr'

const props = defineProps<{
  initialData?: LotteryTicket | null
}>()

const emit = defineEmits<{
  (e: 'saved', ticket: LotteryTicket): void
}>()

const isOpen = defineModel<boolean>('open', { default: false })
const lotteryStore = useLotteryStore()
const toast = useToast()

const isEditing = computed(() => Boolean(props.initialData?.id))
const isProcessingImage = ref(false)
const isRunningOcr = ref(false)

// Cropper modal state
const isCropperOpen = ref(false)
const rawImageSrc = ref<string | null>(null)

// Hidden file input refs
const cameraInputRef = ref<HTMLInputElement | null>(null)
const fileInputRef = ref<HTMLInputElement | null>(null)

// Form State
const state = reactive({
  id: '',
  title: '',
  organization: 'onlae' as LotteryOrganization,
  game: 'bonoloto',
  gameName: 'Bonoloto',
  date: new Date().toISOString().slice(0, 10),
  drawDate: new Date().toISOString().slice(0, 10),
  numbers: '',
  betsCount: 1,
  cost: 1.00,
  status: 'pending' as LotteryStatus,
  prize: 0,
  ticketPhoto: undefined as string | undefined,
  ticketPhotoId: undefined as string | undefined,
  ticketPhotoName: undefined as string | undefined,
  ticketPhotoType: undefined as string | undefined,
  notes: ''
})

const costInput = ref('1.00')
const prizeInput = ref('0.00')

const gamesList = computed(() => getGamesByOrganization(state.organization))

watch(() => state.organization, (newOrg) => {
  const available = getGamesByOrganization(newOrg)
  if (!available.some(g => g.id === state.game)) {
    const firstGame = available[0]
    if (firstGame) {
      state.game = firstGame.id
      state.gameName = firstGame.name
      if (!isEditing.value) {
        state.cost = firstGame.defaultCost
        costInput.value = firstGame.defaultCost.toFixed(2)
        state.title = firstGame.name
      }
    }
  }
})

watch(() => state.game, (newGameId) => {
  const g = getGameById(newGameId)
  state.gameName = g.name
  if (!isEditing.value && !state.title) {
    state.title = g.name
  }
})

const resetForm = () => {
  state.id = uuidv4()
  state.organization = 'onlae'
  const def = getGameById('bonoloto')
  state.game = 'bonoloto'
  state.gameName = def.name
  state.title = 'Bonoloto'
  state.date = new Date().toISOString().slice(0, 10)
  state.drawDate = new Date().toISOString().slice(0, 10)
  state.numbers = ''
  state.betsCount = 1
  state.cost = def.defaultCost
  state.status = 'pending'
  state.prize = 0
  state.ticketPhoto = undefined
  state.ticketPhotoId = undefined
  state.ticketPhotoName = undefined
  state.ticketPhotoType = undefined
  state.notes = ''
  costInput.value = def.defaultCost.toFixed(2)
  prizeInput.value = '0.00'
}

watch(() => props.initialData, async (t) => {
  if (t) {
    state.id = t.id
    state.title = t.title
    state.organization = t.organization
    state.game = t.game
    state.gameName = t.gameName
    state.date = t.date || new Date().toISOString().slice(0, 10)
    state.drawDate = t.drawDate || t.date || new Date().toISOString().slice(0, 10)
    state.numbers = t.numbers || ''
    state.betsCount = t.betsCount || 1
    state.cost = t.cost || 0
    state.status = t.status || 'pending'
    state.prize = t.prize || 0
    state.ticketPhoto = t.ticketPhoto
    state.ticketPhotoId = t.ticketPhotoId
    state.ticketPhotoName = t.ticketPhotoName
    state.ticketPhotoType = t.ticketPhotoType
    state.notes = t.notes || ''
    costInput.value = t.cost ? t.cost.toFixed(2) : '0.00'
    prizeInput.value = t.prize ? t.prize.toFixed(2) : '0.00'

    if (!state.ticketPhoto && t.ticketPhotoId) {
      const attachment = await getLotteryAttachment(t.ticketPhotoId)
      if (attachment?.dataUrl && state.id === t.id) {
        state.ticketPhoto = attachment.dataUrl
      }
    }
  } else {
    resetForm()
  }
}, { immediate: true })

watch(isOpen, (open) => {
  if (open && !props.initialData) {
    resetForm()
  }
})

// Photo Handling
const openCamera = () => {
  cameraInputRef.value?.click()
}

const openGallery = () => {
  fileInputRef.value?.click()
}

const onFileSelected = async (event: Event) => {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  if (!file) return

  try {
    isProcessingImage.value = true
    const dataUrl = await fileToDataUrl(file)
    rawImageSrc.value = dataUrl
    isCropperOpen.value = true
  } catch (e) {
    console.error('Error reading image:', e)
    toast.add({ title: 'Error', description: 'No se pudo leer la imagen seleccionada', color: 'error' })
  } finally {
    isProcessingImage.value = false
    input.value = ''
  }
}

const runOcrAnalysis = async (imageDataUrl: string) => {
  try {
    isRunningOcr.value = true
    const ocrText = await recognizeImages([imageDataUrl])
    if (ocrText.trim()) {
      const parsed = parseLotteryTicketText(ocrText)
      if (parsed.organization) state.organization = parsed.organization
      if (parsed.game) state.game = parsed.game
      if (parsed.gameName) state.gameName = parsed.gameName
      if (parsed.title) state.title = parsed.title
      if (parsed.drawDate) state.drawDate = parsed.drawDate
      if (parsed.cost) {
        state.cost = parsed.cost
        costInput.value = parsed.cost.toFixed(2)
      }
      if (parsed.numbers) state.numbers = parsed.numbers
      if (parsed.betsCount) state.betsCount = parsed.betsCount

      toast.add({
        title: 'Boleto reconocido',
        description: `Detectado: ${parsed.gameName} (${parsed.cost}€)`,
        color: 'info'
      })
    }
  } catch (e) {
    console.warn('OCR error or unsupported:', e)
  } finally {
    isRunningOcr.value = false
  }
}

const onCropConfirm = async (blob: Blob, grayscale: boolean) => {
  try {
    isProcessingImage.value = true
    const compressed = await compressImageToDataUrl(blob, `ticket-${Date.now()}.jpg`, { grayscale })
    state.ticketPhoto = compressed.dataUrl
    state.ticketPhotoName = compressed.name
    state.ticketPhotoType = compressed.type

    toast.add({
      title: 'Foto guardada',
      description: 'Imagen del boleto optimizada y lista',
      color: 'success'
    })

    // Automatically trigger smart lottery OCR detection
    void runOcrAnalysis(compressed.dataUrl)
  } catch (e) {
    console.error('Error compressing image:', e)
  } finally {
    isProcessingImage.value = false
  }
}

const removePhoto = () => {
  state.ticketPhoto = undefined
  state.ticketPhotoId = undefined
  state.ticketPhotoName = undefined
  state.ticketPhotoType = undefined
}

const handleSave = async () => {
  const parsedCost = parseFloat(costInput.value.replace(',', '.')) || 0
  const parsedPrize = parseFloat(prizeInput.value.replace(',', '.')) || 0

  const ticketData: LotteryTicket = {
    id: state.id || uuidv4(),
    title: state.title.trim() || state.gameName || 'Boleto de Lotería',
    organization: state.organization,
    game: state.game,
    gameName: state.gameName,
    date: state.date,
    drawDate: state.drawDate,
    numbers: state.numbers.trim() || undefined,
    betsCount: state.betsCount || 1,
    cost: parsedCost,
    status: state.status,
    prize: state.status === 'won' ? parsedPrize : (state.status === 'refund' ? parsedCost : 0),
    ticketPhoto: state.ticketPhoto,
    ticketPhotoId: state.ticketPhotoId,
    ticketPhotoName: state.ticketPhotoName,
    ticketPhotoType: state.ticketPhotoType,
    notes: state.notes.trim() || undefined,
    createdAt: props.initialData?.createdAt || new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }

  await lotteryStore.saveTicket(ticketData)
  toast.add({
    title: isEditing.value ? 'Boleto actualizado' : 'Boleto guardado',
    description: `${ticketData.title} guardado con éxito`,
    color: 'success'
  })

  emit('saved', ticketData)
  isOpen.value = false
}
</script>

<template>
  <div>
    <!-- Hidden inputs for Camera and Gallery -->
    <input ref="cameraInputRef" type="file" accept="image/*" capture="environment" class="hidden" @change="onFileSelected" />
    <input ref="fileInputRef" type="file" accept="image/*" class="hidden" @change="onFileSelected" />

    <!-- Cropper Modal -->
    <TicketCropperModal
      v-model:open="isCropperOpen"
      :src="rawImageSrc"
      @confirm="onCropConfirm"
    />

    <Teleport to="body">
      <div v-if="isOpen" class="fixed inset-0 z-50 flex items-stretch sm:items-center justify-center sm:p-4">
        <div class="fixed inset-0 bg-gray-900/60 backdrop-blur-xs" @click="isOpen = false" />

        <div class="relative z-10 w-full sm:max-w-2xl bg-white dark:bg-gray-900 sm:rounded-3xl shadow-2xl border border-gray-200 dark:border-gray-800 flex flex-col max-h-[100dvh] sm:max-h-[92vh]">
          <!-- Modal Header -->
          <div class="flex items-center justify-between p-4 sm:p-5 border-b border-gray-100 dark:border-gray-800">
            <div class="flex items-center gap-2.5">
              <div class="size-9 rounded-xl bg-brand-50 dark:bg-brand-950 flex items-center justify-center text-brand-600 dark:text-brand-400">
                <UIcon name="i-heroicons-ticket" class="size-5" />
              </div>
              <div>
                <h2 class="text-lg font-black text-gray-900 dark:text-white">
                  {{ isEditing ? 'Editar Boleto' : 'Registrar Nuevo Boleto' }}
                </h2>
                <p class="text-xs text-gray-500 dark:text-gray-400">
                  Guarda foto, tipo de sorteo, gastos y premios
                </p>
              </div>
            </div>

            <UButton icon="i-heroicons-x-mark" color="neutral" variant="ghost" size="sm" @click="isOpen = false" />
          </div>

          <!-- Modal Scrollable Body -->
          <div class="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5">
            <!-- 1. PHOTO CAPTURE & ATTACHMENT SECTION -->
            <div class="p-4 rounded-2xl bg-brand-50/40 dark:bg-brand-950/20 border border-brand-100 dark:border-brand-900/40 space-y-3">
              <div class="flex items-center justify-between">
                <span class="text-xs font-bold uppercase tracking-wider text-brand-900 dark:text-brand-200 flex items-center gap-1.5">
                  <UIcon name="i-heroicons-camera" class="size-4 text-brand-600 dark:text-brand-400" />
                  Foto del Boleto (Almacenamiento Local)
                </span>
                <span v-if="state.ticketPhoto" class="text-xs text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1">
                  <UIcon name="i-heroicons-check-circle" class="size-4" /> Foto lista
                </span>
              </div>

              <!-- When photo is present: preview & actions -->
              <div v-if="state.ticketPhoto" class="flex items-center gap-4">
                <div class="relative size-20 rounded-xl overflow-hidden border border-gray-200 dark:border-gray-700 shadow-xs shrink-0">
                  <img :src="state.ticketPhoto" alt="Boleto" class="w-full h-full object-cover" />
                </div>
                <div class="space-y-1.5">
                  <div class="flex items-center gap-2">
                    <UButton
                      size="xs"
                      color="primary"
                      variant="subtle"
                      icon="i-heroicons-sparkles"
                      label="Re-escanear con OCR"
                      :loading="isRunningOcr"
                      @click="runOcrAnalysis(state.ticketPhoto!)"
                    />
                    <UButton
                      size="xs"
                      color="error"
                      variant="ghost"
                      icon="i-heroicons-trash"
                      label="Quitar foto"
                      @click="removePhoto"
                    />
                  </div>
                  <p class="text-[11px] text-gray-500 dark:text-gray-400">
                    Guardado seguro en tu navegador en alta calidad.
                  </p>
                </div>
              </div>

              <!-- When no photo yet: Camera & Gallery buttons -->
              <div v-else class="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  class="flex flex-col items-center justify-center p-4 rounded-xl border-2 border-dashed border-brand-300 dark:border-brand-800 bg-white dark:bg-gray-900 hover:bg-brand-50/50 dark:hover:bg-brand-950/40 transition-colors cursor-pointer group"
                  @click="openCamera"
                >
                  <UIcon name="i-heroicons-camera" class="size-6 text-brand-600 dark:text-brand-400 group-hover:scale-110 transition-transform mb-1" />
                  <span class="text-xs font-bold text-gray-800 dark:text-gray-200">Hacer Foto</span>
                  <span class="text-[10px] text-gray-400">Cámara del móvil</span>
                </button>

                <button
                  type="button"
                  class="flex flex-col items-center justify-center p-4 rounded-xl border-2 border-dashed border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors cursor-pointer group"
                  @click="openGallery"
                >
                  <UIcon name="i-heroicons-photo" class="size-6 text-gray-500 group-hover:scale-110 transition-transform mb-1" />
                  <span class="text-xs font-bold text-gray-800 dark:text-gray-200">Galería / Archivo</span>
                  <span class="text-[10px] text-gray-400">Seleccionar imagen</span>
                </button>
              </div>
            </div>

            <!-- 2. ORGANIZATION SELECTOR (ONLAE / ONCE / OTROS) -->
            <div class="space-y-1.5">
              <label class="block text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wide">
                Organización de Lotería
              </label>
              <div class="grid grid-cols-3 gap-2">
                <!-- ONLAE -->
                <button
                  type="button"
                  class="p-2.5 rounded-xl border text-center transition-all cursor-pointer flex flex-col items-center gap-1"
                  :class="state.organization === 'onlae'
                    ? 'bg-blue-50 dark:bg-blue-950/50 border-brand-600 text-brand-900 dark:text-brand-100 font-bold ring-2 ring-brand-500/20'
                    : 'border-gray-200 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50 text-gray-700 dark:text-gray-300'"
                  @click="state.organization = 'onlae'"
                >
                  <UIcon name="i-heroicons-building-library" class="size-5 text-blue-600" />
                  <span class="text-xs leading-none">ONLAE</span>
                  <span class="text-[10px] opacity-70 leading-none">Loterías Estado</span>
                </button>

                <!-- ONCE -->
                <button
                  type="button"
                  class="p-2.5 rounded-xl border text-center transition-all cursor-pointer flex flex-col items-center gap-1"
                  :class="state.organization === 'once'
                    ? 'bg-emerald-50 dark:bg-emerald-950/50 border-emerald-600 text-emerald-900 dark:text-emerald-100 font-bold ring-2 ring-emerald-500/20'
                    : 'border-gray-200 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50 text-gray-700 dark:text-gray-300'"
                  @click="state.organization = 'once'"
                >
                  <UIcon name="i-heroicons-sparkles" class="size-5 text-emerald-600" />
                  <span class="text-xs leading-none">ONCE</span>
                  <span class="text-[10px] opacity-70 leading-none">Cupones / Rascas</span>
                </button>

                <!-- OTROS -->
                <button
                  type="button"
                  class="p-2.5 rounded-xl border text-center transition-all cursor-pointer flex flex-col items-center gap-1"
                  :class="state.organization === 'otros'
                    ? 'bg-purple-50 dark:bg-purple-950/50 border-purple-600 text-purple-900 dark:text-purple-100 font-bold ring-2 ring-purple-500/20'
                    : 'border-gray-200 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50 text-gray-700 dark:text-gray-300'"
                  @click="state.organization = 'otros'"
                >
                  <UIcon name="i-heroicons-puzzle-piece" class="size-5 text-purple-600" />
                  <span class="text-xs leading-none">Otros</span>
                  <span class="text-[10px] opacity-70 leading-none">Rifas / Catalunya</span>
                </button>
              </div>
            </div>

            <!-- 3. GAME SELECTOR & DRAW DATE -->
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <!-- Game Selection -->
              <div class="space-y-1.5">
                <label class="block text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wide">
                  Tipo de Juego
                </label>
                <select
                  v-model="state.game"
                  class="w-full px-3 py-2.5 rounded-xl bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 text-sm font-semibold text-gray-900 dark:text-white focus:ring-2 focus:ring-brand-500 outline-none"
                >
                  <option v-for="g in gamesList" :key="g.id" :value="g.id">
                    {{ g.name }}
                  </option>
                </select>
              </div>

              <!-- Draw Date (Fecha del Sorteo) -->
              <div class="space-y-1.5">
                <label class="block text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wide">
                  Fecha del Sorteo
                </label>
                <input
                  v-model="state.drawDate"
                  type="date"
                  class="w-full px-3 py-2.5 rounded-xl bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 text-sm font-semibold text-gray-900 dark:text-white focus:ring-2 focus:ring-brand-500 outline-none"
                />
              </div>
            </div>

            <!-- 4. TITLE / DESCRIPTION -->
            <div class="space-y-1.5">
              <label class="block text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wide">
                Título o Identificador
              </label>
              <input
                v-model="state.title"
                type="text"
                placeholder="Ej. Euromillones 2 apuestas, Décimo Navidad 84920..."
                class="w-full px-3 py-2.5 rounded-xl bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-brand-500 outline-none"
              />
            </div>

            <!-- 5. PLAYED NUMBERS & COMBINATIONS -->
            <div class="space-y-1.5">
              <label class="block text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wide">
                Combinación / Números Jugados (Opcional)
              </label>
              <input
                v-model="state.numbers"
                type="text"
                placeholder="Ej: 04 15 23 38 42 (R: 5) o Número 74821 Serie 04 Frac 2"
                class="w-full px-3 py-2.5 rounded-xl bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 text-sm font-mono text-gray-900 dark:text-white focus:ring-2 focus:ring-brand-500 outline-none"
              />
            </div>

            <!-- 6. GASTO (COST) & APUESTAS -->
            <div class="grid grid-cols-2 gap-4">
              <div class="space-y-1.5">
                <label class="block text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wide">
                  Gasto (€)
                </label>
                <div class="relative">
                  <input
                    v-model="costInput"
                    type="text"
                    inputmode="decimal"
                    placeholder="1.00"
                    class="w-full pl-3 pr-8 py-2.5 rounded-xl bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 text-base font-black text-gray-900 dark:text-white focus:ring-2 focus:ring-brand-500 outline-none"
                  />
                  <span class="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 font-bold">€</span>
                </div>
              </div>

              <div class="space-y-1.5">
                <label class="block text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wide">
                  Nº Apuestas
                </label>
                <input
                  v-model.number="state.betsCount"
                  type="number"
                  min="1"
                  max="100"
                  class="w-full px-3 py-2.5 rounded-xl bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 text-base font-semibold text-gray-900 dark:text-white focus:ring-2 focus:ring-brand-500 outline-none"
                />
              </div>
            </div>

            <!-- 7. STATUS & PREMIOS -->
            <div class="p-4 rounded-2xl bg-gray-50 dark:bg-gray-800/40 border border-gray-200 dark:border-gray-800 space-y-3">
              <label class="block text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wide">
                Estado del Sorteo y Premio
              </label>

              <div class="grid grid-cols-2 sm:grid-cols-4 gap-2">
                <button
                  type="button"
                  class="p-2 rounded-xl border text-center text-xs font-bold cursor-pointer transition-all"
                  :class="state.status === 'pending'
                    ? 'bg-blue-100 border-blue-500 text-blue-900 dark:bg-blue-900/60 dark:text-blue-100'
                    : 'border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400'"
                  @click="state.status = 'pending'"
                >
                  Pendiente
                </button>

                <button
                  type="button"
                  class="p-2 rounded-xl border text-center text-xs font-bold cursor-pointer transition-all"
                  :class="state.status === 'won'
                    ? 'bg-emerald-100 border-emerald-500 text-emerald-900 dark:bg-emerald-900/60 dark:text-emerald-100'
                    : 'border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400'"
                  @click="state.status = 'won'"
                >
                  Premiado
                </button>

                <button
                  type="button"
                  class="p-2 rounded-xl border text-center text-xs font-bold cursor-pointer transition-all"
                  :class="state.status === 'refund'
                    ? 'bg-cyan-100 border-cyan-500 text-cyan-900 dark:bg-cyan-900/60 dark:text-cyan-100'
                    : 'border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400'"
                  @click="state.status = 'refund'"
                >
                  Reintegro
                </button>

                <button
                  type="button"
                  class="p-2 rounded-xl border text-center text-xs font-bold cursor-pointer transition-all"
                  :class="state.status === 'lost'
                    ? 'bg-rose-100 border-rose-500 text-rose-900 dark:bg-rose-900/60 dark:text-rose-100'
                    : 'border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400'"
                  @click="state.status = 'lost'"
                >
                  No Premiado
                </button>
              </div>

              <!-- Prize input if won or refund -->
              <div v-if="state.status === 'won'" class="pt-2">
                <label class="block text-xs font-bold text-emerald-700 dark:text-emerald-300 uppercase">
                  Premio Obtenido (€)
                </label>
                <div class="relative mt-1">
                  <input
                    v-model="prizeInput"
                    type="text"
                    inputmode="decimal"
                    placeholder="0.00"
                    class="w-full pl-3 pr-8 py-2 rounded-xl bg-white dark:bg-gray-900 border border-emerald-400 dark:border-emerald-600 text-base font-black text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                  <span class="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 font-bold">€</span>
                </div>
              </div>
            </div>

            <!-- 8. NOTES -->
            <div class="space-y-1.5">
              <label class="block text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wide">
                Notas adicionales (Opcional)
              </label>
              <textarea
                v-model="state.notes"
                rows="2"
                placeholder="Lugar de compra, administración, peña, etc."
                class="w-full px-3 py-2 rounded-xl bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 text-sm text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>
          </div>

          <!-- Modal Footer -->
          <div class="p-4 sm:p-5 border-t border-gray-100 dark:border-gray-800 flex items-center justify-end gap-3">
            <UButton color="neutral" variant="ghost" label="Cancelar" @click="isOpen = false" />
            <UButton
              color="primary"
              icon="i-heroicons-check"
              :loading="isProcessingImage"
              :label="isEditing ? 'Guardar Cambios' : 'Añadir Boleto'"
              @click="handleSave"
            />
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>
