// Trigger Manager — monitors and fires macro triggers
// Supports: hotkey_combo, schedule, window_focus, pixel_color

import type { Macro, TriggerConfig, WindowInfo } from '../../shared/types'
import { ActiveWindowService } from './active-window'
import { PixelSampler } from './pixel-sampler'
import { HotkeyManager } from './hotkeys'
import { EventEmitter } from 'events'

interface ScheduleEntry {
  trigger: TriggerConfig
  cronParts: { minute: number[]; hour: number[]; dom: number[]; month: number[]; dow: number[] }
  lastFired: number
}

export class TriggerManager extends EventEmitter {
  private activeWindowService: ActiveWindowService
  private pixelSampler: PixelSampler
  private hotkeyManager: HotkeyManager

  private triggers: TriggerConfig[] = []
  private macroMap = new Map<string, string>() // triggerId → macroId
  private scheduleEntries: ScheduleEntry[] = []
  private scheduleInterval: ReturnType<typeof setInterval> | null = null
  private pixelInterval: ReturnType<typeof setInterval> | null = null
  private windowTriggers: TriggerConfig[] = []
  private running = false

  constructor(
    activeWindowService: ActiveWindowService,
    pixelSampler: PixelSampler,
    hotkeyManager: HotkeyManager
  ) {
    super()
    this.activeWindowService = activeWindowService
    this.pixelSampler = pixelSampler
    this.hotkeyManager = hotkeyManager
    this.onWindowChanged = this.onWindowChanged.bind(this)
  }

  /** Load all triggers from macros */
  loadTriggers(macros: Macro[]): void {
    this.triggers = []
    this.macroMap.clear()

    for (const macro of macros) {
      if (!macro.triggers) continue
      for (const trigger of macro.triggers) {
        if (!trigger.enabled) continue
        this.triggers.push(trigger)
        this.macroMap.set(trigger.id, macro.id)
      }
    }
  }

  /** Start monitoring all triggers */
  start(): void {
    if (this.running) this.stop()
    this.running = true

    // Categorize triggers by type
    const hotkeyTriggers: TriggerConfig[] = []
    const scheduleTriggers: TriggerConfig[] = []
    this.windowTriggers = []
    const pixelTriggers: TriggerConfig[] = []

    for (const trigger of this.triggers) {
      switch (trigger.type) {
        case 'hotkey_combo':
          hotkeyTriggers.push(trigger)
          break
        case 'schedule':
          scheduleTriggers.push(trigger)
          break
        case 'window_focus':
          this.windowTriggers.push(trigger)
          break
        case 'pixel_color':
          pixelTriggers.push(trigger)
          break
      }
    }

    // Register hotkey triggers
    for (const trigger of hotkeyTriggers) {
      if (!trigger.hotkey) continue
      this.hotkeyManager.registerTriggerHotkey(trigger.id, trigger.hotkey, () => {
        this.fireTrigger(trigger)
      })
    }

    // Setup schedule checking (1s interval)
    if (scheduleTriggers.length > 0) {
      this.scheduleEntries = scheduleTriggers
        .filter((t) => t.schedule)
        .map((t) => ({
          trigger: t,
          cronParts: parseCron(t.schedule!),
          lastFired: 0
        }))

      this.scheduleInterval = setInterval(() => this.checkScheduleTriggers(), 1000)
    }

    // Subscribe to window changes
    if (this.windowTriggers.length > 0) {
      this.activeWindowService.on('window-changed', this.onWindowChanged)
    }

    // Setup pixel color polling (1s interval)
    if (pixelTriggers.length > 0) {
      this.pixelInterval = setInterval(() => this.checkPixelTriggers(pixelTriggers), 1000)
    }
  }

  /** Stop all monitoring */
  stop(): void {
    this.running = false

    // Unregister hotkey triggers
    for (const trigger of this.triggers) {
      if (trigger.type === 'hotkey_combo') {
        this.hotkeyManager.unregisterTriggerHotkey(trigger.id)
      }
    }

    // Clear intervals
    if (this.scheduleInterval) {
      clearInterval(this.scheduleInterval)
      this.scheduleInterval = null
    }
    if (this.pixelInterval) {
      clearInterval(this.pixelInterval)
      this.pixelInterval = null
    }

    // Unsubscribe from window changes
    this.activeWindowService.removeListener('window-changed', this.onWindowChanged)

    this.scheduleEntries = []
    this.windowTriggers = []
  }

