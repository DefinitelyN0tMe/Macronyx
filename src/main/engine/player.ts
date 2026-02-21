import type { Macro, MacroEvent, PlaybackState } from '../../shared/types'
import { Humanizer } from './humanizer'
import { mapKeyCode } from './keymap'
import { getInputSimulator, destroyInputSimulator } from './input-simulator'

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

        for (let i = 0; i < macro.events.length; i++) {
          if (!this.isPlaying) break

          while (this.isPaused && this.isPlaying) {
            await this.sleep(100)
          }
          if (!this.isPlaying) break

          const event = macro.events[i]
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

  private async executeEvent(
    sim: ReturnType<typeof getInputSimulator>,
    event: MacroEvent,
    humanize: boolean,
    amount: number
  ): Promise<void> {
    try {
      switch (event.type) {
        case 'mouse_move': {
          let x = event.x ?? 0
          let y = event.y ?? 0
          if (humanize) {
            const offset = this.humanizer.randomizePosition(amount)
            x += offset.x
            y += offset.y
          }
          await sim.moveMouse(x, y)
          break
        }
        case 'mouse_click': {
          let x = event.x ?? 0
          let y = event.y ?? 0
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
              await sim.moveMouse(event.x, event.y)
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
      }
    } catch (err) {
      console.error('Event execution error:', err)
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
