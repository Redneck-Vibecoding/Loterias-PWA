import {
  getTickets,
  getSettings,
  setTickets,
  setSettings
} from '~/utils/appDatabase'

export default defineNuxtPlugin(async () => {
  try {
    const lotteryStore = useLotteryStore()
    const settingsStore = useSettingsStore()

    const [tickets, settings] = await Promise.all([
      getTickets(),
      getSettings()
    ])

    if (tickets && Array.isArray(tickets)) {
      lotteryStore.tickets = tickets
    } else {
      // If first run and empty, optionally load sample data so app shows immediate value
      if (lotteryStore.tickets.length === 0) {
        await lotteryStore.loadSampleData()
      }
    }

    if (settings) {
      settingsStore.$patch(settings)
    }

    lotteryStore.isLoaded = true

    watch(() => lotteryStore.tickets, async (updatedTickets) => {
      try {
        await setTickets(updatedTickets)
      } catch (e) {
        console.error('Error auto-syncing tickets:', e)
      }
    }, { deep: true })
  } catch (err) {
    console.error('Failed to initialize IndexedDB persistence:', err)
  }
})
