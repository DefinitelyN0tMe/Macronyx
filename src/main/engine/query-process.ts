// Dedicated PowerShell process for QUERIES ONLY (Active Window, Pixel Color).
// This is separate from the input simulator to avoid stdin/stdout interference.
// The input simulator uses sendFireAndForget (write-only, no stdout parsing)
// while queries use sendQuery (marker-based stdout parsing). Mixing them on
// the same process causes command corruption and EPIPE crashes.

import { spawn, ChildProcess } from 'child_process'
import type { WindowInfo } from '../../shared/types'

export interface RGB {
  r: number
  g: number
  b: number
}

class WindowsQueryProcess {
  private proc: ChildProcess | null = null
  private ready = false
  private readyPromise: Promise<void>
  private readyResolve!: () => void

  constructor() {
    this.readyPromise = new Promise((resolve) => {
      this.readyResolve = resolve
    })
    this.init()
  }

  private init(): void {
    this.proc = spawn('powershell.exe', ['-NoProfile', '-NoLogo', '-Command', '-'], {
      stdio: ['pipe', 'pipe', 'pipe'],
      windowsHide: true
    })

    // Prevent uncaught EPIPE on stdin
    this.proc.stdin?.on('error', (err) => {
      console.error('QueryProcess stdin error:', err.message)
    })

    const setupScript = `
Add-Type -TypeDefinition @'
using System;
using System.Runtime.InteropServices;

public class QueryHelper {
    [DllImport("user32.dll")]
    public static extern IntPtr GetForegroundWindow();

    [DllImport("user32.dll", CharSet = CharSet.Unicode)]
    public static extern int GetWindowText(IntPtr hWnd, System.Text.StringBuilder text, int count);

    [DllImport("user32.dll")]
    public static extern uint GetWindowThreadProcessId(IntPtr hWnd, out uint processId);

    [StructLayout(LayoutKind.Sequential)]
    public struct RECT {
        public int Left;
        public int Top;
        public int Right;
        public int Bottom;
    }

    [DllImport("user32.dll")]
    public static extern bool GetWindowRect(IntPtr hWnd, out RECT rect);

    public static string GetActiveWindowInfo() {
        IntPtr hwnd = GetForegroundWindow();
        if (hwnd == IntPtr.Zero) return "{}";
        var sb = new System.Text.StringBuilder(512);
        GetWindowText(hwnd, sb, 512);
        string title = sb.ToString().Replace("\\\\", "\\\\\\\\").Replace("\\"", "\\\\\\"");
        uint pid = 0;
        GetWindowThreadProcessId(hwnd, out pid);
        string processName = "";
        try {
            var proc = System.Diagnostics.Process.GetProcessById((int)pid);
            processName = proc.ProcessName;
        } catch {}
        RECT rect;
        GetWindowRect(hwnd, out rect);
        return "{\\"title\\":\\"" + title + "\\",\\"processName\\":\\"" + processName +
               "\\",\\"hwnd\\":" + hwnd.ToInt64() +
               ",\\"bounds\\":{\\"x\\":" + rect.Left + ",\\"y\\":" + rect.Top +
               ",\\"width\\":" + (rect.Right - rect.Left) +
               ",\\"height\\":" + (rect.Bottom - rect.Top) + "}}";
    }

    [DllImport("user32.dll")]
    public static extern IntPtr GetDC(IntPtr hWnd);

    [DllImport("gdi32.dll")]
    public static extern uint GetPixel(IntPtr hdc, int x, int y);

    [DllImport("user32.dll")]
    public static extern int ReleaseDC(IntPtr hWnd, IntPtr hdc);

    public static string GetPixelColorAt(int x, int y) {
        IntPtr hdc = GetDC(IntPtr.Zero);
        uint pixel = GetPixel(hdc, x, y);
        ReleaseDC(IntPtr.Zero, hdc);
        if (pixel == 0xFFFFFFFF) return "null";
        int r = (int)(pixel & 0xFF);
        int g = (int)((pixel >> 8) & 0xFF);
        int b = (int)((pixel >> 16) & 0xFF);
        return r + "," + g + "," + b;
    }
}
'@
Write-Output "READY"
`
    this.proc.stdin?.write(setupScript + '\n')

    this.proc.stdout?.on('data', (data: Buffer) => {
      const text = data.toString()
      if (text.includes('READY') && !this.ready) {
        this.ready = true
        this.readyResolve()
      }
    })

    this.proc.stderr?.on('data', (data: Buffer) => {
      console.error('QueryProcess stderr:', data.toString().trim())
    })

    this.proc.on('close', () => {
      this.proc = null
      this.ready = false
      // Invalidate singleton so a new process is created on next use
      querySingleton = null
    })
  }

