import type { Macro, MacroEvent, PlaybackState, ConditionConfig } from '../../shared/types'
import { Humanizer } from './humanizer'
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

  async play(macro: Macro, onProgress: (state: PlaybackState) => void): Promise<void> {
    // Guard against concurrent plays
    if (this.isPlaying) {
      this.stop()
      await new Promise((r) => setTimeout(r, 50))
    }
    this.isPlaying = true
    this.isPaused = false
    this.onProgress = onProgress

    const { speed, repeatCount, repeatDelay, humanize, humanizeAmount } = macro.playbackSettings
    const totalRepeats = repeatCount === 0 ? Infinity : repeatCount

    // Get the input simulator (singleton, stays alive between plays)
    const sim = getInputSimulator()
    this.activeSim = sim
    this.heldKeys.clear()

    try {
      for (let repeat = 0; repeat < totalRepeats; repeat++) {
        if (!this.isPlaying) break

        // Condition evaluation state: stack for nested conditionals
        const skipStack: { skipUntil: 'condition_else' | 'condition_end'; pairId: string }[] = []
        let skipping = false

        for (let i = 0; i < macro.events.length; i++) {
          if (!this.isPlaying) break

          while (this.isPaused && this.isPlaying) {
            await this.sleep(100)
          }
          if (!this.isPlaying) break

          const event = macro.events[i]

          // ─── Conditional logic evaluation ────────────────────────
          if (event.type === 'condition_start') {
            const result = await this.evaluateCondition(event.condition)
            if (result) {
              // Condition true: execute true branch, will skip at condition_else
              skipStack.push({ skipUntil: 'condition_else', pairId: event.conditionPairId || '' })
              skipping = false
            } else {
              // Condition false: skip to condition_else
              skipStack.push({ skipUntil: 'condition_else', pairId: event.conditionPairId || '' })
              skipping = true
            }
            continue
          }

          if (event.type === 'condition_else') {
            const top = skipStack[skipStack.length - 1]
            if (top && top.pairId === event.conditionPairId) {
              if (skipping) {
                // Was skipping (false branch) → now execute else branch
                skipping = false
                top.skipUntil = 'condition_end'
              } else {
                // Was executing (true branch) → now skip else branch
                skipping = true
                top.skipUntil = 'condition_end'
              }
            }
            continue
          }

          if (event.type === 'condition_end') {
            const top = skipStack[skipStack.length - 1]
            if (top && top.pairId === event.conditionPairId) {
              skipStack.pop()
              // Restore skipping state from outer scope
              skipping = skipStack.length > 0 &&
                skipStack[skipStack.length - 1].skipUntil === 'condition_end'
            }
            continue
          }

          // Skip events if inside a false conditional branch
          if (skipping) continue

          // ─── Normal event execution ──────────────────────────────
          let delay = event.delay / speed

          if (humanize) {
            delay = this.humanizer.randomizeDelay(delay, humanizeAmount)
          }

          if (delay > 0) {
            // For very small delays, use a tighter loop for accuracy
            if (delay < 5) {
              const start = performance.now()
              while (performance.now() - start < delay) {
                // Busy wait for sub-5ms precision
              }
            } else if (delay > 100) {
              // For long delays, sleep in chunks so pause/stop is responsive
              const deadline = Date.now() + delay
              while (Date.now() < deadline && this.isPlaying && !this.isPaused) {
                await this.sleep(Math.min(50, deadline - Date.now()))
              }
            } else {
              await this.sleep(delay)
            }
          }
          if (!this.isPlaying) break

          await this.executeEvent(sim, event, humanize, humanizeAmount)

          onProgress({
            macroId: macro.id,
            status: 'playing',
            currentEventIndex: i,
            currentRepeat: repeat + 1,
            totalRepeats: repeatCount,
            elapsedMs: event.timestamp / speed
          })
        }

        if (repeat < totalRepeats - 1 && repeatDelay > 0) {
          await this.sleep(repeatDelay / speed)
        }
      }
    } catch (err) {
      console.error('Playback error:', err)
    }

    this.isPlaying = false
    // Release any remaining held keys at end of playback
    this.releaseAllHeldKeys()
    this.heldKeys.clear()
    this.activeSim = null
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
    // Release any keys still held to prevent stuck keys
    this.releaseAllHeldKeys()
  }

  pause(): void {
    this.isPaused = true
    // Release all currently held keys to prevent stuck modifiers
    this.releaseAllHeldKeys()
  }

  resume(): void {
    // Restore all keys that were held before pause
    this.restoreHeldKeys()
    this.isPaused = false
  }

  /** Clean up native resources */
  destroy(): void {
    this.stop()
    destroyInputSimulator()
  }

  /** Resolve relative positioning — compute absolute coords from window-relative offsets */
  private async resolvePosition(
    event: MacroEvent
  ): Promise<{ x: number; y: number }> {
    let x = event.x ?? 0
    let y = event.y ?? 0

    if (event.relativeToWindow) {
      try {
        const awService = getActiveWindowService()
        const current = awService.getCurrent()
        if (current && current.bounds) {
          // Try to match by process name first
          if (current.processName === event.relativeToWindow.processName) {
            x = current.bounds.x + event.relativeToWindow.offsetX
            y = current.bounds.y + event.relativeToWindow.offsetY
          } else {
            // Fallback: use absolute coords
            console.warn(
              `Relative positioning: expected ${event.relativeToWindow.processName}, got ${current.processName}. Using absolute coords.`
            )
          }
        }
      } catch {
        // Fallback to absolute coords
      }
    }

    return { x, y }
  }

  private async executeEvent(
    sim: ReturnType<typeof getInputSimulator>,
    event: MacroEvent,
    humanize: boolean,
    amount: number
  ): Promise<void> {
    try {
      switch (event.type) {
        case 'mouse_move': {
          let { x, y } = await this.resolvePosition(event)
          if (humanize) {
            const offset = this.humanizer.randomizePosition(amount)
            x += offset.x
            y += offset.y
          }
          await sim.moveMouse(x, y)
          break
        }
        case 'mouse_click': {
          let { x, y } = await this.resolvePosition(event)
          if (humanize) {
            const offset = this.humanizer.randomizePosition(amount)
            x += offset.x
            y += offset.y
          }
          // Atomic move+click — guarantees click at the correct position
          await sim.moveAndClick(x, y, (event.button as 'left' | 'right' | 'middle') ?? 'left')
          break
        }
        case 'mouse_up': {
          // Mouse button release
          if (event.button) {
            await sim.mouseUp(event.button as 'left' | 'right' | 'middle')
          }
          break
        }
        case 'mouse_scroll': {
          if (event.scrollDelta) {
            // Move mouse to scroll position first
            if (event.x !== undefined && event.y !== undefined) {
              const { x, y } = await this.resolvePosition(event)
              await sim.moveMouse(x, y)
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
    } catch (err) {
      console.error('Event execution error:', err)
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
    // Don't clear heldKeys — we need them for restore on resume
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
