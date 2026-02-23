import type {
  Macro, MacroEvent, PlaybackState, ConditionConfig,
  EventResult, EventResultStatus, PlaybackReport, MouseCurveSettings
} from '../../shared/types'
import { DEFAULT_MOUSE_CURVE } from '../../shared/constants'
import { Humanizer } from './humanizer'
import { MouseCurveGenerator } from './mouse-curve'
import { mapKeyCode } from './keymap'
import { getInputSimulator, destroyInputSimulator } from './input-simulator'
import { getActiveWindowService } from './active-window'
import { getPixelSampler } from './pixel-sampler'

export class Player {
  private isPlaying = false
  private isPaused = false
  private onProgress?: (state: PlaybackState) => void
  private humanizer = new Humanizer()
  private heldKeys = new Set<string>()
  private activeSim: ReturnType<typeof getInputSimulator> | null = null

  // Live playback settings — can be updated mid-play (e.g. profile auto-switch)
  private liveSpeed = 1
  private liveHumanize = false
  private liveHumanizeAmount = 10
  private liveMouseCurve: MouseCurveSettings = { ...DEFAULT_MOUSE_CURVE }

  // Track last mouse position for curve generation
  private lastMousePos: { x: number; y: number } | null = null

  // Relative positioning cache — avoids querying PowerShell for every single event.
  // Populated once before playback starts, refreshed every 500ms during playback.
  // Includes width/height for proportional scaling (v1.4).
  private windowBoundsCache = new Map<string, {
    x: number; y: number; width: number; height: number; updatedAt: number
  }>()
  private static readonly WINDOW_CACHE_TTL = 500 // ms

  // Event result tracking (v1.4)
  private eventResults: EventResult[] = []
  private onEventResult?: (result: EventResult) => void

  /** Check if player is currently playing */
  getIsPlaying(): boolean {
    return this.isPlaying
  }

  /** Update playback settings mid-play (for profile auto-switch) */
  updatePlaybackSettings(settings: {
    speed?: number
    humanize?: boolean
    humanizeAmount?: number
  }): void {
    if (settings.speed !== undefined) this.liveSpeed = settings.speed
    if (settings.humanize !== undefined) this.liveHumanize = settings.humanize
    if (settings.humanizeAmount !== undefined) this.liveHumanizeAmount = settings.humanizeAmount
  }

