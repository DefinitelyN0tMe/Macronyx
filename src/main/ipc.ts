import { ipcMain, BrowserWindow, dialog } from 'electron'
import { v4 as uuid } from 'uuid'
import { IPC } from '../shared/constants'
import type { Macro, MacroEvent, AppSettings, PlaybackState } from '../shared/types'
import { Recorder } from './engine/recorder'
import { Player } from './engine/player'
import { HotkeyManager } from './engine/hotkeys'
import { MacroStorage } from './storage/macros'
import { SettingsStorage } from './storage/settings'
import { ProfileStorage } from './storage/profiles'
import { appState } from './app-state'

let recorder: Recorder | null = null
let player: Player | null = null
let hotkeyManager: HotkeyManager | null = null
let macroStorage: MacroStorage | null = null
let settingsStorage: SettingsStorage | null = null
let profileStorage: ProfileStorage | null = null
let currentRecordingEvents: MacroEvent[] = []
let recordingStartTime = 0

export function registerIpcHandlers(mainWindow: BrowserWindow): void {
  macroStorage = new MacroStorage()
  settingsStorage = new SettingsStorage()
  profileStorage = new ProfileStorage()
  recorder = new Recorder()
  player = new Player()
  hotkeyManager = new HotkeyManager()

  // Window controls
  ipcMain.on(IPC.WINDOW_MINIMIZE, () => mainWindow.minimize())
  ipcMain.on(IPC.WINDOW_MAXIMIZE, () => {
    if (mainWindow.isMaximized()) {
      mainWindow.unmaximize()
    } else {
      mainWindow.maximize()
    }
  })
  ipcMain.on(IPC.WINDOW_CLOSE, () => mainWindow.close())
  ipcMain.on(IPC.WINDOW_TO_TRAY, () => mainWindow.hide())
  ipcMain.handle(IPC.WINDOW_IS_MAXIMIZED, () => mainWindow.isMaximized())

  // Recording
  ipcMain.handle(IPC.RECORDING_START, async () => {
    try {
      const settings = await settingsStorage!.get()
      currentRecordingEvents = []
      recordingStartTime = Date.now()

      recorder!.start(settings.recording, (event: MacroEvent) => {
        currentRecordingEvents.push(event)
        mainWindow.webContents.send(IPC.RECORDING_EVENT, event)
      })

      mainWindow.webContents.send(IPC.APP_STATUS, 'recording')
      mainWindow.webContents.send(IPC.RECORDING_STATUS, {
        isRecording: true,
        eventCount: 0,
        elapsedMs: 0,
        startTime: recordingStartTime
      })
      return { success: true }
    } catch (err) {
      return { success: false, error: String(err) }
    }
  })

  ipcMain.handle(IPC.RECORDING_STOP, async () => {
    try {
      recorder!.stop()
      const events = [...currentRecordingEvents]
      const duration = events.length > 0 ? events[events.length - 1].timestamp : 0
      // Use user's default playback settings from saved settings
      const userSettings = await settingsStorage!.get()
      const macro: Macro = {
        id: uuid(),
        name: `Recording ${new Date().toLocaleString()}`,
        description: '',
        events,
        duration,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        tags: [],
        folder: '',
        hotkey: '',
        playbackSettings: {
          speed: userSettings.playback.defaultSpeed,
          repeatCount: userSettings.playback.defaultRepeatCount,
          repeatDelay: userSettings.playback.defaultRepeatDelay,
          humanize: userSettings.playback.defaultHumanize,
          humanizeAmount: userSettings.playback.defaultHumanizeAmount
        }
      }
      await macroStorage!.save(macro)
      currentRecordingEvents = []
      mainWindow.webContents.send(IPC.APP_STATUS, 'idle')
      mainWindow.webContents.send(IPC.RECORDING_STATUS, {
        isRecording: false,
        eventCount: events.length,
        elapsedMs: duration,
        startTime: 0
      })
      return { success: true, macro }
    } catch (err) {
      return { success: false, error: String(err) }
    }
  })

  // Playback
  ipcMain.handle(IPC.PLAYBACK_START, async (_e, macroId: string) => {
    try {
      const macro = await macroStorage!.load(macroId)
      if (!macro) return { success: false, error: 'Macro not found' }

      // Always apply the current global default playback settings so that
      // changes in Settings → Playback take effect immediately for all macros.
      const currentSettings = await settingsStorage!.get()
      macro.playbackSettings = {
        speed: currentSettings.playback.defaultSpeed,
        repeatCount: currentSettings.playback.defaultRepeatCount,
        repeatDelay: currentSettings.playback.defaultRepeatDelay,
        humanize: currentSettings.playback.defaultHumanize,
        humanizeAmount: currentSettings.playback.defaultHumanizeAmount
      }

      mainWindow.webContents.send(IPC.APP_STATUS, 'playing')
      player!.play(macro, (state: PlaybackState) => {
        mainWindow.webContents.send(IPC.PLAYBACK_PROGRESS, state)
        if (state.status === 'idle') {
          mainWindow.webContents.send(IPC.APP_STATUS, 'idle')
        }
      })
      return { success: true }
    } catch (err) {
      return { success: false, error: String(err) }
    }
  })

  ipcMain.handle(IPC.PLAYBACK_STOP, async () => {
    player!.stop()
    mainWindow.webContents.send(IPC.APP_STATUS, 'idle')
    return { success: true }
  })

  ipcMain.handle(IPC.PLAYBACK_PAUSE, async () => {
    player!.pause()
    mainWindow.webContents.send(IPC.APP_STATUS, 'paused')
    return { success: true }
  })

  ipcMain.handle(IPC.PLAYBACK_RESUME, async () => {
    player!.resume()
    mainWindow.webContents.send(IPC.APP_STATUS, 'playing')
    return { success: true }
  })

  // Macros
  ipcMain.handle(IPC.MACRO_SAVE, async (_e, macro: Macro) => {
    try {
      await macroStorage!.save(macro)
      return { success: true }
    } catch (err) {
      return { success: false, error: String(err) }
    }
  })

  ipcMain.handle(IPC.MACRO_LOAD, async (_e, id: string) => {
    return await macroStorage!.load(id)
  })

  ipcMain.handle(IPC.MACRO_DELETE, async (_e, id: string) => {
    try {
      await macroStorage!.delete(id)
      return { success: true }
    } catch (err) {
      return { success: false, error: String(err) }
    }
  })

  ipcMain.handle(IPC.MACRO_LIST, async () => {
    return await macroStorage!.list()
  })

  ipcMain.handle(IPC.MACRO_UPDATE, async (_e, macro: Macro) => {
    try {
      macro.updatedAt = new Date().toISOString()
      await macroStorage!.save(macro)
      return { success: true }
    } catch (err) {
      return { success: false, error: String(err) }
    }
  })

  ipcMain.handle(IPC.MACRO_EXPORT, async (_e, id: string) => {
    try {
      const macro = await macroStorage!.load(id)
      if (!macro) return { success: false, error: 'Macro not found' }

      const result = await dialog.showSaveDialog(mainWindow, {
        title: 'Export Macro',
        defaultPath: `${macro.name.replace(/[^a-z0-9]/gi, '_')}.macronyx`,
        filters: [{ name: 'Macronyx Macro', extensions: ['macronyx', 'json'] }]
      })

      if (result.canceled || !result.filePath) return { success: false, error: 'Cancelled' }
      await macroStorage!.exportMacro(id, result.filePath)
      return { success: true, path: result.filePath }
    } catch (err) {
      return { success: false, error: String(err) }
    }
  })

  ipcMain.handle(IPC.MACRO_IMPORT, async () => {
    try {
      const result = await dialog.showOpenDialog(mainWindow, {
        title: 'Import Macro',
        filters: [{ name: 'Macronyx Macro', extensions: ['macronyx', 'json'] }],
        properties: ['openFile']
      })

      if (result.canceled || result.filePaths.length === 0)
        return { success: false, error: 'Cancelled' }
      const macro = await macroStorage!.importMacro(result.filePaths[0])
      return { success: true, macro }
    } catch (err) {
      return { success: false, error: String(err) }
    }
  })

  // Settings
  ipcMain.handle(IPC.SETTINGS_GET, async () => {
    return await settingsStorage!.get()
  })

  ipcMain.handle(IPC.SETTINGS_SET, async (_e, settings: Partial<AppSettings>) => {
    try {
      const updated = await settingsStorage!.set(settings)
      // Re-register hotkeys when settings change
      setupHotkeys(mainWindow, updated)
      // Update minimize-to-tray behavior in shared state
      appState.minimizeToTray = updated.general.minimizeToTray
      return { success: true, settings: updated }
    } catch (err) {
      return { success: false, error: String(err) }
    }
  })

  // Profiles
  ipcMain.handle(IPC.PROFILE_LIST, async () => {
    return await profileStorage!.list()
  })

  ipcMain.handle(IPC.PROFILE_SAVE, async (_e, profile) => {
    try {
      await profileStorage!.save(profile)
      return { success: true }
    } catch (err) {
      return { success: false, error: String(err) }
    }
  })

  ipcMain.handle(IPC.PROFILE_DELETE, async (_e, id: string) => {
    try {
      await profileStorage!.delete(id)
      return { success: true }
    } catch (err) {
      return { success: false, error: String(err) }
    }
  })

  ipcMain.handle(IPC.PROFILE_ACTIVATE, async (_e, id: string) => {
    try {
      const profile = await profileStorage!.activate(id)
      if (profile) {
        await settingsStorage!.set(profile.settings)
        setupHotkeys(mainWindow, profile.settings)
      }
      return { success: true }
    } catch (err) {
      return { success: false, error: String(err) }
    }
  })

  // Initialize hotkeys
  settingsStorage.get().then((settings) => {
    setupHotkeys(mainWindow, settings)
  })
}

