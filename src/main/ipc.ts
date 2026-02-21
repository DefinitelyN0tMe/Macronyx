import { ipcMain, BrowserWindow, dialog } from 'electron'
import { v4 as uuid } from 'uuid'
import * as fs from 'fs'
import { IPC } from '../shared/constants'
import type { Macro, MacroEvent, AppSettings, PlaybackState, MacroChain } from '../shared/types'
import { Recorder } from './engine/recorder'
import { Player } from './engine/player'
import { ChainPlayer } from './engine/chain-player'
import { HotkeyManager } from './engine/hotkeys'
import { MacroStorage } from './storage/macros'
import { ChainStorage } from './storage/chains'
import { SettingsStorage } from './storage/settings'
import { ProfileStorage } from './storage/profiles'
import { ProfileSwitcher } from './engine/profile-switcher'
import { TriggerManager } from './engine/trigger-manager'
import { getActiveWindowService, destroyActiveWindowService } from './engine/active-window'
import { getPixelSampler } from './engine/pixel-sampler'
import { appState } from './app-state'
import { getPortableMarkerPath } from './utils/paths'
import { updateOverlayStatus, setOverlayEnabled } from './overlay'

let recorder: Recorder | null = null
let player: Player | null = null
let chainPlayer: ChainPlayer | null = null
let hotkeyManager: HotkeyManager | null = null
let macroStorage: MacroStorage | null = null
let chainStorage: ChainStorage | null = null
let settingsStorage: SettingsStorage | null = null
let profileStorage: ProfileStorage | null = null
let profileSwitcher: ProfileSwitcher | null = null
let triggerManager: TriggerManager | null = null
let currentRecordingEvents: MacroEvent[] = []
let recordingStartTime = 0
let recordingPausedAt = 0
let recordingAccumulatedPause = 0
let playbackPaused = false

/** Compute the correct recording elapsed time (excluding pauses) */
function getRecordingElapsed(): number {
  if (recordingStartTime === 0) return 0
  const now = Date.now()
  if (recordingPausedAt > 0) {
    // Currently paused — elapsed up to the moment of pause
    return recordingPausedAt - recordingStartTime - recordingAccumulatedPause
  }
  return now - recordingStartTime - recordingAccumulatedPause
}

/** Remove orphaned key_down events at the tail of the recording (from pause hotkey) */
function cleanupOrphanedKeyDowns(): void {
  // Build count of held keys (more downs than ups)
  const downCount = new Map<number, number>()
  for (const event of currentRecordingEvents) {
    if (event.type === 'key_down' && event.keyCode !== undefined) {
      downCount.set(event.keyCode, (downCount.get(event.keyCode) || 0) + 1)
    } else if (event.type === 'key_up' && event.keyCode !== undefined) {
      const count = downCount.get(event.keyCode) || 0
      if (count > 0) downCount.set(event.keyCode, count - 1)
    }
  }

  const heldKeys = new Set<number>()
  for (const [keyCode, count] of downCount) {
    if (count > 0) heldKeys.add(keyCode)
  }

  if (heldKeys.size === 0) return

  // Remove trailing key_down events for held keys (walking backwards)
  for (let i = currentRecordingEvents.length - 1; i >= 0 && heldKeys.size > 0; i--) {
    const ev = currentRecordingEvents[i]
    if (ev.type === 'key_down' && ev.keyCode !== undefined && heldKeys.has(ev.keyCode)) {
      currentRecordingEvents.splice(i, 1)
      heldKeys.delete(ev.keyCode)
    }
  }
}