  async play(
    macro: Macro,
    onProgress: (state: PlaybackState) => void,
    onEventResult?: (result: EventResult) => void,
    onPlaybackReport?: (report: PlaybackReport) => void
  ): Promise<void> {
    // Guard against concurrent plays
    if (this.isPlaying) {
      this.stop()
      await new Promise((r) => setTimeout(r, 50))
    }
    this.isPlaying = true
    this.isPaused = false
    this.onProgress = onProgress
    this.onEventResult = onEventResult

    const { repeatCount, repeatDelay } = macro.playbackSettings
    const totalRepeats = repeatCount === 0 ? Infinity : repeatCount

    // Initialize live settings from macro (can be updated mid-play via updatePlaybackSettings)
    this.liveSpeed = macro.playbackSettings.speed
    this.liveHumanize = macro.playbackSettings.humanize
    this.liveHumanizeAmount = macro.playbackSettings.humanizeAmount
    this.liveMouseCurve = macro.playbackSettings.mouseCurve ?? { ...DEFAULT_MOUSE_CURVE }

    // Get the input simulator (singleton, stays alive between plays)
    const sim = getInputSimulator()
    this.activeSim = sim
    this.heldKeys.clear()
    this.windowBoundsCache.clear()
    this.eventResults = []
    this.lastMousePos = null

    const playbackStartedAt = Date.now()

    // Pre-populate window bounds cache so the first events resolve instantly
    await this.warmWindowCache(macro.events)

    try {
      for (let repeat = 0; repeat < totalRepeats; repeat++) {
        if (!this.isPlaying) break

        // Condition evaluation state: stack for nested conditionals.
        const condStack: {
          pairId: string
          branchSkipping: boolean
          outerSkipped: boolean
        }[] = []

        const shouldSkip = (): boolean => {
          for (const entry of condStack) {
            if (entry.outerSkipped || entry.branchSkipping) return true
          }
          return false
        }

        for (let i = 0; i < macro.events.length; i++) {
          if (!this.isPlaying) break

          while (this.isPaused && this.isPlaying) {
            await this.sleep(100)
          }
          if (!this.isPlaying) break

          const event = macro.events[i]

          // ─── Conditional logic evaluation ────────────────────────
          if (event.type === 'condition_start') {
            const pairId = event.conditionPairId || ''
            if (shouldSkip()) {
              condStack.push({ pairId, branchSkipping: true, outerSkipped: true })
            } else {
              const result = await this.evaluateCondition(event.condition)
              condStack.push({ pairId, branchSkipping: !result, outerSkipped: false })
            }
            this.recordResult(i, 'success')
            continue
          }

          if (event.type === 'condition_else') {
            const top = condStack[condStack.length - 1]
            if (top && top.pairId === event.conditionPairId) {
              if (!top.outerSkipped) {
                top.branchSkipping = !top.branchSkipping
              }
            }
            this.recordResult(i, 'success')
            continue
          }

          if (event.type === 'condition_end') {
            const top = condStack[condStack.length - 1]
            if (top && top.pairId === event.conditionPairId) {
              condStack.pop()
            }
            this.recordResult(i, 'success')
            continue
          }

          // Skip events if inside a false conditional branch
          if (shouldSkip()) {
            this.recordResult(i, 'skipped')
            continue
          }

          // ─── Normal event execution ──────────────────────────────
          let delay = event.delay / this.liveSpeed

          if (this.liveHumanize) {
            delay = this.humanizer.randomizeDelay(delay, this.liveHumanizeAmount)
          }

          if (delay > 0) {
            if (delay < 5) {
              const start = performance.now()
              while (performance.now() - start < delay) {
                // Busy wait for sub-5ms precision
              }
            } else if (delay > 100) {
              const deadline = Date.now() + delay
              while (Date.now() < deadline && this.isPlaying && !this.isPaused) {
                await this.sleep(Math.min(50, deadline - Date.now()))
              }
            } else {
              await this.sleep(delay)
            }
          }
          if (!this.isPlaying) break

          const eventStatus = await this.executeEvent(
            sim, event, this.liveHumanize, this.liveHumanizeAmount
          )
          this.recordResult(i, eventStatus)

          onProgress({
            macroId: macro.id,
            status: 'playing',
            currentEventIndex: i,
            currentRepeat: repeat + 1,
            totalRepeats: repeatCount,
            elapsedMs: event.timestamp / this.liveSpeed
          })
        }

        if (repeat < totalRepeats - 1 && repeatDelay > 0) {
          await this.sleep(repeatDelay / this.liveSpeed)
        }
      }
    } catch (err) {
      console.error('Playback error:', err)
    }

    this.isPlaying = false
    this.releaseAllHeldKeys()
    this.heldKeys.clear()
    this.activeSim = null
    this.lastMousePos = null

    // Build and emit playback report
    if (onPlaybackReport) {
      const report: PlaybackReport = {
        macroId: macro.id,
        startedAt: playbackStartedAt,
        finishedAt: Date.now(),
        totalEvents: macro.events.length,
        successCount: this.eventResults.filter((r) => r.status === 'success').length,
        failedCount: this.eventResults.filter((r) => r.status === 'failed').length,
        skippedCount: this.eventResults.filter((r) => r.status === 'skipped').length,
        results: [...this.eventResults]
      }
      onPlaybackReport(report)
    }

    onProgress({
      macroId: macro.id,
      status: 'idle',
      currentEventIndex: 0,
      currentRepeat: 0,
      totalRepeats: repeatCount,
      elapsedMs: 0
    })
  }

  stop(): void {
    this.isPlaying = false
    this.isPaused = false
    this.windowBoundsCache.clear()
    this.releaseAllHeldKeys()
  }

  pause(): void {
    this.isPaused = true
    this.releaseAllHeldKeys()
  }

  resume(): void {
    this.restoreHeldKeys()
    this.isPaused = false
  }

  /** Clean up native resources */
  destroy(): void {
    this.stop()
    destroyInputSimulator()
  }

  /** Record an event result and emit it */
  private recordResult(eventIndex: number, status: EventResultStatus, error?: string): void {
    const result: EventResult = { eventIndex, status, error, timestamp: Date.now() }
    this.eventResults.push(result)
    this.onEventResult?.(result)
  }

