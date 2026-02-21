// Native input simulation using platform-specific approaches
// Windows: Uses a persistent PowerShell process with preloaded Win32 APIs
// Linux: Uses xdotool
// macOS: Uses cliclick or AppleScript

import { spawn, ChildProcess, execSync } from 'child_process'

interface InputSimulator {
  moveMouse(x: number, y: number): Promise<void>
  /** Atomically move cursor to (x,y) and click — guarantees click at correct position */
  moveAndClick(x: number, y: number, button: 'left' | 'right' | 'middle'): Promise<void>
  mouseDown(button: 'left' | 'right' | 'middle'): Promise<void>
  mouseUp(button: 'left' | 'right' | 'middle'): Promise<void>
  mouseClick(button: 'left' | 'right' | 'middle'): Promise<void>
  mouseScroll(deltaY: number): Promise<void>
  keyDown(keyName: string): Promise<void>
  keyUp(keyName: string): Promise<void>
  destroy(): void
}

// ─── Windows Simulator using persistent PowerShell ─────────────────────
class WindowsSimulator implements InputSimulator {
  private proc: ChildProcess | null = null
  private ready = false
  private queue: { resolve: () => void; reject: (err: Error) => void; done: boolean }[] = []

  constructor() {
    this.init()
  }

  private init(): void {
    // Start a single PowerShell process that stays alive and accepts commands via stdin
    this.proc = spawn('powershell.exe', ['-NoProfile', '-NoLogo', '-Command', '-'], {
      stdio: ['pipe', 'pipe', 'pipe'],
      windowsHide: true
    })

    // Preload required assemblies and define helper functions
    const setupScript = `
Add-Type -TypeDefinition @'
using System;
using System.Runtime.InteropServices;

public struct INPUT {
    public int type;
    public INPUTUNION data;
}

[StructLayout(LayoutKind.Explicit)]
public struct INPUTUNION {
    [FieldOffset(0)] public MOUSEINPUT mi;
    [FieldOffset(0)] public KEYBDINPUT ki;
}

[StructLayout(LayoutKind.Sequential)]
public struct MOUSEINPUT {
    public int dx;
    public int dy;
    public int mouseData;
    public int dwFlags;
    public int time;
    public IntPtr dwExtraInfo;
}

[StructLayout(LayoutKind.Sequential)]
public struct KEYBDINPUT {
    public short wVk;
    public short wScan;
    public int dwFlags;
    public int time;
    public IntPtr dwExtraInfo;
}

public class NativeInput {
    [DllImport("user32.dll")]
    public static extern bool SetProcessDPIAware();

    [DllImport("user32.dll")]
    public static extern int GetSystemMetrics(int nIndex);

    [DllImport("user32.dll")]
    public static extern uint SendInput(uint nInputs, INPUT[] pInputs, int cbSize);

    [DllImport("user32.dll")]
    public static extern short VkKeyScan(char ch);

    [DllImport("user32.dll")]
    public static extern int MapVirtualKey(int uCode, int uMapType);

    private static bool dpiAware = false;
    private static int virtualX = 0;
    private static int virtualY = 0;
    private static int virtualW = 0;
    private static int virtualH = 0;

    public static void EnsureDPIAware() {
        if (!dpiAware) {
            SetProcessDPIAware();
            dpiAware = true;
            // Use virtual screen metrics for multi-monitor support
            // SM_XVIRTUALSCREEN (76) / SM_YVIRTUALSCREEN (77) = top-left origin (can be negative)
            // SM_CXVIRTUALSCREEN (78) / SM_CYVIRTUALSCREEN (79) = total virtual screen size
            virtualX = GetSystemMetrics(76);
            virtualY = GetSystemMetrics(77);
            virtualW = GetSystemMetrics(78);
            virtualH = GetSystemMetrics(79);
            // Fallback to primary monitor if virtual screen metrics are zero
            if (virtualW == 0 || virtualH == 0) {
                virtualX = 0;
                virtualY = 0;
                virtualW = GetSystemMetrics(0); // SM_CXSCREEN
                virtualH = GetSystemMetrics(1); // SM_CYSCREEN
            }
        }
    }

    public static void MoveMouse(int x, int y) {
        EnsureDPIAware();
        // Map coordinates to 0-65535 range across the virtual screen (all monitors)
        // MOUSEEVENTF_VIRTUALDESK (0x4000) ensures mapping covers all monitors
        int normX = (int)(((long)(x - virtualX) * 65536L) / virtualW);
        int normY = (int)(((long)(y - virtualY) * 65536L) / virtualH);
        INPUT[] input = new INPUT[1];
        input[0].type = 0; // INPUT_MOUSE
        input[0].data.mi.dx = normX;
        input[0].data.mi.dy = normY;
        input[0].data.mi.dwFlags = 0x0001 | 0x8000 | 0x4000; // MOVE | ABSOLUTE | VIRTUALDESK
        SendInput(1, input, Marshal.SizeOf(typeof(INPUT)));
    }

    // Atomic move + click: sends move and click as a single SendInput batch
    // This guarantees the click happens exactly at the target position
    public static void MoveAndClick(int x, int y, int downFlags, int upFlags) {
        EnsureDPIAware();
        int normX = (int)(((long)(x - virtualX) * 65536L) / virtualW);
        int normY = (int)(((long)(y - virtualY) * 65536L) / virtualH);
        // Batch: move, then click-down, then click-up — all in one SendInput call
        INPUT[] input = new INPUT[3];
        // Move
        input[0].type = 0;
        input[0].data.mi.dx = normX;
        input[0].data.mi.dy = normY;
        input[0].data.mi.dwFlags = 0x0001 | 0x8000 | 0x4000;
        // Mouse down
        input[1].type = 0;
        input[1].data.mi.dwFlags = downFlags;
        // Mouse up
        input[2].type = 0;
        input[2].data.mi.dwFlags = upFlags;
        SendInput(3, input, Marshal.SizeOf(typeof(INPUT)));
    }

    public static void MouseEvent(int flags, int data) {
        INPUT[] input = new INPUT[1];
        input[0].type = 0; // INPUT_MOUSE
        input[0].data.mi.dwFlags = flags;
        input[0].data.mi.mouseData = data;
        SendInput(1, input, Marshal.SizeOf(typeof(INPUT)));
    }

    public static void KeyEvent(short vk, short scan, bool keyUp) {
        INPUT[] input = new INPUT[1];
        input[0].type = 1; // INPUT_KEYBOARD
        input[0].data.ki.wVk = vk;
        input[0].data.ki.wScan = scan;
        input[0].data.ki.dwFlags = keyUp ? 2 : 0; // KEYEVENTF_KEYUP : 0
        SendInput(1, input, Marshal.SizeOf(typeof(INPUT)));
    }
}
'@
Write-Output "READY"
`
    this.proc.stdin?.write(setupScript + '\n')

    this.proc.stdout?.on('data', (data: Buffer) => {
      const text = data.toString()
      if (text.includes('READY')) {
        this.ready = true
      }
      // Count how many "OK" responses arrived in this chunk and resolve that many pending commands
      const okCount = (text.match(/\bOK\b/g) || []).length
      for (let i = 0; i < okCount; i++) {
        const pending = this.queue.shift()
        if (pending && !pending.done) {
          pending.done = true
          pending.resolve()
        }
      }
    })

    this.proc.stderr?.on('data', (data: Buffer) => {
      console.error('PS Error:', data.toString())
    })

    this.proc.on('close', () => {
      this.proc = null
      this.ready = false
      // Invalidate singleton so a new process is created on next use
      singleton = null
    })
  }