export function registerIpcHandlers(mainWindow: BrowserWindow): void {
  macroStorage = new MacroStorage()
  chainStorage = new ChainStorage()
  settingsStorage = new SettingsStorage()
  profileStorage = new ProfileStorage()
  recorder = new Recorder()
  player = new Player()
  chainPlayer = new ChainPlayer(player)
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
      recordingPausedAt = 0
      recordingAccumulatedPause = 0

      // Start active window service if relative positioning is enabled
      if (settings.recording.relativePositioning) {
        try {
          getActiveWindowService().start(200)
        } catch {
          // Non-fatal — recording works without it
        }
      }

      recorder!.start(settings.recording, (event: MacroEvent) => {
        currentRecordingEvents.push(event)
        mainWindow.webContents.send(IPC.RECORDING_EVENT, event)
      })

      mainWindow.webContents.send(IPC.APP_STATUS, 'recording')
      updateOverlayStatus('recording', 0)
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
      // If stopped while paused, clean up orphaned keys first
      if (recordingPausedAt > 0) {
        cleanupOrphanedKeyDowns()
      }
      recorder!.stop()
      recordingPausedAt = 0
      recordingAccumulatedPause = 0
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
      updateOverlayStatus('idle')
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

  ipcMain.handle(IPC.RECORDING_PAUSE, async () => {
    try {
      recorder!.pause()
      recordingPausedAt = Date.now()

      // Remove orphaned key_down events from the pause hotkey (e.g. Shift held)
      cleanupOrphanedKeyDowns()

      const elapsed = getRecordingElapsed()
      mainWindow.webContents.send(IPC.APP_STATUS, 'recording_paused')
      updateOverlayStatus('paused', elapsed)
      mainWindow.webContents.send(IPC.RECORDING_STATUS, {
        isRecording: true,
        isPaused: true,
        eventCount: currentRecordingEvents.length,
        elapsedMs: elapsed,
        startTime: recordingStartTime
      })
      return { success: true }
    } catch (err) {
      return { success: false, error: String(err) }
    }
  })

  ipcMain.handle(IPC.RECORDING_RESUME, async () => {
    try {
      recorder!.resume()
      if (recordingPausedAt > 0) {
        recordingAccumulatedPause += Date.now() - recordingPausedAt
        recordingPausedAt = 0
      }

      const elapsed = getRecordingElapsed()
      mainWindow.webContents.send(IPC.APP_STATUS, 'recording')
      updateOverlayStatus('recording', elapsed)
      mainWindow.webContents.send(IPC.RECORDING_STATUS, {
        isRecording: true,
        isPaused: false,
        eventCount: currentRecordingEvents.length,
        elapsedMs: elapsed,
        startTime: recordingStartTime
      })
      return { success: true }
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
      // changes in Settings > Playback take effect immediately for all macros.
      const currentSettings = await settingsStorage!.get()
      macro.playbackSettings = {
        speed: currentSettings.playback.defaultSpeed,
        repeatCount: currentSettings.playback.defaultRepeatCount,
        repeatDelay: currentSettings.playback.defaultRepeatDelay,
        humanize: currentSettings.playback.defaultHumanize,
        humanizeAmount: currentSettings.playback.defaultHumanizeAmount
      }

      const totalDuration = macro.duration / macro.playbackSettings.speed
      playbackPaused = false
      mainWindow.webContents.send(IPC.APP_STATUS, 'playing')
      updateOverlayStatus('playing', 0, totalDuration)
      player!.play(macro, (state: PlaybackState) => {
        mainWindow.webContents.send(IPC.PLAYBACK_PROGRESS, state)
        // Don't override overlay status while paused — player may fire one more
        // progress callback after pause before entering the wait loop
        if (!playbackPaused) {
          updateOverlayStatus(state.status === 'idle' ? 'idle' : state.status, state.elapsedMs, totalDuration)
        }
        if (state.status === 'idle') {
          playbackPaused = false
          mainWindow.webContents.send(IPC.APP_STATUS, 'idle')
          updateOverlayStatus('idle')
        }
      })
      return { success: true }
    } catch (err) {
      return { success: false, error: String(err) }
    }
  })

  ipcMain.handle(IPC.PLAYBACK_STOP, async () => {
    playbackPaused = false
    player!.stop() // also releases any held keys
    mainWindow.webContents.send(IPC.APP_STATUS, 'idle')
    updateOverlayStatus('idle')
    return { success: true }
  })

  ipcMain.handle(IPC.PLAYBACK_PAUSE, async () => {
    playbackPaused = true
    player!.pause()
    mainWindow.webContents.send(IPC.APP_STATUS, 'paused')
    updateOverlayStatus('paused')
    return { success: true }
  })

  ipcMain.handle(IPC.PLAYBACK_RESUME, async () => {
    playbackPaused = false
    player!.resume()
    mainWindow.webContents.send(IPC.APP_STATUS, 'playing')
    updateOverlayStatus('playing')
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
      // Reload triggers if triggers are enabled
      const settings = await settingsStorage!.get()
      if (settings.general.enableTriggers && triggerManager) {
        await reloadTriggers()
      }
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

  // ─── Chains ─────────────────────────────────────────────────────────
  ipcMain.handle(IPC.CHAIN_SAVE, async (_e, chain: MacroChain) => {
    try {
      await chainStorage!.save(chain)
      return { success: true }
    } catch (err) {
      return { success: false, error: String(err) }
    }
  })

  ipcMain.handle(IPC.CHAIN_LOAD, async (_e, id: string) => {
    return await chainStorage!.load(id)
  })

  ipcMain.handle(IPC.CHAIN_DELETE, async (_e, id: string) => {
    try {
      await chainStorage!.delete(id)
      return { success: true }
    } catch (err) {
      return { success: false, error: String(err) }
    }
  })

  ipcMain.handle(IPC.CHAIN_LIST, async () => {
    return await chainStorage!.list()
  })

  ipcMain.handle(IPC.CHAIN_PLAY, async (_e, chainId: string) => {
    try {
      const chain = await chainStorage!.load(chainId)
      if (!chain) return { success: false, error: 'Chain not found' }

      mainWindow.webContents.send(IPC.APP_STATUS, 'playing')
      updateOverlayStatus('playing')

      chainPlayer!.play(
        chain,
        async (macroId: string) => macroStorage!.load(macroId),
        (state) => {
          mainWindow.webContents.send(IPC.CHAIN_PROGRESS, state)
          if (state.status === 'idle') {
            mainWindow.webContents.send(IPC.APP_STATUS, 'idle')
            updateOverlayStatus('idle')
          }
        }
      )
      return { success: true }
    } catch (err) {
      return { success: false, error: String(err) }
    }
  })

  ipcMain.handle(IPC.CHAIN_STOP, async () => {
    chainPlayer!.stop()
    mainWindow.webContents.send(IPC.APP_STATUS, 'idle')
    updateOverlayStatus('idle')
    return { success: true }
  })

  // ─── Active window & pixel sampling ──────────────────────────────────
  ipcMain.handle(IPC.ACTIVE_WINDOW_INFO, async () => {
    try {
      const awService = getActiveWindowService()
      return await awService.pollOnce()
    } catch {
      return null
    }
  })

  ipcMain.handle(IPC.PIXEL_SAMPLE, async (_e, x: number, y: number) => {
    try {
      const sampler = getPixelSampler()
      return await sampler.getPixelColor(x, y)
    } catch {
      return null
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
      // Update overlay widget enabled state
      setOverlayEnabled(updated.general.showOverlayWidget !== false)

      // Start/stop trigger manager based on setting
      if (updated.general.enableTriggers) {
        await startTriggerManager(mainWindow)
      } else if (triggerManager) {
        triggerManager.stop()
        triggerManager = null
      }

      // Start/stop profile auto-switch
      if (updated.general.autoSwitchProfiles) {
        startProfileSwitcher(mainWindow, updated)
      } else if (profileSwitcher) {
        profileSwitcher.stop()
        profileSwitcher = null
      }

      return { success: true, settings: updated }
    } catch (err) {
      return { success: false, error: String(err) }
    }
  })

  // Portable mode
  ipcMain.handle(IPC.PORTABLE_STATUS, () => {
    try {
      const markerPath = getPortableMarkerPath()
      return { active: fs.existsSync(markerPath), path: markerPath }
    } catch {
      return { active: false, path: '' }
    }
  })

  ipcMain.handle(IPC.PORTABLE_TOGGLE, async (_e, enable: boolean) => {
    try {
      const markerPath = getPortableMarkerPath()
      if (enable) {
        fs.writeFileSync(markerPath, '', 'utf-8')
      } else {
        if (fs.existsSync(markerPath)) {
          fs.unlinkSync(markerPath)
        }
      }
      return { success: true, active: fs.existsSync(markerPath) }
    } catch (err) {
      return { success: false, error: String(err), active: false }
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

  // Initialize hotkeys and services on startup
  settingsStorage.get().then(async (settings) => {
    setupHotkeys(mainWindow, settings)

    // Start active window service (needed for triggers, profile auto-switch, relative positioning)
    try {
      getActiveWindowService().start(500)
    } catch {
      // Non-fatal
    }

    // Start trigger manager if enabled
    if (settings.general.enableTriggers) {
      await startTriggerManager(mainWindow)
    }

    // Start profile auto-switch if enabled
    if (settings.general.autoSwitchProfiles) {
      startProfileSwitcher(mainWindow, settings)
    }
  })
}

/** Initialize or re-initialize the trigger manager */
async function startTriggerManager(mainWindow: BrowserWindow): Promise<void> {
  if (triggerManager) {
    triggerManager.stop()
  }

  triggerManager = new TriggerManager(
    getActiveWindowService(),
    getPixelSampler(),
    hotkeyManager!
  )

  triggerManager.on('trigger-fired', async (data: { triggerId: string; macroId: string; type: string }) => {
    mainWindow.webContents.send(IPC.TRIGGER_FIRED, data)
    // Auto-play the macro
    try {
      const macro = await macroStorage!.load(data.macroId)
      if (macro) {
        const currentSettings = await settingsStorage!.get()
        macro.playbackSettings = {
          speed: currentSettings.playback.defaultSpeed,
          repeatCount: currentSettings.playback.defaultRepeatCount,
          repeatDelay: currentSettings.playback.defaultRepeatDelay,
          humanize: currentSettings.playback.defaultHumanize,
          humanizeAmount: currentSettings.playback.defaultHumanizeAmount
        }
        mainWindow.webContents.send(IPC.APP_STATUS, 'playing')
        updateOverlayStatus('playing')
        player!.play(macro, (state: PlaybackState) => {
          mainWindow.webContents.send(IPC.PLAYBACK_PROGRESS, state)
          if (state.status === 'idle') {
            mainWindow.webContents.send(IPC.APP_STATUS, 'idle')
            updateOverlayStatus('idle')
          }
        })
      }
    } catch (err) {
      console.error('Trigger playback error:', err)
    }
  })

  await reloadTriggers()
  triggerManager.start()
}

/** Reload triggers from all macros */
async function reloadTriggers(): Promise<void> {
  if (!triggerManager || !macroStorage) return
  const macros = await macroStorage.list()
  // Load full macros to get trigger configs
  const fullMacros: Macro[] = []
  for (const summary of macros) {
    const full = await macroStorage.load(summary.id)
    if (full) fullMacros.push(full)
  }
  triggerManager.loadTriggers(fullMacros)
}

/** Initialize profile auto-switch */
function startProfileSwitcher(mainWindow: BrowserWindow, settings: AppSettings): void {
  if (profileSwitcher) {
    profileSwitcher.stop()
  }

  profileSwitcher = new ProfileSwitcher(getActiveWindowService())
  profileSwitcher.setRules(settings.profileRules || [])
  profileSwitcher.onSwitch = async (profileId: string) => {
    try {
      const profile = await profileStorage!.activate(profileId)
      if (profile) {
        await settingsStorage!.set(profile.settings)
        setupHotkeys(mainWindow, profile.settings)
        mainWindow.webContents.send(IPC.PROFILE_ACTIVATED, { profileId, profileName: profile.name })
      }
    } catch (err) {
      console.error('Profile auto-switch error:', err)
    }
  }
  profileSwitcher.start()
}

function setupHotkeys(mainWindow: BrowserWindow, settings: AppSettings): void {
  if (!hotkeyManager) return

  hotkeyManager.setCallback('recordStart', () => {
    mainWindow.webContents.send('hotkey:action', 'recordStart')
  })
  hotkeyManager.setCallback('recordStop', () => {
    mainWindow.webContents.send('hotkey:action', 'recordStop')
  })
  hotkeyManager.setCallback('togglePause', () => {
    mainWindow.webContents.send('hotkey:action', 'togglePause')
  })
  hotkeyManager.setCallback('playStart', () => {
    mainWindow.webContents.send('hotkey:action', 'playStart')
  })
  hotkeyManager.setCallback('playStop', () => {
    mainWindow.webContents.send('hotkey:action', 'playStop')
  })
  hotkeyManager.setCallback('emergencyStop', () => {
    // Stop all recording/playback/chains and reset all state
    playbackPaused = false
    recordingPausedAt = 0
    recordingAccumulatedPause = 0
    if (recorder) {
      try { recorder.stop() } catch { /* may already be stopped */ }
    }
    if (player) {
      // player.stop() also releases held keys via releaseAllHeldKeys()
      player.stop()
    }
    if (chainPlayer) {
      chainPlayer.stop()
    }
    currentRecordingEvents = []
    mainWindow.webContents.send(IPC.APP_STATUS, 'idle')
    updateOverlayStatus('idle')
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
  if (chainPlayer) {
    chainPlayer.stop()
    chainPlayer = null
  }
  if (hotkeyManager) {
    hotkeyManager.unregisterAll()
    hotkeyManager = null
  }
  if (triggerManager) {
    triggerManager.stop()
    triggerManager = null
  }
  if (profileSwitcher) {
    profileSwitcher.stop()
    profileSwitcher = null
  }
  destroyActiveWindowService()
}

export async function getAppSettings(): Promise<AppSettings> {
  if (!settingsStorage) {
    settingsStorage = new SettingsStorage()
  }
  return settingsStorage.get()
}
