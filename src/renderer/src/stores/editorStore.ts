import { create } from 'zustand'
import { v4 as uuid } from 'uuid'
import type { Macro, MacroEvent } from '@shared/types'

interface HistoryEntry {
  events: MacroEvent[]
  label: string
}

interface SmoothDelaysOptions {
  windowSize: number // 3-15
  minDelay: number // ms
  maxDelay: number // ms
}

interface EditorState {
  macro: Macro | null
  selectedEventIds: string[]
  zoom: number
  scrollOffset: number
  playheadMs: number
  isPreviewPlaying: boolean
  isDirty: boolean
  clipboard: MacroEvent[]

  history: HistoryEntry[]
  historyIndex: number

  loadMacro: (macro: Macro) => void
  renameMacro: (name: string) => void
  updateMacroDescription: (description: string) => void
  selectEvents: (ids: string[]) => void
  toggleSelectEvent: (id: string) => void
  updateEvent: (id: string, changes: Partial<MacroEvent>) => void
  deleteEvents: (ids: string[]) => void
  moveEvent: (id: string, newTimestamp: number) => void
  copyEvents: (ids: string[]) => void
  pasteEvents: () => void
  updateEvents: (ids: string[], changes: Partial<MacroEvent>) => void
  offsetEvents: (ids: string[], deltaMs: number) => void
  scaleDelays: (ids: string[], factor: number) => void
  groupEvents: (ids: string[], groupName: string) => void
  ungroupEvents: (ids: string[]) => void
  renameGroup: (oldName: string, newName: string) => void
  smoothDelays: (options: SmoothDelaysOptions) => void
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

/** Push a new history entry and update the macro. Returns the set() payload. */
function pushHistory(
  macro: Macro,
  events: MacroEvent[],
  history: HistoryEntry[],
  historyIndex: number,
  label: string
): Partial<EditorState> {
  const recalced = recalculateDelays(events)
  const duration = recalced.length > 0 ? recalced[recalced.length - 1].timestamp : 0
  const newHistory = history.slice(0, historyIndex + 1)
  newHistory.push({ events: recalced, label })
  return {
    macro: { ...macro, events: recalced, duration },
    history: newHistory,
    historyIndex: newHistory.length - 1,
    isDirty: true
  }
}

export const useEditorStore = create<EditorState>((set, get) => ({
  macro: null,
  selectedEventIds: [],
  zoom: 100,
  scrollOffset: 0,
  playheadMs: 0,
  isPreviewPlaying: false,
  isDirty: false,
  clipboard: [],
  history: [],
  historyIndex: -1,

  loadMacro: (macro) => {
    set({
      macro,
      selectedEventIds: [],
      history: [{ events: [...macro.events], label: 'Initial' }],
      historyIndex: 0,
      scrollOffset: 0,
      playheadMs: 0,
      isDirty: false
    })
  },

  renameMacro: (name) => {
    const { macro } = get()
    if (!macro) return
    set({ macro: { ...macro, name }, isDirty: true })
  },

  updateMacroDescription: (description) => {
    const { macro } = get()
    if (!macro) return
    set({ macro: { ...macro, description }, isDirty: true })
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
    set(pushHistory(macro, events, history, historyIndex, 'Edit event'))
  },

  deleteEvents: (ids) => {
    const { macro, history, historyIndex } = get()
    if (!macro) return
    const events = macro.events.filter((e) => !ids.includes(e.id))
    set({
      ...pushHistory(macro, events, history, historyIndex, `Delete ${ids.length} events`),
      selectedEventIds: []
    })
  },

  moveEvent: (id, newTimestamp) => {
    const { macro, history, historyIndex } = get()
    if (!macro) return
    const events = macro.events.map((e) =>
      e.id === id ? { ...e, timestamp: Math.max(0, newTimestamp) } : e
    )
    set(pushHistory(macro, events, history, historyIndex, 'Move event'))
  },

  copyEvents: (ids) => {
    const { macro } = get()
    if (!macro || ids.length === 0) return
    const idSet = new Set(ids)
    const copied = macro.events
      .filter((e) => idSet.has(e.id))
      .sort((a, b) => a.timestamp - b.timestamp)
    set({ clipboard: copied })
  },

  pasteEvents: () => {
    const { macro, clipboard, history, historyIndex } = get()
    if (!macro || clipboard.length === 0) return
    // Offset clipboard events to appear at the end of the macro
    const macroEnd = macro.events.length > 0
      ? Math.max(...macro.events.map((e) => e.timestamp))
      : 0
    const clipStart = clipboard[0].timestamp
    const gap = 100 // 100ms gap between end of macro and pasted events
    const pasted = clipboard.map((e) => ({
      ...e,
      id: uuid(),
      timestamp: e.timestamp - clipStart + macroEnd + gap
    }))
    const events = [...macro.events, ...pasted]
    const result = pushHistory(macro, events, history, historyIndex, `Paste ${pasted.length} events`)
    set({
      ...result,
      selectedEventIds: pasted.map((e) => e.id)
    })
  },

  updateEvents: (ids, changes) => {
    const { macro, history, historyIndex } = get()
    if (!macro || ids.length === 0) return
    const idSet = new Set(ids)
    const events = macro.events.map((e) =>
      idSet.has(e.id) ? { ...e, ...changes } : e
    )
    set(pushHistory(macro, events, history, historyIndex, `Update ${ids.length} events`))
  },

  offsetEvents: (ids, deltaMs) => {
    const { macro, history, historyIndex } = get()
    if (!macro || ids.length === 0) return
    const idSet = new Set(ids)
    const events = macro.events.map((e) =>
      idSet.has(e.id) ? { ...e, timestamp: Math.max(0, e.timestamp + deltaMs) } : e
    )
    set(pushHistory(macro, events, history, historyIndex, `Offset ${ids.length} events by ${deltaMs}ms`))
  },

  scaleDelays: (ids, factor) => {
    const { macro, history, historyIndex } = get()
    if (!macro || ids.length === 0 || factor <= 0) return
    const idSet = new Set(ids)
    // Work on sorted events to properly scale delays
    const sorted = [...macro.events].sort((a, b) => a.timestamp - b.timestamp)
    const events = sorted.map((e) => {
      if (!idSet.has(e.id)) return e
      return { ...e, delay: Math.max(0, Math.round(e.delay * factor)) }
    })
    // Recompute timestamps from adjusted delays
    const recomputed: MacroEvent[] = []
    let runningTs = 0
    for (const e of events) {
      if (recomputed.length === 0) {
        runningTs = e.delay
      } else {
        runningTs += e.delay
      }
      recomputed.push({ ...e, timestamp: runningTs })
    }
    set(pushHistory(macro, recomputed, history, historyIndex, `Scale delays by ${(factor * 100).toFixed(0)}%`))
  },

  groupEvents: (ids, groupName) => {
    const { macro, history, historyIndex } = get()
    if (!macro || ids.length === 0) return
    const idSet = new Set(ids)
    const events = macro.events.map((e) =>
      idSet.has(e.id) ? { ...e, group: groupName } : e
    )
    set(pushHistory(macro, events, history, historyIndex, `Group ${ids.length} events as "${groupName}"`))
  },

  ungroupEvents: (ids) => {
    const { macro, history, historyIndex } = get()
    if (!macro || ids.length === 0) return
    const idSet = new Set(ids)
    const events = macro.events.map((e) => {
      if (!idSet.has(e.id)) return e
      const { group: _, ...rest } = e
      return rest
    })
    set(pushHistory(macro, events, history, historyIndex, `Ungroup ${ids.length} events`))
  },

  renameGroup: (oldName, newName) => {
    const { macro, history, historyIndex } = get()
    if (!macro) return
    const events = macro.events.map((e) =>
      e.group === oldName ? { ...e, group: newName } : e
    )
    set(pushHistory(macro, events, history, historyIndex, `Rename group "${oldName}" to "${newName}"`))
  },

  smoothDelays: (options) => {
    const { macro, history, historyIndex } = get()
    if (!macro || macro.events.length === 0) return
    const { windowSize, minDelay, maxDelay } = options
    const sorted = [...macro.events].sort((a, b) => a.timestamp - b.timestamp)
    const delays = sorted.map((e) => e.delay)

    // Moving average smoothing
    const halfWindow = Math.floor(windowSize / 2)
    const smoothed = delays.map((_, i) => {
      const start = Math.max(0, i - halfWindow)
      const end = Math.min(delays.length - 1, i + halfWindow)
      let sum = 0
      let count = 0
      for (let j = start; j <= end; j++) {
        sum += delays[j]
        count++
      }
      return Math.round(sum / count)
    })

    // Clamp
    const clamped = smoothed.map((d) => Math.max(minDelay, Math.min(maxDelay, d)))

    // Recompute timestamps from smoothed delays
    const events: MacroEvent[] = []
    let runningTs = 0
    for (let i = 0; i < sorted.length; i++) {
      if (i === 0) {
        runningTs = clamped[i]
      } else {
        runningTs += clamped[i]
      }
      events.push({ ...sorted[i], delay: clamped[i], timestamp: runningTs })
    }

    set(pushHistory(macro, events, history, historyIndex, 'Smooth delays'))
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
      historyIndex: newIndex,
      isDirty: true
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
      historyIndex: newIndex,
      isDirty: true
    })
  },

  saveMacro: async () => {
    const { macro } = get()
    if (!macro) return
    const updated = { ...macro, updatedAt: new Date().toISOString() }
    await window.api.updateMacro(updated)
    set({ macro: updated, isDirty: false })
  }
}))