  private sendCommand(cmd: string): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.proc || !this.proc.stdin) {
        reject(new Error('PowerShell process not available'))
        return
      }
      const entry = { resolve, reject, done: false }
      this.queue.push(entry)
      this.proc.stdin.write(cmd + '; Write-Output "OK"\n')

      // Timeout to prevent hanging — only resolve if not already done
      setTimeout(() => {
        if (!entry.done) {
          entry.done = true
          const idx = this.queue.indexOf(entry)
          if (idx !== -1) {
            this.queue.splice(idx, 1)
          }
          resolve() // Don't reject, just move on
        }
      }, 200)
    })
  }

  // Fast fire-and-forget for mouse movement (no waiting for response)
  private sendFireAndForget(cmd: string): void {
    if (!this.proc || !this.proc.stdin) return
    this.proc.stdin.write(cmd + '\n')
  }

  async moveMouse(x: number, y: number): Promise<void> {
    this.sendFireAndForget(`[NativeInput]::MoveMouse(${Math.round(x)}, ${Math.round(y)})`)
  }

  async mouseDown(button: 'left' | 'right' | 'middle'): Promise<void> {
    const flags = button === 'right' ? 0x0008 : button === 'middle' ? 0x0020 : 0x0002
    await this.sendCommand(`[NativeInput]::MouseEvent(${flags}, 0)`)
  }

  async mouseUp(button: 'left' | 'right' | 'middle'): Promise<void> {
    const flags = button === 'right' ? 0x0010 : button === 'middle' ? 0x0040 : 0x0004
    await this.sendCommand(`[NativeInput]::MouseEvent(${flags}, 0)`)
  }

  async moveAndClick(x: number, y: number, button: 'left' | 'right' | 'middle'): Promise<void> {
    const downFlags = button === 'right' ? 0x0008 : button === 'middle' ? 0x0020 : 0x0002
    const upFlags = button === 'right' ? 0x0010 : button === 'middle' ? 0x0040 : 0x0004
    // Atomic move+click via single SendInput batch — guarantees click at correct position
    this.sendFireAndForget(`[NativeInput]::MoveAndClick(${Math.round(x)}, ${Math.round(y)}, ${downFlags}, ${upFlags})`)
    // Small delay to let the click complete
    await new Promise(r => setTimeout(r, 25))
  }

  async mouseClick(button: 'left' | 'right' | 'middle'): Promise<void> {
    const downFlags = button === 'right' ? 0x0008 : button === 'middle' ? 0x0020 : 0x0002
    const upFlags = button === 'right' ? 0x0010 : button === 'middle' ? 0x0040 : 0x0004
    this.sendFireAndForget(`[NativeInput]::MouseEvent(${downFlags}, 0); Start-Sleep -Milliseconds 20; [NativeInput]::MouseEvent(${upFlags}, 0)`)
    // Small delay to let the click complete
    await new Promise(r => setTimeout(r, 30))
  }

  async mouseScroll(deltaY: number): Promise<void> {
    // Windows WHEEL_DELTA: positive = scroll UP, negative = scroll DOWN
    // uiohook rotation: positive = scroll DOWN
    // So we negate: -deltaY * WHEEL_DELTA(120)
    const amount = Math.round(-deltaY * 120)
    this.sendFireAndForget(`[NativeInput]::MouseEvent(0x0800, ${amount})`)
  }

  async keyDown(keyName: string): Promise<void> {
    const vk = getWindowsVK(keyName)
    if (vk === undefined) return
    const scan = 0
    this.sendFireAndForget(`[NativeInput]::KeyEvent(${vk}, ${scan}, $false)`)
  }

  async keyUp(keyName: string): Promise<void> {
    const vk = getWindowsVK(keyName)
    if (vk === undefined) return
    const scan = 0
    this.sendFireAndForget(`[NativeInput]::KeyEvent(${vk}, ${scan}, $true)`)
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
    this.queue = []
  }
}

