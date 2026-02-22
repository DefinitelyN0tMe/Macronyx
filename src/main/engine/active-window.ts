// Active Window Service — polls the foreground window at configurable intervals
// Cross-platform: Windows (dedicated query process), Linux (xdotool), macOS (osascript)
// IMPORTANT: On Windows this uses a SEPARATE PowerShell process (query-process.ts)
// to avoid stdin/stdout interference with the input simulator used by the Player.

import { EventEmitter } from 'events'
import { execSync } from 'child_process'
import type { WindowInfo } from '../../shared/types'
import { getQueryProcess } from './query-process'

export class ActiveWindowService extends EventEmitter {
  private interval: ReturnType<typeof setInterval> | null = null
  private current: WindowInfo | null = null
  private pollMs = 500

  /** Start polling the active window */
  start(pollMs = 500): void {
    this.pollMs = pollMs
    if (this.interval) return
    this.poll() // Initial poll
    this.interval = setInterval(() => this.poll(), this.pollMs)
  }

  /** Stop polling */
  stop(): void {
    if (this.interval) {
      clearInterval(this.interval)
      this.interval = null
    }
  }

  /** Get the current (cached) active window info */
  getCurrent(): WindowInfo | null {
    return this.current
  }

  /** Force a single poll and return the result */
  async pollOnce(): Promise<WindowInfo | null> {
    return this.poll()
  }

  /** Find a window by process name (case-insensitive), even when it's NOT the foreground window.
   *  Uses Process.GetProcessesByName on Windows, xdotool on Linux, osascript on macOS.
   *  This is the key API for relative positioning: it finds the target window
   *  regardless of which window is currently focused. */
  async getWindowByProcessName(processName: string): Promise<WindowInfo | null> {
    switch (process.platform) {
      case 'win32':
        return this.findWindowByProcessWindows(processName)
      case 'linux':
        return this.findWindowByProcessLinux(processName)
      case 'darwin':
        return this.findWindowByProcessMacOS(processName)
      default:
        return null
    }
  }

  private async poll(): Promise<WindowInfo | null> {
    try {
      const info = await this.getActiveWindow()
      if (!info) return null

      const previous = this.current
      const changed =
        !previous ||
        previous.title !== info.title ||
        previous.processName !== info.processName

      this.current = info

      if (changed && previous) {
        this.emit('window-changed', { previous, current: info })
      }

      return info
    } catch {
      return null
    }
  }

  private async getActiveWindow(): Promise<WindowInfo | null> {
    switch (process.platform) {
      case 'win32':
        return this.getActiveWindowWindows()
      case 'linux':
        return this.getActiveWindowLinux()
      case 'darwin':
        return this.getActiveWindowMacOS()
      default:
        return null
    }
  }

  private async getActiveWindowWindows(): Promise<WindowInfo | null> {
    try {
      return await getQueryProcess().getActiveWindow()
    } catch {
      return null
    }
  }

  private async getActiveWindowLinux(): Promise<WindowInfo | null> {
    try {
      const winId = execSync('xdotool getactivewindow', { timeout: 1000 }).toString().trim()
      if (!winId) return null

      const title = execSync(`xdotool getactivewindow getwindowname`, { timeout: 1000 })
        .toString()
        .trim()

      let processName = ''
      try {
        const pid = execSync(`xdotool getactivewindow getwindowpid`, { timeout: 1000 })
          .toString()
          .trim()
        if (pid) {
          processName = execSync(`cat /proc/${pid}/comm`, { timeout: 1000 }).toString().trim()
        }
      } catch {
        // PID unavailable
      }

      let bounds: WindowInfo['bounds'] | undefined
      try {
        const geo = execSync(`xdotool getactivewindow getwindowgeometry --shell`, { timeout: 1000 })
          .toString()
          .trim()
        const xMatch = geo.match(/X=(\d+)/)
        const yMatch = geo.match(/Y=(\d+)/)
        const wMatch = geo.match(/WIDTH=(\d+)/)
        const hMatch = geo.match(/HEIGHT=(\d+)/)
        if (xMatch && yMatch && wMatch && hMatch) {
          bounds = {
            x: parseInt(xMatch[1]),
            y: parseInt(yMatch[1]),
            width: parseInt(wMatch[1]),
            height: parseInt(hMatch[1])
          }
        }
      } catch {
        // Geometry unavailable
      }

      return { title, processName, bounds }
    } catch {
      return null
    }
  }