function setupHotkeys(mainWindow: BrowserWindow, settings: AppSettings): void {
  if (!hotkeyManager) return

  hotkeyManager.setCallback('recordStart', () => {
    mainWindow.webContents.send('hotkey:action', 'recordStart')
  })
  hotkeyManager.setCallback('recordStop', () => {
    mainWindow.webContents.send('hotkey:action', 'recordStop')
  })
  hotkeyManager.setCallback('playStart', () => {
    mainWindow.webContents.send('hotkey:action', 'playStart')
  })
  hotkeyManager.setCallback('playStop', () => {
    mainWindow.webContents.send('hotkey:action', 'playStop')
  })
  hotkeyManager.setCallback('emergencyStop', () => {
    recorder?.stop()
    player?.stop()
    mainWindow.webContents.send(IPC.APP_STATUS, 'idle')
    if (!mainWindow.isVisible()) {
      mainWindow.show()
      mainWindow.focus()
    }
  })

  hotkeyManager.registerAll(settings.hotkeys)
}

export function cleanupIpc(): void {
  if (recorder) {
    try { recorder.stop() } catch { /* may already be stopped */ }
    recorder = null
  }
  if (player) {
    player.destroy()
    player = null
  }
  if (hotkeyManager) {
    hotkeyManager.unregisterAll()
    hotkeyManager = null
  }
}

export async function getAppSettings(): Promise<AppSettings> {
  if (!settingsStorage) {
    settingsStorage = new SettingsStorage()
  }
  return settingsStorage.get()
}