// ─── Linux Simulator using xdotool ────────────────────────────────────
class LinuxSimulator implements InputSimulator {
  async moveMouse(x: number, y: number): Promise<void> {
    execSync(`xdotool mousemove --sync ${Math.round(x)} ${Math.round(y)}`, { timeout: 1000 })
  }

  async moveAndClick(x: number, y: number, button: 'left' | 'right' | 'middle'): Promise<void> {
    const btn = button === 'right' ? '3' : button === 'middle' ? '2' : '1'
    execSync(`xdotool mousemove --sync ${Math.round(x)} ${Math.round(y)} click ${btn}`, { timeout: 1000 })
  }

  async mouseDown(button: 'left' | 'right' | 'middle'): Promise<void> {
    const btn = button === 'right' ? '3' : button === 'middle' ? '2' : '1'
    execSync(`xdotool mousedown ${btn}`, { timeout: 1000 })
  }

  async mouseUp(button: 'left' | 'right' | 'middle'): Promise<void> {
    const btn = button === 'right' ? '3' : button === 'middle' ? '2' : '1'
    execSync(`xdotool mouseup ${btn}`, { timeout: 1000 })
  }

  async mouseClick(button: 'left' | 'right' | 'middle'): Promise<void> {
    const btn = button === 'right' ? '3' : button === 'middle' ? '2' : '1'
    execSync(`xdotool click ${btn}`, { timeout: 1000 })
  }

  async mouseScroll(deltaY: number): Promise<void> {
    const btn = deltaY > 0 ? '5' : '4'
    const count = Math.max(1, Math.abs(Math.round(deltaY)))
    execSync(`xdotool click --repeat ${count} ${btn}`, { timeout: 1000 })
  }

  async keyDown(keyName: string): Promise<void> {
    const xKey = getXdotoolKey(keyName)
    if (!xKey) return
    execSync(`xdotool keydown ${xKey}`, { timeout: 1000 })
  }

