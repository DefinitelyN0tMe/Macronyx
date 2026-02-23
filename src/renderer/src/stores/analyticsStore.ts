import { create } from 'zustand'
import type { PlaybackLogEntry, AnalyticsAggregate, EventTimingEntry } from '../../../shared/types'

export interface DriftMetrics {
  mean: number
  median: number
  p95: number
  max: number
  totalDrift: number
  accuracyPct: number // events with |drift| < 5ms / total * 100
}

interface AnalyticsState {
  aggregate: AnalyticsAggregate | null
  selectedMacroId: string | null
  macroLogs: PlaybackLogEntry[]
  selectedLogId: string | null
  isLoading: boolean
  activeTab: 'overview' | 'macro' | 'performance'

  loadAggregate: () => Promise<void>
  loadMacroLogs: (macroId: string) => Promise<void>
  selectMacro: (macroId: string | null) => void
  selectLog: (logId: string | null) => void
  setActiveTab: (tab: 'overview' | 'macro' | 'performance') => void
  refresh: () => Promise<void>
}

export const useAnalyticsStore = create<AnalyticsState>((set, get) => ({
  aggregate: null,
  selectedMacroId: null,
  macroLogs: [],
  selectedLogId: null,
  isLoading: false,
  activeTab: 'overview',

  loadAggregate: async () => {
    set({ isLoading: true })
    try {
      const aggregate = await window.api.getAggregate()
      set({ aggregate, isLoading: false })
    } catch {
      set({ isLoading: false })
    }
  },

  loadMacroLogs: async (macroId: string) => {
    set({ isLoading: true, selectedMacroId: macroId })
    try {
      const macroLogs = await window.api.getLogsForMacro(macroId)
      set({ macroLogs, isLoading: false })
    } catch {
      set({ macroLogs: [], isLoading: false })
    }
  },

  selectMacro: (macroId: string | null) => {
    set({ selectedMacroId: macroId, macroLogs: [], selectedLogId: null })
    if (macroId) {
      get().loadMacroLogs(macroId)
    }
  },

  selectLog: (logId: string | null) => {
    set({ selectedLogId: logId })
  },

  setActiveTab: (tab) => {
    set({ activeTab: tab })
  },

  refresh: async () => {
    await get().loadAggregate()
    const { selectedMacroId } = get()
    if (selectedMacroId) {
      await get().loadMacroLogs(selectedMacroId)
    }
  }
}))

/** Compute drift metrics from event timing entries */
export function computeDriftMetrics(timings: EventTimingEntry[]): DriftMetrics {
  if (timings.length === 0) {
    return { mean: 0, median: 0, p95: 0, max: 0, totalDrift: 0, accuracyPct: 100 }
  }

  // Skip the first entry (always 0 drift)
  const drifts = timings.slice(1).map((t) => Math.abs(t.driftMs))
  if (drifts.length === 0) {
    return { mean: 0, median: 0, p95: 0, max: 0, totalDrift: 0, accuracyPct: 100 }
  }

  const sorted = [...drifts].sort((a, b) => a - b)
  const sum = drifts.reduce((a, b) => a + b, 0)
  const accurate = drifts.filter((d) => d < 5).length

  return {
    mean: sum / drifts.length,
    median: sorted[Math.floor(sorted.length / 2)],
    p95: sorted[Math.floor(sorted.length * 0.95)],
    max: sorted[sorted.length - 1],
    totalDrift: sum,
    accuracyPct: (accurate / drifts.length) * 100
  }
}
