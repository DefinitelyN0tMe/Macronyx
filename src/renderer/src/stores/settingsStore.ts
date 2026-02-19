import { create } from 'zustand'
import type { AppSettings } from '@shared/types'
import { DEFAULT_SETTINGS } from '@shared/constants'

interface SettingsState {
  settings: AppSettings
  isLoading: boolean
  loadSettings: () => Promise<void>
  updateSettings: (partial: Partial<AppSettings>) => Promise<void>
}

export const useSettingsStore = create<SettingsState>((set) => ({
  settings: DEFAULT_SETTINGS,
  isLoading: false,

  loadSettings: async () => {
    set({ isLoading: true })
    try {
      const settings = await window.api.getSettings()
      set({ settings: settings as AppSettings, isLoading: false })
    } catch {
      set({ isLoading: false })
    }
  },

  updateSettings: async (partial) => {
    try {
      const result = (await window.api.setSettings(partial)) as {
        success: boolean
        settings: AppSettings
      }
      if (result.success) {
        set({ settings: result.settings })
      }
    } catch {
      // Settings update failed
    }
  }
}))