  async keyUp(keyName: string): Promise<void> {
    const xKey = getXdotoolKey(keyName)
    if (!xKey) return
    execSync(`xdotool keyup ${xKey}`, { timeout: 1000 })
  }

  destroy(): void {
    // Nothing to clean up
  }
}

// ─── macOS Simulator using cliclick / osascript ───────────────────────
class MacOSSimulator implements InputSimulator {
  private hasClic = false

  constructor() {
    // Check if cliclick is installed (brew install cliclick)
    try {
      execSync('which cliclick', { timeout: 2000 })
      this.hasClic = true
    } catch {
      this.hasClic = false
    }
  }

  async moveAndClick(x: number, y: number, button: 'left' | 'right' | 'middle'): Promise<void> {
    if (this.hasClic) {
      const cmd = button === 'right' ? 'rc' : 'c'
      execSync(`cliclick ${cmd}:${Math.round(x)},${Math.round(y)}`, { timeout: 1000 })
    } else {
      await this.moveMouse(x, y)
      await this.mouseClick(button)
    }
  }

  async moveMouse(x: number, y: number): Promise<void> {
    if (this.hasClic) {
      execSync(`cliclick m:${Math.round(x)},${Math.round(y)}`, { timeout: 1000 })
    } else {
      execSync(
        `osascript -e 'do shell script "cliclick m:${Math.round(x)},${Math.round(y)}" 2>/dev/null || python3 -c "import Quartz; Quartz.CGEventPost(Quartz.kCGHIDEventTap, Quartz.CGEventCreateMouseEvent(None, Quartz.kCGEventMouseMoved, (${Math.round(x)}, ${Math.round(y)}), 0))"'`,
        { timeout: 2000 }
      )
    }
  }

  async mouseDown(button: 'left' | 'right' | 'middle'): Promise<void> {
    if (this.hasClic) {
      const cmd = button === 'right' ? 'rd' : 'dd'
      execSync(`cliclick ${cmd}:.`, { timeout: 1000 })
    }
  }

  async mouseUp(button: 'left' | 'right' | 'middle'): Promise<void> {
    if (this.hasClic) {
      execSync(`cliclick du:.`, { timeout: 1000 })
    }
  }

  async mouseClick(button: 'left' | 'right' | 'middle'): Promise<void> {
    if (this.hasClic) {
      const cmd = button === 'right' ? 'rc:.' : 'c:.'
      execSync(`cliclick ${cmd}`, { timeout: 1000 })
    } else {
      execSync(`osascript -e 'tell application "System Events" to click'`, { timeout: 2000 })
    }
  }

  async mouseScroll(deltaY: number): Promise<void> {
    const amount = Math.round(deltaY)
    execSync(
      `osascript -e 'tell application "System Events" to scroll area 1 of scroll area 1 by ${amount}'`,
      { timeout: 2000 }
    )
  }

  async keyDown(keyName: string): Promise<void> {
    if (this.hasClic) {
      execSync(`cliclick kd:${keyName}`, { timeout: 1000 })
    }
  }

  async keyUp(keyName: string): Promise<void> {
    if (this.hasClic) {
      execSync(`cliclick ku:${keyName}`, { timeout: 1000 })
    }
  }

  destroy(): void {
    // Nothing to clean up
  }
}

