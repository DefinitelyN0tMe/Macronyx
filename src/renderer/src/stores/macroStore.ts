import { create } from 'zustand'
import type { Macro } from '@shared/types'

interface MacroState {
  macros: Macro[]
  selectedMacroId: string | null
  isLoading: boolean
  searchQuery: string

  loadMacros: () => Promise<void>
  deleteMacro: (id: string) => Promise<void>
  selectMacro: (id: string | null) => void
  setSearchQuery: (query: string) => void
  getFilteredMacros: () => Macro[]
}

export const useMacroStore = create<MacroState>((set, get) => ({
  macros: [],
  selectedMacroId: null,
  isLoading: false,
  searchQuery: '',

  loadMacros: async () => {
    set({ isLoading: true })
    try {
      const macros = await window.api.listMacros()
      set({ macros: macros as Macro[], isLoading: false })
    } catch {
      set({ isLoading: false })
    }
  },

  deleteMacro: async (id) => {
    await window.api.deleteMacro(id)
    set((s) => ({
      macros: s.macros.filter((m) => m.id !== id),
      selectedMacroId: s.selectedMacroId === id ? null : s.selectedMacroId
    }))
  },

  selectMacro: (id) => set({ selectedMacroId: id }),
  setSearchQuery: (searchQuery) => set({ searchQuery }),

  getFilteredMacros: () => {
    const { macros, searchQuery } = get()
    if (!searchQuery.trim()) return macros
    const q = searchQuery.toLowerCase()
    return macros.filter(
      (m) =>
        m.name.toLowerCase().includes(q) ||
        m.description.toLowerCase().includes(q) ||
        m.tags.some((t) => t.toLowerCase().includes(q))
    )
  }
}))
