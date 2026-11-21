<script setup lang="ts">
const colorMode = useColorMode()

const isDark = computed({
  get() {
    return colorMode?.value === 'dark'
  },
  set(value: boolean) {
    if (colorMode) {
      colorMode.preference = value ? 'dark' : 'light'
    }
  }
})

const links = [
  { label: 'Inicio', to: '/' },
  { label: 'Boletos', to: '/tickets' },
  { label: 'Estadísticas', to: '/statistics' },
  { label: 'Ajustes', to: '/settings' }
]
</script>

<template>
  <header class="bg-white/95 dark:bg-gray-900/95 backdrop-blur-md border-b border-gray-200 dark:border-gray-800 sticky top-0 z-40 transition-colors">
    <div class="container mx-auto px-4 h-16 flex items-center justify-between">
      <div class="flex items-center gap-8">
        <NuxtLink to="/" class="flex items-center gap-3 hover:opacity-95 transition-opacity">
          <SiteLogo class="w-9 h-9" />
          <div class="flex items-center gap-2">
            <span class="text-xl font-black text-gray-900 dark:text-white tracking-tight">
              Loto<span class="text-brand-600 dark:text-brand-400">Control</span>
            </span>
            <span class="px-1.5 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider bg-brand-100 text-brand-800 dark:bg-brand-950 dark:text-brand-300 border border-brand-200 dark:border-brand-800">
              PWA
            </span>
          </div>
        </NuxtLink>

        <!-- Desktop Navigation -->
        <nav class="hidden md:flex items-center gap-6">
          <NuxtLink
            v-for="link in links"
            :key="link.to"
            :to="link.to"
            class="text-sm font-bold text-gray-600 dark:text-gray-300 hover:text-brand-600 dark:hover:text-brand-400 transition-colors"
            active-class="text-brand-600 dark:text-brand-400"
          >
            {{ link.label }}
          </NuxtLink>
        </nav>
      </div>

      <div class="flex items-center gap-3">
        <ClientOnly>
          <UButton
            :icon="isDark ? 'i-heroicons-moon-20-solid' : 'i-heroicons-sun-20-solid'"
            color="neutral"
            variant="ghost"
            size="sm"
            aria-label="Tema"
            title="Cambiar tema claro / oscuro"
            @click="isDark = !isDark"
          />
        </ClientOnly>
      </div>
    </div>
  </header>
</template>
