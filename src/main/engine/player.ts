import type { Macro, MacroEvent, PlaybackState } from '../../shared/types'
import { Humanizer } from './humanizer'
import { mapKeyCode } from './keymap'

export class Player {
  private isPlaying = false
  private isPaused = false
  private onProgress?: (state: PlaybackState) => void
  private humanizer = new Humanizer()

  async play(macro: Macro, onProgress: (state: PlaybackState) => void): Promise<void> {
    // Dynamically import robotjs-style automation
    // We use built-in approach with child_process for cross-platform support
    this.isPlaying = true
    this.isPaused = false
    this.onProgress = onProgress

    const { speed, repeatCount, repeatDelay, humanize, humanizeAmount } = macro.playbackSettings
    const totalRepeats = repeatCount === 0 ? Infinity : repeatCount

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
            await this.sleep(delay)
          }
          if (!this.isPlaying) break

          await this.executeEvent(event, humanize, humanizeAmount)

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

  private async executeEvent(
    event: MacroEvent,
    humanize: boolean,
    amount: number
  ): Promise<void> {
    try {
      // Use native addon for input simulation
      // We use a platform-agnostic approach via powershell/xdotool/osascript
      switch (event.type) {
        case 'mouse_move': {
          let x = event.x ?? 0
          let y = event.y ?? 0
          if (humanize) {
            const offset = this.humanizer.randomizePosition(amount)
            x += offset.x
            y += offset.y
          }
          await this.moveMouse(x, y)
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
          await this.moveMouse(x, y)
          await this.mouseClick(event.button ?? 'left')
          break
        }
        case 'mouse_up': {
          // Mouse button release — currently handled as part of click
          break
        }
        case 'mouse_scroll': {
          if (event.scrollDelta) {
            await this.mouseScroll(event.scrollDelta.y)
          }
          break
        }
        case 'key_down': {
          const key = mapKeyCode(event.keyCode ?? 0)
          if (key) await this.keyDown(key)
          break
        }
        case 'key_up': {
          const key = mapKeyCode(event.keyCode ?? 0)
          if (key) await this.keyUp(key)
          break
        }
      }
    } catch (err) {
      console.error('Event execution error:', err)
    }
  }

  private async moveMouse(x: number, y: number): Promise<void> {
    if (process.platform === 'win32') {
      const { exec } = await import('child_process')
      return new Promise((resolve) => {
        exec(
          `powershell -Command "[System.Windows.Forms.Cursor]::Position = New-Object System.Drawing.Point(${Math.round(x)}, ${Math.round(y)})"`,
          () => resolve()
        )
      })
    }
    // Linux/macOS: use xdotool or osascript
    if (process.platform === 'linux') {
      const { exec } = await import('child_process')
      return new Promise((resolve) => {
        exec(`xdotool mousemove ${Math.round(x)} ${Math.round(y)}`, () => resolve())
      })
    }
    if (process.platform === 'darwin') {
      const { exec } = await import('child_process')
      return new Promise((resolve) => {
        exec(
          `osascript -e 'tell application "System Events" to set position of mouse to {${Math.round(x)}, ${Math.round(y)}}'`,
          () => resolve()
        )
      })
    }
  }

  private async mouseClick(button: string): Promise<void> {
    if (process.platform === 'win32') {
      const { exec } = await import('child_process')
      const btn = button === 'right' ? 2 : button === 'middle' ? 4 : 1
      return new Promise((resolve) => {
        exec(
          `powershell -Command "Add-Type -TypeDefinition 'using System;using System.Runtime.InteropServices;public class M{[DllImport(\\"user32.dll\\")]public static extern void mouse_event(int f,int x,int y,int d,int e);}'; [M]::mouse_event(${btn === 1 ? '2' : btn === 2 ? '8' : '32'},0,0,0,0); Start-Sleep -Milliseconds 30; [M]::mouse_event(${btn === 1 ? '4' : btn === 2 ? '16' : '64'},0,0,0,0)"`,
          () => resolve()
        )
      })
    }
    if (process.platform === 'linux') {
      const { exec } = await import('child_process')
      const btn = button === 'right' ? '3' : button === 'middle' ? '2' : '1'
      return new Promise((resolve) => {
        exec(`xdotool click ${btn}`, () => resolve())
      })
    }
    if (process.platform === 'darwin') {
      const { exec } = await import('child_process')
      return new Promise((resolve) => {
        exec(`osascript -e 'tell application "System Events" to click'`, () => resolve())
      })
    }
  }

  private async mouseScroll(deltaY: number): Promise<void> {
    if (process.platform === 'win32') {
      const { exec } = await import('child_process')
      const amount = Math.round(deltaY * 120)
      return new Promise((resolve) => {
        exec(
          `powershell -Command "Add-Type -TypeDefinition 'using System;using System.Runtime.InteropServices;public class M{[DllImport(\\"user32.dll\\")]public static extern void mouse_event(int f,int x,int y,int d,int e);}'; [M]::mouse_event(0x0800,0,0,${amount},0)"`,
          () => resolve()
        )
      })
    }
    if (process.platform === 'linux') {
      const { exec } = await import('child_process')
      const btn = deltaY > 0 ? '5' : '4'
      const count = Math.abs(Math.round(deltaY))
      return new Promise((resolve) => {
        exec(`xdotool click --repeat ${count} ${btn}`, () => resolve())
      })
    }
  }

  private async keyDown(key: string): Promise<void> {
    if (process.platform === 'win32') {
      const { exec } = await import('child_process')
      return new Promise((resolve) => {
        exec(
          `powershell -Command "Add-Type -AssemblyName System.Windows.Forms; [System.Windows.Forms.SendKeys]::SendWait('${this.escapeKey(key)}')"`,
          () => resolve()
        )
      })
    }
    if (process.platform === 'linux') {
      const { exec } = await import('child_process')
      return new Promise((resolve) => {
        exec(`xdotool keydown ${key}`, () => resolve())
      })
    }
  }

  private async keyUp(key: string): Promise<void> {
    if (process.platform === 'linux') {
      const { exec } = await import('child_process')
      return new Promise((resolve) => {
        exec(`xdotool keyup ${key}`, () => resolve())
      })
    }
    // Windows SendKeys handles press+release, macOS handled via osascript
  }

  private escapeKey(key: string): string {
    // Escape special characters for SendKeys
    const specials: Record<string, string> = {
      '+': '{+}',
      '^': '{^}',
      '%': '{%}',
      '~': '{~}',
      '(': '{(}',
      ')': '{)}',
      '{': '{{}',
      '}': '{}}',
      '[': '{[}',
      ']': '{]}'
    }
    return specials[key] ?? key
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms))
  }
}