  private fireTrigger(trigger: TriggerConfig): void {
    const macroId = this.macroMap.get(trigger.id)
    if (!macroId) return
    this.emit('trigger-fired', { triggerId: trigger.id, macroId, type: trigger.type })
  }

  private checkScheduleTriggers(): void {
    const now = new Date()
    const minute = now.getMinutes()
    const hour = now.getHours()
    const dom = now.getDate()
    const month = now.getMonth() + 1
    const dow = now.getDay()

    for (const entry of this.scheduleEntries) {
      const { cronParts, lastFired, trigger } = entry
      // Only fire once per minute
      const minuteKey = Math.floor(now.getTime() / 60000)
      if (minuteKey === lastFired) continue

      if (
        cronParts.minute.includes(minute) &&
        cronParts.hour.includes(hour) &&
        cronParts.dom.includes(dom) &&
        cronParts.month.includes(month) &&
        cronParts.dow.includes(dow)
      ) {
        entry.lastFired = minuteKey
        this.fireTrigger(trigger)
      }
    }
  }

  private onWindowChanged(data: { previous: WindowInfo; current: WindowInfo }): void {
    const { current } = data
    if (!current) return

    for (const trigger of this.windowTriggers) {
      if (!trigger.windowMatch) continue
      const match = trigger.windowMatch

      let matched = false
      switch (match.matchType) {
        case 'process':
          matched = current.processName.toLowerCase() === match.matchValue.toLowerCase()
          break
        case 'title_contains':
          matched = current.title.toLowerCase().includes(match.matchValue.toLowerCase())
          break
        case 'title_regex':
          try {
            matched = new RegExp(match.matchValue, 'i').test(current.title)
          } catch {
            matched = false
          }
          break
      }

      if (matched) {
        this.fireTrigger(trigger)
      }
    }
  }

  private async checkPixelTriggers(triggers: TriggerConfig[]): Promise<void> {
    for (const trigger of triggers) {
      if (!trigger.pixelMatch) continue
      const { x, y, color, tolerance } = trigger.pixelMatch

      const matches = await this.pixelSampler.matchesColor(x, y, color, tolerance)
      if (matches) {
        this.fireTrigger(trigger)
      }
    }
  }
}

// ─── Minimal cron parser (no dependency needed for basic patterns) ────
function parseCron(expression: string): {
  minute: number[]
  hour: number[]
  dom: number[]
  month: number[]
  dow: number[]
} {
  const parts = expression.trim().split(/\s+/)
  if (parts.length < 5) {
    // Default: run every minute
    return {
      minute: range(0, 59),
      hour: range(0, 23),
      dom: range(1, 31),
      month: range(1, 12),
      dow: range(0, 6)
    }
  }

  return {
    minute: parseCronField(parts[0], 0, 59),
    hour: parseCronField(parts[1], 0, 23),
    dom: parseCronField(parts[2], 1, 31),
    month: parseCronField(parts[3], 1, 12),
    dow: parseCronField(parts[4], 0, 6)
  }
}

function parseCronField(field: string, min: number, max: number): number[] {
  if (field === '*') return range(min, max)

  const results: number[] = []

  for (const part of field.split(',')) {
    // Handle step values: */5 or 1-30/5
    const stepMatch = part.match(/^(.+)\/(\d+)$/)
    if (stepMatch) {
      const base = stepMatch[1] === '*' ? range(min, max) : parseRange(stepMatch[1], min, max)
      const step = parseInt(stepMatch[2])
      for (let i = 0; i < base.length; i += step) {
        results.push(base[i])
      }
      continue
    }

    // Handle ranges: 1-5
    if (part.includes('-')) {
      results.push(...parseRange(part, min, max))
      continue
    }

    // Single value
    const val = parseInt(part)
    if (!isNaN(val) && val >= min && val <= max) {
      results.push(val)
    }
  }

  return results.length > 0 ? results : range(min, max)
}

function parseRange(s: string, min: number, max: number): number[] {
  const [start, end] = s.split('-').map(Number)
  if (isNaN(start) || isNaN(end)) return []
  return range(Math.max(start, min), Math.min(end, max))
}

function range(start: number, end: number): number[] {
  const arr: number[] = []
  for (let i = start; i <= end; i++) arr.push(i)
  return arr
}