  /** Pre-populate the window bounds cache for all process names referenced in the macro. */
  private async warmWindowCache(events: MacroEvent[]): Promise<void> {
    const processNames = new Set<string>()
    for (const e of events) {
      if (e.relativeToWindow) processNames.add(e.relativeToWindow.processName.toLowerCase())
    }
    if (processNames.size === 0) return

    const awService = getActiveWindowService()
    for (const name of processNames) {
      try {
        const info = await awService.getWindowByProcessName(name)
        if (info?.bounds) {
          this.windowBoundsCache.set(name, {
            x: info.bounds.x,
            y: info.bounds.y,
            width: info.bounds.width,
            height: info.bounds.height,
            updatedAt: Date.now()
          })
        }
      } catch {
        // Best effort
      }
    }
  }

  /** Refresh cached bounds for a process name if the cache entry is stale (>500ms). */
  private async refreshWindowBounds(processName: string): Promise<void> {
    const key = processName.toLowerCase()
    const cached = this.windowBoundsCache.get(key)
    if (cached && Date.now() - cached.updatedAt < Player.WINDOW_CACHE_TTL) return

    try {
      const awService = getActiveWindowService()
      const info = await awService.getWindowByProcessName(key)
      if (info?.bounds) {
        this.windowBoundsCache.set(key, {
          x: info.bounds.x,
          y: info.bounds.y,
          width: info.bounds.width,
          height: info.bounds.height,
          updatedAt: Date.now()
        })
      }
    } catch {
      // Keep stale cache rather than clearing
    }
  }

  /** Resolve relative positioning with proportional scaling (v1.4).
   *  If the window changed size since recording, coordinates are scaled proportionally. */
  private async resolvePosition(
    event: MacroEvent
  ): Promise<{ x: number; y: number }> {
    let x = event.x ?? 0
    let y = event.y ?? 0

    if (event.relativeToWindow) {
      const key = event.relativeToWindow.processName.toLowerCase()

      await this.refreshWindowBounds(event.relativeToWindow.processName)

      const cached = this.windowBoundsCache.get(key)
      if (cached) {
        let offsetX = event.relativeToWindow.offsetX
        let offsetY = event.relativeToWindow.offsetY

        // Smart scaling: if recording stored window dimensions, scale proportionally
        const recW = event.relativeToWindow.windowWidth
        const recH = event.relativeToWindow.windowHeight
        if (recW && recH && recW > 0 && recH > 0 && cached.width > 0 && cached.height > 0) {
          const scaleX = cached.width / recW
          const scaleY = cached.height / recH
          offsetX = Math.round(offsetX * scaleX)
          offsetY = Math.round(offsetY * scaleY)
        }

        x = cached.x + offsetX
        y = cached.y + offsetY
      } else {
        console.warn(
          `Relative positioning: window "${event.relativeToWindow.processName}" not found. Using absolute coords.`
        )
      }
    }

    return { x, y }
  }

  /** Execute a mouse movement along a bezier curve (v1.4). */
  private async executeCurveMovement(
    sim: ReturnType<typeof getInputSimulator>,
    targetX: number,
    targetY: number
  ): Promise<void> {
    if (!this.lastMousePos || !this.liveMouseCurve.enabled) {
      // No previous position or curves disabled — direct move
      await sim.moveMouse(targetX, targetY)
      this.lastMousePos = { x: targetX, y: targetY }
      return
    }

    const start = this.lastMousePos
    const dist = Math.sqrt(
      Math.pow(targetX - start.x, 2) + Math.pow(targetY - start.y, 2)
    )

    // Skip curves for very short movements (<10px)
    if (dist < 10) {
      await sim.moveMouse(targetX, targetY)
      this.lastMousePos = { x: targetX, y: targetY }
      return
    }

    const points = MouseCurveGenerator.generateCurve(
      start,
      { x: targetX, y: targetY },
      this.liveMouseCurve
    )

    // Distribute movement time based on distance
    const totalTimeMs = Math.min(dist / 3, 60) / this.liveSpeed
    const stepDelay = points.length > 1 ? totalTimeMs / (points.length - 1) : 0

    for (let p = 0; p < points.length; p++) {
      if (!this.isPlaying) break
      await sim.moveMouse(Math.round(points[p].x), Math.round(points[p].y))
      if (stepDelay > 1 && p < points.length - 1) {
        await this.sleep(stepDelay)
      }
    }

    this.lastMousePos = { x: targetX, y: targetY }
  }

