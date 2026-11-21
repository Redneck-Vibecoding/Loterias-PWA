<script setup lang="ts">
const links = [
  {
    label: 'Inicio',
    icon: 'i-heroicons-home',
    to: '/'
  },
  {
    label: 'Boletos',
    icon: 'i-heroicons-ticket',
    to: '/tickets'
  },
  {
    label: 'Estadísticas',
    icon: 'i-heroicons-chart-bar',
    to: '/statistics'
  },
  {
    label: 'Ajustes',
    icon: 'i-heroicons-cog-6-tooth',
    to: '/settings'
  }
]

const { public: { appVersion } } = useRuntimeConfig()
</script>

<template>
  <div class="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col font-sans transition-colors">
    <!-- Header -->
    <AppHeader />

    <!-- Main Content -->
    <main class="flex-1 container mx-auto px-4 py-6 mb-20 md:mb-8 max-w-6xl">
      <slot />
    </main>

    <!-- Bottom Nav (Mobile) -->
    <AppBottomNav class="md:hidden" :links="links" />

    <!-- Footer (Desktop) -->
    <footer class="hidden md:block border-t border-slate-200 dark:border-slate-800 py-6 text-center text-xs text-slate-500">
      <p>
        &copy; {{ new Date().getFullYear() }} LotoControl PWA · Control de Loterías del ONLAE, ONCE y Otros
        <span class="ml-2 opacity-60">v{{ appVersion }}</span>
      </p>
    </footer>
  </div>
</template>
