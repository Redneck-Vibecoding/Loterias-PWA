<script setup lang="ts">
import { storeToRefs } from 'pinia'
import {
  getDatabaseUsageStats,
  type AppDatabaseUsageStats
} from '~/utils/appDatabase'
import type { LotteryOrganization } from '~/utils/lotteryGames'
import { DEFAULT_GITHUB_PAGES_URL, getAppShareUrl, shareApp } from '~/utils/shareApp'

const lotteryStore = useLotteryStore()
const settingsStore = useSettingsStore()
const { tickets } = storeToRefs(lotteryStore)
const runtimeConfig = useRuntimeConfig()
const { public: { appVersion, appReleaseDate } } = runtimeConfig
const { t } = useI18n()
const toast = useToast()
const isSharingApp = ref(false)

const monthlyBudgetInput = ref(String(settingsStore.monthlyBudget || 50))
const selectedOrg = ref<LotteryOrganization>(settingsStore.defaultOrganization || 'onlae')

const storageStats = ref<AppDatabaseUsageStats | null>(null)
const isLoadingStats = ref(false)

const loadStorageStats = async () => {
  isLoadingStats.value = true
  try {
    storageStats.value = await getDatabaseUsageStats()
  } finally {
    isLoadingStats.value = false
  }
}

onMounted(() => {
  loadStorageStats()
})

const handleSavePreferences = async () => {
  const budget = parseFloat(monthlyBudgetInput.value.replace(',', '.')) || 50
  await settingsStore.updateMonthlyBudget(budget)
  await settingsStore.updateDefaultOrganization(selectedOrg.value)
  toast.add({
    title: 'Preferencias guardadas',
    description: 'Se han actualizado tus ajustes con éxito',
    color: 'success'
  })
}

const handleLoadSampleData = async () => {
  if (confirm('¿Cargar boletos de prueba? Se añadirán ejemplos realistas de Euromillones, Bonoloto, Cuponazo, Lotería de Navidad, etc.')) {
    await lotteryStore.loadSampleData()
    await loadStorageStats()
    toast.add({
      title: 'Datos cargados',
      description: 'Se han cargado boletos de prueba para análisis y filtros',
      color: 'success'
    })
  }
}

const handleClearAll = async () => {
  if (confirm('¿Estás seguro de que deseas eliminar TODOS los boletos y fotos? Esta acción no se puede deshacer.')) {
    await lotteryStore.clearAll()
    await loadStorageStats()
    toast.add({
      title: 'Boletos eliminados',
      description: 'La base de datos local ha sido vaciada',
      color: 'info'
    })
  }
}

// Backup Export
const handleExportBackup = () => {
  const data = {
    app: 'LotoControl PWA',
    version: '1.0.0',
    exportedAt: new Date().toISOString(),
    tickets: tickets.value,
    settings: settingsStore.$state
  }

  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `lotocontrol-backup-${new Date().toISOString().slice(0, 10)}.json`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)

  toast.add({
    title: 'Copia exportada',
    description: 'Archivo JSON descargado correctamente',
    color: 'success'
  })
}

// Backup Import
const fileInputRef = ref<HTMLInputElement | null>(null)
const handleImportClick = () => {
  fileInputRef.value?.click()
}

const handleFileSelected = async (e: Event) => {
  const input = e.target as HTMLInputElement
  const file = input.files?.[0]
  if (!file) return

  try {
    const text = await file.text()
    const parsed = JSON.parse(text)
    if (parsed.tickets && Array.isArray(parsed.tickets)) {
      for (const t of parsed.tickets) {
        await lotteryStore.saveTicket(t)
      }
      if (parsed.settings) {
        await settingsStore.loadSettings(parsed.settings)
      }
      await loadStorageStats()
      toast.add({
        title: 'Copia restaurada',
        description: `Se han importado ${parsed.tickets.length} boletos con éxito`,
        color: 'success'
      })
    } else {
      toast.add({
        title: 'Error de formato',
        description: 'El archivo no contiene un formato de copia válido',
        color: 'error'
      })
    }
  } catch (err) {
    console.error('Import error:', err)
    toast.add({
      title: 'Error al importar',
      description: 'No se pudo leer el archivo JSON seleccionado',
      color: 'error'
    })
  } finally {
    input.value = ''
  }
}