  private async getActiveWindowMacOS(): Promise<WindowInfo | null> {
    try {
      const script = `
        tell application "System Events"
          set frontApp to first process whose frontmost is true
          set appName to name of frontApp
          set bundleId to bundle identifier of frontApp
          return appName & "|" & bundleId
        end tell
      `
      const result = execSync(`osascript -e '${script}'`, { timeout: 2000 }).toString().trim()
      const [title, processName] = result.split('|')

      // Get window bounds
      let bounds: WindowInfo['bounds'] | undefined
      try {
        const boundsScript = `
          tell application "System Events"
            set frontApp to first process whose frontmost is true
            set frontWindow to first window of frontApp
            set {x, y} to position of frontWindow
            set {w, h} to size of frontWindow
            return (x as string) & "," & (y as string) & "," & (w as string) & "," & (h as string)
          end tell
        `
        const boundsResult = execSync(`osascript -e '${boundsScript}'`, { timeout: 2000 })
          .toString()
          .trim()
        const parts = boundsResult.split(',').map(Number)
        if (parts.length === 4) {
          bounds = { x: parts[0], y: parts[1], width: parts[2], height: parts[3] }
        }
      } catch {
        // Window bounds unavailable
      }

      return { title: title || '', processName: processName || '', bounds }
    } catch {
      return null
    }
  }

  // ─── Find window by process name (not just foreground) ───────────

  private async findWindowByProcessWindows(processName: string): Promise<WindowInfo | null> {
    try {
      return await getQueryProcess().getWindowByProcessName(processName)
    } catch {
      return null
    }
  }

  private findWindowByProcessLinux(processName: string): WindowInfo | null {
    try {
      // xdotool search returns window IDs for all windows matching a process name
      const target = processName.toLowerCase()
      const winIds = execSync(`xdotool search --name ""`, { timeout: 2000 })
        .toString()
        .trim()
        .split('\n')
        .filter(Boolean)

      for (const winId of winIds) {
        try {
          const pid = execSync(`xdotool getwindowpid ${winId}`, { timeout: 1000 })
            .toString()
            .trim()
          if (!pid) continue
          const proc = execSync(`cat /proc/${pid}/comm`, { timeout: 1000 })
            .toString()
            .trim()
          if (proc.toLowerCase() !== target) continue

          const title = execSync(`xdotool getwindowname ${winId}`, { timeout: 1000 })
            .toString()
            .trim()
          if (!title) continue

          let bounds: WindowInfo['bounds'] | undefined
          try {
            const geo = execSync(`xdotool getwindowgeometry --shell ${winId}`, { timeout: 1000 })
              .toString()
              .trim()
            const xMatch = geo.match(/X=(\d+)/)
            const yMatch = geo.match(/Y=(\d+)/)
            const wMatch = geo.match(/WIDTH=(\d+)/)
            const hMatch = geo.match(/HEIGHT=(\d+)/)
            if (xMatch && yMatch && wMatch && hMatch) {
              bounds = {
                x: parseInt(xMatch[1]),
                y: parseInt(yMatch[1]),
                width: parseInt(wMatch[1]),
                height: parseInt(hMatch[1])
              }
            }
          } catch {
            // Geometry unavailable
          }

          return { title, processName: proc, bounds }
        } catch {
          continue
        }
      }
      return null
    } catch {
      return null
    }
  }

  private findWindowByProcessMacOS(processName: string): WindowInfo | null {
    try {
      const script = `
        tell application "System Events"
          set targetProc to first process whose name is "${processName}"
          set appName to name of targetProc
          set bundleId to bundle identifier of targetProc
          set frontWindow to first window of targetProc
          set {x, y} to position of frontWindow
          set {w, h} to size of frontWindow
          return appName & "|" & bundleId & "|" & x & "," & y & "," & w & "," & h
        end tell
      `
      const result = execSync(`osascript -e '${script}'`, { timeout: 2000 }).toString().trim()
      const [title, proc, boundsStr] = result.split('|')
      let bounds: WindowInfo['bounds'] | undefined
      if (boundsStr) {
        const parts = boundsStr.split(',').map(Number)
        if (parts.length === 4) {
          bounds = { x: parts[0], y: parts[1], width: parts[2], height: parts[3] }
        }
      }
      return { title: title || '', processName: proc || '', bounds }
    } catch {
      return null
    }
  }
}

// Singleton
let instance: ActiveWindowService | null = null

export function getActiveWindowService(): ActiveWindowService {
  if (!instance) {
    instance = new ActiveWindowService()
  }
  return instance
}

export function destroyActiveWindowService(): void {
  if (instance) {
    instance.stop()
    instance.removeAllListeners()
    instance = null
  }
}