  /** Wait until the PowerShell process has finished Add-Type compilation */
  async waitForReady(): Promise<void> {
    if (this.ready) return
    await this.readyPromise
  }

  /** Send a query command and capture the output using markers */
  private async sendQuery(cmd: string): Promise<string> {
    await this.waitForReady()

    return new Promise((resolve) => {
      if (!this.proc || !this.proc.stdin || !this.proc.stdout) {
        resolve('')
        return
      }

      let result = ''
      const marker = `__QRY_${Date.now()}_${Math.random().toString(36).slice(2, 6)}__`

      const onData = (data: Buffer): void => {
        const text = data.toString()
        result += text

        const markerIdx = result.indexOf(marker)
        if (markerIdx !== -1) {
          this.proc?.stdout?.removeListener('data', onData)
          const startMarker = `__QSTART${marker.slice(5)}`
          const startIdx = result.indexOf(startMarker)
          if (startIdx !== -1) {
            const content = result.slice(startIdx + startMarker.length, markerIdx).trim()
            resolve(content)
          } else {
            resolve('')
          }
        }
      }

      this.proc.stdout.on('data', onData)

      try {
        this.proc.stdin.write(
          `Write-Output "__QSTART${marker.slice(5)}"; ${cmd}; Write-Output "${marker}"\n`
        )
      } catch {
        this.proc?.stdout?.removeListener('data', onData)
        resolve('')
        return
      }

      // Timeout fallback
      setTimeout(() => {
        this.proc?.stdout?.removeListener('data', onData)
        resolve('')
      }, 1000)
    })
  }

  async getActiveWindow(): Promise<WindowInfo | null> {
    try {
      const result = await this.sendQuery('[QueryHelper]::GetActiveWindowInfo()')
      if (!result || result === '{}') return null
      return JSON.parse(result) as WindowInfo
    } catch {
      return null
    }
  }

  async getPixelColor(x: number, y: number): Promise<RGB | null> {
    try {
      const result = await this.sendQuery(
        `[QueryHelper]::GetPixelColorAt(${Math.round(x)}, ${Math.round(y)})`
      )
      if (!result || result === 'null') return null
      const parts = result.split(',').map(Number)
      if (parts.length === 3) {
        return { r: parts[0], g: parts[1], b: parts[2] }
      }
      return null
    } catch {
      return null
    }
  }

  destroy(): void {
    if (this.proc) {
      try {
        this.proc.stdin?.write('exit\n')
        this.proc.kill()
      } catch {
        // Already dead
      }
      this.proc = null
    }
  }
}

// ─── Singleton ─────────────────────────────────────────────────────────
let querySingleton: WindowsQueryProcess | null = null

/**
 * Get the shared query process (separate from the input simulator).
 * Used by ActiveWindowService and PixelSampler.
 * Only available on Windows; other platforms use native commands.
 */
export function getQueryProcess(): WindowsQueryProcess {
  if (!querySingleton) {
    querySingleton = new WindowsQueryProcess()
  }
  return querySingleton
}

export function destroyQueryProcess(): void {
  if (querySingleton) {
    querySingleton.destroy()
    querySingleton = null
  }
}
