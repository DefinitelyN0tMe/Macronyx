import { create } from 'zustand'
import type { Macro, MacroEvent } from '@shared/types'

interface HistoryEntry {
  events: MacroEvent[]
  label: string
}

interface EditorState {
  macro: Macro | null
  selectedEventIds: string[]
  zoom: number
  scrollOffset: number
  playheadMs: number
  isPreviewPlaying: boolean

  history: HistoryEntry[]
  historyIndex: number

  loadMacro: (macro: Macro) => void
  selectEvents: (ids: string[]) => void
  toggleSelectEvent: (id: string) => void
  updateEvent: (id: string, changes: Partial<MacroEvent>) => void
  deleteEvents: (ids: string[]) => void
  moveEvent: (id: string, newTimestamp: number) => void
  setZoom: (zoom: number) => void
  setScrollOffset: (offset: number) => void
  setPlayheadMs: (ms: number) => void
  undo: () => void
  redo: () => void
  saveMacro: () => Promise<void>
}

function recalculateDelays(events: MacroEvent[]): MacroEvent[] {
  const sorted = [...events].sort((a, b) => a.timestamp - b.timestamp)
  return sorted.map((event, i) => ({
    ...event,
    delay: i === 0 ? event.timestamp : event.timestamp - sorted[i - 1].timestamp
  }))
}

export const useEditorStore = create<EditorState>((set, get) => ({
  macro: null,
  selectedEventIds: [],
  zoom: 100,
  scrollOffset: 0,
  playheadMs: 0,
  isPreviewPlaying: false,
  history: [],
  historyIndex: -1,

  loadMacro: (macro) => {
    set({
      macro,
      selectedEventIds: [],
      history: [{ events: [...macro.events], label: 'Initial' }],
      historyIndex: 0,
      scrollOffset: 0,
      playheadMs: 0
    })
  },

  selectEvents: (ids) => set({ selectedEventIds: ids }),

  toggleSelectEvent: (id) => {
    const { selectedEventIds } = get()
    if (selectedEventIds.includes(id)) {
      set({ selectedEventIds: selectedEventIds.filter((i) => i !== id) })
    } else {
      set({ selectedEventIds: [...selectedEventIds, id] })
    }
  },

  updateEvent: (id, changes) => {
    const { macro, history, historyIndex } = get()
    if (!macro) return
    const events = macro.events.map((e) => (e.id === id ? { ...e, ...changes } : e))
    const recalced = recalculateDelays(events)
    const duration = recalced.length > 0 ? recalced[recalced.length - 1].timestamp : 0
    const newHistory = history.slice(0, historyIndex + 1)
    newHistory.push({ events: recalced, label: 'Edit event' })
    set({
      macro: { ...macro, events: recalced, duration },
      history: newHistory,
      historyIndex: newHistory.length - 1
    })
  },

  deleteEvents: (ids) => {
    const { macro, history, historyIndex } = get()
    if (!macro) return
    const events = macro.events.filter((e) => !ids.includes(e.id))
    const recalced = recalculateDelays(events)
    const duration = recalced.length > 0 ? recalced[recalced.length - 1].timestamp : 0
    const newHistory = history.slice(0, historyIndex + 1)
    newHistory.push({ events: recalced, label: `Delete ${ids.length} events` })
    set({
      macro: { ...macro, events: recalced, duration },
      selectedEventIds: [],
      history: newHistory,
      historyIndex: newHistory.length - 1
    })
  },

  moveEvent: (id, newTimestamp) => {
    const { macro, history, historyIndex } = get()
    if (!macro) return
    const events = macro.events.map((e) =>
      e.id === id ? { ...e, timestamp: Math.max(0, newTimestamp) } : e
    )
    const recalced = recalculateDelays(events)
    const duration = recalced.length > 0 ? recalced[recalced.length - 1].timestamp : 0
    const newHistory = history.slice(0, historyIndex + 1)
    newHistory.push({ events: recalced, label: 'Move event' })
    set({
      macro: { ...macro, events: recalced, duration },
      history: newHistory,
      historyIndex: newHistory.length - 1
    })
  },

  setZoom: (zoom) => set({ zoom: Math.max(10, Math.min(500, zoom)) }),
  setScrollOffset: (offset) => set({ scrollOffset: Math.max(0, offset) }),
  setPlayheadMs: (ms) => set({ playheadMs: Math.max(0, ms) }),

  undo: () => {
    const { history, historyIndex, macro } = get()
    if (historyIndex <= 0 || !macro) return
    const newIndex = historyIndex - 1
    const events = [...history[newIndex].events]
    const duration = events.length > 0 ? events[events.length - 1].timestamp : 0
    set({
      macro: { ...macro, events, duration },
      historyIndex: newIndex
    })
  },

  redo: () => {
    const { history, historyIndex, macro } = get()
    if (historyIndex >= history.length - 1 || !macro) return
    const newIndex = historyIndex + 1
    const events = [...history[newIndex].events]
    const duration = events.length > 0 ? events[events.length - 1].timestamp : 0
    set({
      macro: { ...macro, events, duration },
      historyIndex: newIndex
    })
  },

  saveMacro: async () => {
    const { macro } = get()
    if (!macro) return
    const updated = { ...macro, updatedAt: new Date().toISOString() }
    await window.api.updateMacro(updated)
    set({ macro: updated })
  }
}))
