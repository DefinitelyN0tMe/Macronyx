import { globalShortcut } from 'electron'
import type { AppSettings } from '../../shared/types'

type HotkeyAction = 'recordStart' | 'recordStop' | 'playStart' | 'playStop' | 'emergencyStop'

export class HotkeyManager {
  private registeredAccelerators: string[] = []
  private callbacks: Map<HotkeyAction, () => void> = new Map()

  setCallback(action: HotkeyAction, callback: () => void): void {
    this.callbacks.set(action, callback)
  }

  registerAll(hotkeys: AppSettings['hotkeys']): void {
    this.unregisterAll()

    const mappings: [HotkeyAction, string][] = [
      ['recordStart', hotkeys.recordStart],
      ['recordStop', hotkeys.recordStop],
      ['playStart', hotkeys.playStart],
      ['playStop', hotkeys.playStop],
      ['emergencyStop', hotkeys.emergencyStop]
    ]

    for (const [action, accelerator] of mappings) {
      if (!accelerator) continue
      const callback = this.callbacks.get(action)
      if (!callback) continue

      try {
        const success = globalShortcut.register(accelerator, callback)
        if (success) {
          this.registeredAccelerators.push(accelerator)
        } else {
          console.warn(`Failed to register hotkey: ${accelerator} for ${action}`)
        }
      } catch (err) {
        console.warn(`Error registering hotkey ${accelerator}:`, err)
      }
    }
  }

  unregisterAll(): void {
    for (const accel of this.registeredAccelerators) {
      try {
        globalShortcut.unregister(accel)
      } catch {
        // Already unregistered
      }
    }
    this.registeredAccelerators = []
  }
}