// ─── Key mapping: uiohook key name → Windows Virtual Key code ─────────
function getWindowsVK(keyName: string): number | undefined {
  const VK_MAP: Record<string, number> = {
    // Letters
    a: 0x41, b: 0x42, c: 0x43, d: 0x44, e: 0x45,
    f: 0x46, g: 0x47, h: 0x48, i: 0x49, j: 0x4a,
    k: 0x4b, l: 0x4c, m: 0x4d, n: 0x4e, o: 0x4f,
    p: 0x50, q: 0x51, r: 0x52, s: 0x53, t: 0x54,
    u: 0x55, v: 0x56, w: 0x57, x: 0x58, y: 0x59, z: 0x5a,
    // Numbers
    '0': 0x30, '1': 0x31, '2': 0x32, '3': 0x33, '4': 0x34,
    '5': 0x35, '6': 0x36, '7': 0x37, '8': 0x38, '9': 0x39,
    // Function keys
    F1: 0x70, F2: 0x71, F3: 0x72, F4: 0x73,
    F5: 0x74, F6: 0x75, F7: 0x76, F8: 0x77,
    F9: 0x78, F10: 0x79, F11: 0x7a, F12: 0x7b,
    // Special keys
    Escape: 0x1b, BackSpace: 0x08, Tab: 0x09,
    Return: 0x0d, space: 0x20,
    Control_L: 0xa2, Control_R: 0xa3,
    Shift_L: 0xa0, Shift_R: 0xa1,
    Alt_L: 0xa4, Alt_R: 0xa5,
    Super_L: 0x5b, Super_R: 0x5c,
    // Navigation
    Up: 0x26, Down: 0x28, Left: 0x25, Right: 0x27,
    Page_Up: 0x21, Page_Down: 0x22,
    Home: 0x24, End: 0x23,
    Insert: 0x2d, Delete: 0x2e,
    // Symbols
    semicolon: 0xba, apostrophe: 0xde, grave: 0xc0,
    backslash: 0xdc, comma: 0xbc, period: 0xbe,
    slash: 0xbf, minus: 0xbd, equal: 0xbb,
    bracketleft: 0xdb, bracketright: 0xdd,
    // Locks
    Caps_Lock: 0x14, Num_Lock: 0x90, Scroll_Lock: 0x91,
    // Numpad
    KP_0: 0x60, KP_1: 0x61, KP_2: 0x62, KP_3: 0x63,
    KP_4: 0x64, KP_5: 0x65, KP_6: 0x66, KP_7: 0x67,
    KP_8: 0x68, KP_9: 0x69,
    KP_Multiply: 0x6a, KP_Add: 0x6b, KP_Subtract: 0x6d,
    KP_Decimal: 0x6e, KP_Divide: 0x6f, KP_Enter: 0x0d,
    // Other
    Print: 0x2c, Pause: 0x13
  }
  return VK_MAP[keyName]
}

// ─── Key mapping: uiohook key name → xdotool key name ─────────────────
function getXdotoolKey(keyName: string): string | undefined {
  const XDOTOOL_MAP: Record<string, string> = {
    Escape: 'Escape', BackSpace: 'BackSpace', Tab: 'Tab',
    Return: 'Return', space: 'space',
    Control_L: 'Control_L', Control_R: 'Control_R',
    Shift_L: 'Shift_L', Shift_R: 'Shift_R',
    Alt_L: 'Alt_L', Alt_R: 'Alt_R',
    Super_L: 'Super_L', Super_R: 'Super_R',
    Up: 'Up', Down: 'Down', Left: 'Left', Right: 'Right',
    Page_Up: 'Page_Up', Page_Down: 'Page_Down',
    Home: 'Home', End: 'End',
    Insert: 'Insert', Delete: 'Delete',
    F1: 'F1', F2: 'F2', F3: 'F3', F4: 'F4',
    F5: 'F5', F6: 'F6', F7: 'F7', F8: 'F8',
    F9: 'F9', F10: 'F10', F11: 'F11', F12: 'F12',
    Caps_Lock: 'Caps_Lock', Num_Lock: 'Num_Lock',
    Scroll_Lock: 'Scroll_Lock',
    semicolon: 'semicolon', apostrophe: 'apostrophe',
    grave: 'grave', backslash: 'backslash',
    comma: 'comma', period: 'period', slash: 'slash',
    minus: 'minus', equal: 'equal',
    bracketleft: 'bracketleft', bracketright: 'bracketright',
    KP_0: 'KP_0', KP_1: 'KP_1', KP_2: 'KP_2', KP_3: 'KP_3',
    KP_4: 'KP_4', KP_5: 'KP_5', KP_6: 'KP_6', KP_7: 'KP_7',
    KP_8: 'KP_8', KP_9: 'KP_9',
    KP_Multiply: 'KP_Multiply', KP_Add: 'KP_Add',
    KP_Subtract: 'KP_Subtract', KP_Decimal: 'KP_Decimal',
    KP_Divide: 'KP_Divide', KP_Enter: 'KP_Enter'
  }
  // Direct mapping for letters and numbers
  if (/^[a-z0-9]$/.test(keyName)) return keyName
  return XDOTOOL_MAP[keyName]
}

// ─── Factory ──────────────────────────────────────────────────────────
let singleton: InputSimulator | null = null

export function getInputSimulator(): InputSimulator {
  if (singleton) return singleton

  switch (process.platform) {
    case 'win32':
      singleton = new WindowsSimulator()
      break
    case 'linux':
      singleton = new LinuxSimulator()
      break
    case 'darwin':
      singleton = new MacOSSimulator()
      break
    default:
      throw new Error(`Unsupported platform: ${process.platform}`)
  }

  return singleton
}

export function destroyInputSimulator(): void {
  if (singleton) {
    singleton.destroy()
    singleton = null
  }
}
