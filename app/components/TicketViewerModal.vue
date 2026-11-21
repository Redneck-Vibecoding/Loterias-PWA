<script setup lang="ts">
const props = defineProps<{
  src: string | null
  title?: string
}>()

const isOpen = defineModel<boolean>('open', { default: false })

const handleDownload = () => {
  if (!props.src) return
  const link = document.createElement('a')
  link.href = props.src
  link.download = `boleto-${props.title || 'loteria'}.jpg`
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}
</script>

<template>
  <Teleport to="body">
    <div v-if="isOpen && src" class="fixed inset-0 z-[70] flex flex-col items-center justify-center p-2 sm:p-4 bg-gray-950/90 backdrop-blur-md">
      <!-- Top Action Bar -->
      <div class="w-full max-w-4xl flex items-center justify-between p-3 text-white">
        <div class="flex items-center gap-2">
          <UIcon name="i-heroicons-ticket" class="size-5 text-brand-400" />
          <span class="text-sm font-semibold truncate">{{ title || 'Foto del Boleto' }}</span>
        </div>

        <div class="flex items-center gap-2">
          <UButton
            icon="i-heroicons-arrow-down-tray"
            color="neutral"
            variant="ghost"
            size="sm"
            title="Descargar imagen"
            @click="handleDownload"
          />
          <UButton
            icon="i-heroicons-x-mark"
            color="neutral"
            variant="ghost"
            size="sm"
            title="Cerrar"
            @click="isOpen = false"
          />
        </div>
      </div>

      <!-- Main Image View -->
      <div class="relative flex-1 w-full max-w-4xl flex items-center justify-center overflow-auto p-2">
        <img
          :src="src"
          :alt="title || 'Boleto de lotería'"
          class="max-h-[82vh] max-w-full rounded-2xl object-contain shadow-2xl border border-gray-800"
        />
      </div>
    </div>
  </Teleport>
</template>
