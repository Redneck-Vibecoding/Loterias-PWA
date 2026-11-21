import { defineStore } from 'pinia'
import { setSettings as persistSettings } from '~/utils/appDatabase'
import type { LotteryOrganization } from '~/utils/lotteryGames'

export interface SettingsState {
  monthlyBudget: number
  defaultOrganization: LotteryOrganization
  currency: string
  openAiApiKey?: string
}

export const useSettingsStore = defineStore('settings', {
  state: (): SettingsState => ({
    monthlyBudget: 50,
    defaultOrganization: 'onlae',
    currency: '€',
    openAiApiKey: ''
  }),
  actions: {
    async updateMonthlyBudget(budget: number) {
      this.monthlyBudget = budget
      await persistSettings(this.$state)
    },
    async updateDefaultOrganization(org: LotteryOrganization) {
      this.defaultOrganization = org
      await persistSettings(this.$state)
    },
    async loadSettings(settings: Partial<SettingsState> & Record<string, unknown>) {
      if (typeof settings.monthlyBudget === 'number') this.monthlyBudget = settings.monthlyBudget
      if (typeof settings.defaultOrganization === 'string') this.defaultOrganization = settings.defaultOrganization as LotteryOrganization
      if (typeof settings.currency === 'string') this.currency = settings.currency
      if (typeof settings.openAiApiKey === 'string') this.openAiApiKey = settings.openAiApiKey
      await persistSettings(this.$state)
    }
  }
})
