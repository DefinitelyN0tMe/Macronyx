import { globalShortcut } from 'electron'
import type { AppSettings } from '../../shared/types'

type HotkeyAction = 'recordStart' | 'recordStop' | 'togglePause' | 'playStart' | 'playStop' | 'emergencyStop'

export class HotkeyManager {
  private registeredAccelerators: string[] = []
  private callbacks: Map<HotkeyAction, () => void> = new Map()
  private triggerAccelerators: Map<string, string> = new Map() // triggerId → accelerator

  setCallback(action: HotkeyAction, callback: () => void): void {
    this.callbacks.set(action, callback)
  }

  registerAll(hotkeys: AppSettings['hotkeys']): void {
    // Save trigger hotkeys before unregistering
    const savedTriggers = new Map(this.triggerAccelerators)
    this.unregisterAll()

    const mappings: [HotkeyAction, string][] = [
      ['recordStart', hotkeys.recordStart],
      ['recordStop', hotkeys.recordStop],
      ['togglePause', hotkeys.togglePause],
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

    // Restore trigger hotkeys (they were saved before unregisterAll)
    this.triggerAccelerators = savedTriggers
  }

  /** Register a dynamic trigger hotkey (separate from app hotkeys) */
  registerTriggerHotkey(id: string, accelerator: string, callback: () => void): void {
    if (!accelerator) return
    // Unregister previous if exists
    this.unregisterTriggerHotkey(id)

    try {
      const success = globalShortcut.register(accelerator, callback)
      if (success) {
        this.triggerAccelerators.set(id, accelerator)
      } else {
        console.warn(`Failed to register trigger hotkey: ${accelerator} for ${id}`)
      }
    } catch (err) {
      console.warn(`Error registering trigger hotkey ${accelerator}:`, err)
    }
  }

  /** Unregister a specific trigger hotkey */
  unregisterTriggerHotkey(id: string): void {
    const accel = this.triggerAccelerators.get(id)
    if (accel) {
      try {
        globalShortcut.unregister(accel)
      } catch {
        // Already unregistered
      }
      this.triggerAccelerators.delete(id)
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

    // Also unregister trigger hotkeys
    for (const [, accel] of this.triggerAccelerators) {
      try {
        globalShortcut.unregister(accel)
      } catch {
        // Already unregistered
      }
    }
    this.triggerAccelerators.clear()
  }
}