  private async executeEvent(
    sim: ReturnType<typeof getInputSimulator>,
    event: MacroEvent,
    humanize: boolean,
    amount: number
  ): Promise<EventResultStatus> {
    try {
      switch (event.type) {
        case 'mouse_move': {
          let { x, y } = await this.resolvePosition(event)
          if (humanize) {
            const offset = this.humanizer.randomizePosition(amount)
            x += offset.x
            y += offset.y
          }
          await this.executeCurveMovement(sim, x, y)
          break
        }
        case 'mouse_click': {
          let { x, y } = await this.resolvePosition(event)
          if (humanize) {
            const offset = this.humanizer.randomizePosition(amount)
            x += offset.x
            y += offset.y
          }
          // If curves are enabled, move along curve first, then click
          if (this.liveMouseCurve.enabled && this.lastMousePos) {
            await this.executeCurveMovement(sim, x, y)
            // Click at final position (already there from curve)
            await sim.moveAndClick(x, y, (event.button as 'left' | 'right' | 'middle') ?? 'left')
          } else {
            await sim.moveAndClick(x, y, (event.button as 'left' | 'right' | 'middle') ?? 'left')
            this.lastMousePos = { x, y }
          }
          break
        }
        case 'mouse_up': {
          if (event.button) {
            await sim.mouseUp(event.button as 'left' | 'right' | 'middle')
          }
          break
        }
        case 'mouse_scroll': {
          if (event.scrollDelta) {
            if (event.x !== undefined && event.y !== undefined) {
              const { x, y } = await this.resolvePosition(event)
              await sim.moveMouse(x, y)
              this.lastMousePos = { x, y }
            }
            await sim.mouseScroll(event.scrollDelta.y)
          }
          break
        }
        case 'key_down': {
          const key = mapKeyCode(event.keyCode ?? 0)
          if (key) {
            this.heldKeys.add(key)
            await sim.keyDown(key)
          }
          break
        }
        case 'key_up': {
          const key = mapKeyCode(event.keyCode ?? 0)
          if (key) {
            this.heldKeys.delete(key)
            await sim.keyUp(key)
          }
          break
        }
        // Condition events are handled in play() loop — not here
        case 'condition_start':
        case 'condition_else':
        case 'condition_end':
          break
      }
      return 'success'
    } catch (err) {
      console.error('Event execution error:', err)
      return 'failed'
    }
  }

  /** Evaluate a condition — returns true if condition is met */
  private async evaluateCondition(condition?: ConditionConfig): Promise<boolean> {
    if (!condition) return true

    try {
      switch (condition.type) {
        case 'pixel_color': {
          if (condition.x === undefined || condition.y === undefined || !condition.color) {
            return false
          }
          const sampler = getPixelSampler()
          return sampler.matchesColor(
            condition.x,
            condition.y,
            condition.color,
            condition.tolerance ?? 30
          )
        }
        case 'window_title': {
          if (!condition.matchValue) return false
          const awService = getActiveWindowService()
          const current = awService.getCurrent()
          if (!current) return false
          const title = current.title
          switch (condition.matchType) {
            case 'equals':
              return title === condition.matchValue
            case 'regex':
              return new RegExp(condition.matchValue).test(title)
            case 'contains':
            default:
              return title.toLowerCase().includes(condition.matchValue.toLowerCase())
          }
        }
        case 'time_of_day': {
          const now = new Date()
          const currentMinutes = now.getHours() * 60 + now.getMinutes()
          if (condition.afterTime) {
            const [h, m] = condition.afterTime.split(':').map(Number)
            if (currentMinutes < h * 60 + m) return false
          }
          if (condition.beforeTime) {
            const [h, m] = condition.beforeTime.split(':').map(Number)
            if (currentMinutes > h * 60 + m) return false
          }
          return true
        }
        default:
          return true
      }
    } catch (err) {
      console.error('Condition evaluation error:', err)
      return false
    }
  }

  /** Release all currently held keys to prevent stuck modifiers during pause/stop */
  private releaseAllHeldKeys(): void {
    if (!this.activeSim || this.heldKeys.size === 0) return
    for (const key of this.heldKeys) {
      try {
        this.activeSim.keyUp(key)
      } catch {
        // Best effort
      }
    }
  }

  /** Re-press all keys that were held before pause */
  private restoreHeldKeys(): void {
    if (!this.activeSim || this.heldKeys.size === 0) return
    for (const key of this.heldKeys) {
      try {
        this.activeSim.keyDown(key)
      } catch {
        // Best effort
      }
    }
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms))
  }
}