const formatBytes = (bytes: number): string => {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`
}

const handleShareApp = async () => {
  if (isSharingApp.value) return
  isSharingApp.value = true
  try {
    const baseURL = (runtimeConfig.app?.baseURL as string) || '/'
    const shareUrl = getAppShareUrl(baseURL, DEFAULT_GITHUB_PAGES_URL)

    const outcome = await shareApp({
      title: t('settings.share_app_title'),
      text: t('settings.share_app_text'),
      url: shareUrl
    })

    if (outcome === 'shared') {
      toast.add({
        title: t('settings.share_app_success'),
        color: 'success',
        icon: 'i-heroicons-check-circle'
      })
    } else if (outcome === 'copied') {
      toast.add({
        title: t('settings.share_app_copied'),
        description: shareUrl,
        color: 'success',
        icon: 'i-heroicons-check-circle'
      })
    } else if (outcome === 'failed') {
      toast.add({
        title: shareUrl,
        color: 'neutral'
      })
    }
  } finally {
    isSharingApp.value = false
  }
}
</script>

<template>
  <div class="max-w-3xl mx-auto space-y-6">
    <input ref="fileInputRef" type="file" accept=".json" class="hidden" @change="handleFileSelected" />

    <!-- App Version Identifier -->
    <div class="rounded-3xl bg-gradient-to-r from-brand-700 via-brand-600 to-brand-800 text-white p-4 sm:p-5 shadow-md flex flex-wrap items-center justify-between gap-3">
      <div class="flex items-center gap-3">
        <SiteLogo class="size-11 shrink-0 rounded-2xl shadow-xs" />
        <div>
          <span class="text-sm sm:text-base font-black tracking-tight block">LotoControl PWA</span>
          <span class="text-xs text-blue-100 block">Control de Boletos y Premios</span>
        </div>
      </div>

      <div class="flex items-center justify-end gap-2 sm:gap-3 ml-auto">
        <div class="flex items-center gap-2">
          <span class="text-[11px] font-bold uppercase tracking-wider text-blue-200">Versión</span>
          <span class="px-2.5 py-1 rounded-xl bg-white/15 border border-white/25 font-mono text-xs sm:text-sm font-black text-white">
            v{{ appVersion }}
          </span>
          <span v-if="appReleaseDate" class="text-xs text-blue-100 hidden sm:inline">
            ({{ appReleaseDate }})
          </span>
        </div>

        <UButton
          id="share-app-url-btn"
          icon="i-heroicons-share"
          color="neutral"
          variant="ghost"
          size="sm"
          class="bg-white/15 hover:bg-white/25 text-white border border-white/25 rounded-xl cursor-pointer font-semibold shrink-0"
          :loading="isSharingApp"
          @click="handleShareApp"
        >
          {{ $t('settings.share_app') }}
        </UButton>
      </div>
    </div>

    <!-- Header -->
    <div>
      <h1 class="text-2xl sm:text-3xl font-black text-gray-900 dark:text-white tracking-tight">
        Ajustes y Datos
      </h1>
      <p class="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-0.5">
        Gestiona tus preferencias de presupuesto, copias de seguridad y almacenamiento
      </p>
    </div>

    <!-- 1. GENERAL PREFERENCES -->
    <div class="rounded-3xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 p-5 sm:p-6 shadow-xs space-y-4">
      <div class="flex items-center gap-3">
        <div class="size-9 rounded-xl bg-blue-50 dark:bg-blue-950 flex items-center justify-center text-brand-600 dark:text-brand-400">
          <UIcon name="i-heroicons-adjustments-vertical" class="size-5" />
        </div>
        <div>
          <h2 class="text-base font-bold text-gray-900 dark:text-white">Preferencias de Lotería</h2>
          <p class="text-xs text-gray-500 dark:text-gray-400">Objetivo mensual y organización por defecto</p>
        </div>
      </div>

      <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
        <div class="space-y-1.5">
          <label class="block text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wide">
            Presupuesto Mensual Objetivo (€)
          </label>
          <div class="relative">
            <input
              v-model="monthlyBudgetInput"
              type="text"
              inputmode="decimal"
              class="w-full px-3 py-2 rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-sm font-bold text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-brand-500"
            />
            <span class="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 font-bold">€</span>
          </div>
          <p class="text-[11px] text-gray-400">Te ayuda a comparar tu gasto acumulado mensual</p>
        </div>

        <div class="space-y-1.5">
          <label class="block text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wide">
            Organización Preferida
          </label>
          <select
            v-model="selectedOrg"
            class="w-full px-3 py-2 rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-sm font-semibold text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-brand-500"
          >
            <option value="onlae">ONLAE / Loterías y Apuestas del Estado</option>
            <option value="once">ONCE</option>
            <option value="otros">Otros Sorteos y Rifas</option>
          </select>
          <p class="text-[11px] text-gray-400">Seleccionada por defecto al añadir un nuevo boleto</p>
        </div>
      </div>

      <div class="pt-2 flex justify-end">
        <UButton
          color="primary"
          icon="i-heroicons-check"
          label="Guardar Preferencias"
          size="sm"
          @click="handleSavePreferences"
        />
      </div>
    </div>

    <!-- 2. DATA MANAGEMENT (SEED & CLEAR) -->
    <div class="rounded-3xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 p-5 sm:p-6 shadow-xs space-y-4">
      <div class="flex items-center gap-3">
        <div class="size-9 rounded-xl bg-amber-50 dark:bg-amber-950 flex items-center justify-center text-amber-600">
          <UIcon name="i-heroicons-circle-stack" class="size-5" />
        </div>
        <div>
          <h2 class="text-base font-bold text-gray-900 dark:text-white">Datos de Prueba y Mantenimiento</h2>
          <p class="text-xs text-gray-500 dark:text-gray-400">Poblar o restablecer los datos de la aplicación</p>
        </div>
      </div>

      <div class="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 pt-2">
        <UButton
          color="primary"
          variant="subtle"
          icon="i-heroicons-sparkles"
          label="Cargar Boletos de Prueba (Seed)"
          @click="handleLoadSampleData"
        />

        <UButton
          color="error"
          variant="outline"
          icon="i-heroicons-trash"
          label="Borrar Todos los Boletos"
          @click="handleClearAll"
        />
      </div>
    </div>

    <!-- 3. BACKUP & RESTORE (JSON) -->
    <div class="rounded-3xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 p-5 sm:p-6 shadow-xs space-y-4">
      <div class="flex items-center gap-3">
        <div class="size-9 rounded-xl bg-emerald-50 dark:bg-emerald-950 flex items-center justify-center text-emerald-600">
          <UIcon name="i-heroicons-arrow-down-tray" class="size-5" />
        </div>
        <div>
          <h2 class="text-base font-bold text-gray-900 dark:text-white">Copia de Seguridad (Backup)</h2>
          <p class="text-xs text-gray-500 dark:text-gray-400">Exporta e importa tus boletos en archivo JSON seguro</p>
        </div>
      </div>

      <div class="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 pt-2">
        <UButton
          color="neutral"
          variant="outline"
          icon="i-heroicons-arrow-down-tray"
          label="Exportar Copia (JSON)"
          @click="handleExportBackup"
        />

        <UButton
          color="neutral"
          variant="outline"
          icon="i-heroicons-arrow-up-tray"
          label="Importar Copia (JSON)"
          @click="handleImportClick"
        />
      </div>
    </div>

    <!-- 4. STORAGE & OFFLINE PERSISTENCE INFO -->
    <div class="rounded-3xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 p-5 sm:p-6 shadow-xs space-y-4">
      <div class="flex items-center gap-3">
        <div class="size-9 rounded-xl bg-purple-50 dark:bg-purple-950 flex items-center justify-center text-purple-600">
          <UIcon name="i-heroicons-server-stack" class="size-5" />
        </div>
        <div>
          <h2 class="text-base font-bold text-gray-900 dark:text-white">Almacenamiento Local (IndexedDB)</h2>
          <p class="text-xs text-gray-500 dark:text-gray-400">
            Tus boletos y fotos se almacenan de forma privada en tu dispositivo
          </p>
        </div>
      </div>

      <div v-if="storageStats" class="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-2">
        <div class="p-3 rounded-2xl bg-gray-50 dark:bg-gray-800/40 border border-gray-100 dark:border-gray-800">
          <span class="block text-[10px] uppercase font-bold text-gray-400">Boletos Registrados</span>
          <span class="text-base font-black text-gray-900 dark:text-white mt-0.5 block">
            {{ tickets.length }}
          </span>
        </div>

        <div class="p-3 rounded-2xl bg-gray-50 dark:bg-gray-800/40 border border-gray-100 dark:border-gray-800">
          <span class="block text-[10px] uppercase font-bold text-gray-400">Fotos de Boletos</span>
          <span class="text-base font-black text-gray-900 dark:text-white mt-0.5 block">
            {{ storageStats.attachmentCount }}
          </span>
        </div>

        <div class="p-3 rounded-2xl bg-gray-50 dark:bg-gray-800/40 border border-gray-100 dark:border-gray-800 col-span-2 sm:col-span-1">
          <span class="block text-[10px] uppercase font-bold text-gray-400">Espacio Ocupado</span>
          <span class="text-base font-black text-gray-900 dark:text-white mt-0.5 block">
            {{ formatBytes(storageStats.totalBytes) }}
          </span>
        </div>
      </div>
    </div>
  </div>
</template>
