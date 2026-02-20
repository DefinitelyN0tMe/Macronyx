import type { Macro, MacroEvent, PlaybackState } from '../../shared/types'
import { Humanizer } from './humanizer'
import { mapKeyCode } from './keymap'
import { getInputSimulator, destroyInputSimulator } from './input-simulator'

export class Player {
  private isPlaying = false
  private isPaused = false
  private onProgress?: (state: PlaybackState) => void
  private humanizer = new Humanizer()

  async play(macro: Macro, onProgress: (state: PlaybackState) => void): Promise<void> {
    this.isPlaying = true
    this.isPaused = false
    this.onProgress = onProgress

    const { speed, repeatCount, repeatDelay, humanize, humanizeAmount } = macro.playbackSettings
    const totalRepeats = repeatCount === 0 ? Infinity : repeatCount

    // Get the input simulator (singleton, stays alive between plays)
    const sim = getInputSimulator()

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
  }

  pause(): void {
    this.isPaused = true
  }

  resume(): void {
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
          await sim.moveMouse(x, y)
          await sim.mouseClick((event.button as 'left' | 'right' | 'middle') ?? 'left')
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
            await sim.mouseScroll(event.scrollDelta.y)
          }
          break
        }
        case 'key_down': {
          const key = mapKeyCode(event.keyCode ?? 0)
          if (key) await sim.keyDown(key)
          break
        }
        case 'key_up': {
          const key = mapKeyCode(event.keyCode ?? 0)
          if (key) await sim.keyUp(key)
          break
        }
      }
    } catch (err) {
      console.error('Event execution error:', err)
    }
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms))
  }
}
