import { contextBridge, ipcRenderer } from 'electron'
import { IPC } from '../shared/constants'

const api = {
  startRecording: (options?: Record<string, unknown>) =>
    ipcRenderer.invoke(IPC.RECORDING_START, options),
  stopRecording: () => ipcRenderer.invoke(IPC.RECORDING_STOP),
  onRecordingEvent: (callback: (event: unknown) => void) => {
    const listener = (_: unknown, event: unknown): void => callback(event)
    ipcRenderer.on(IPC.RECORDING_EVENT, listener)
    return () => {
      ipcRenderer.removeListener(IPC.RECORDING_EVENT, listener)
    }
  },
  onRecordingStatus: (callback: (status: unknown) => void) => {
    const listener = (_: unknown, status: unknown): void => callback(status)
    ipcRenderer.on(IPC.RECORDING_STATUS, listener)
    return () => {
      ipcRenderer.removeListener(IPC.RECORDING_STATUS, listener)
    }
  },

  startPlayback: (macroId: string, options?: Record<string, unknown>) =>
    ipcRenderer.invoke(IPC.PLAYBACK_START, macroId, options),
  stopPlayback: () => ipcRenderer.invoke(IPC.PLAYBACK_STOP),
  pausePlayback: () => ipcRenderer.invoke(IPC.PLAYBACK_PAUSE),
  resumePlayback: () => ipcRenderer.invoke(IPC.PLAYBACK_RESUME),
  onPlaybackStatus: (callback: (state: unknown) => void) => {
    const listener = (_: unknown, state: unknown): void => callback(state)
    ipcRenderer.on(IPC.PLAYBACK_STATUS, listener)
    return () => {
      ipcRenderer.removeListener(IPC.PLAYBACK_STATUS, listener)
    }
  },
  onPlaybackProgress: (callback: (progress: unknown) => void) => {
    const listener = (_: unknown, progress: unknown): void => callback(progress)
    ipcRenderer.on(IPC.PLAYBACK_PROGRESS, listener)
    return () => {
      ipcRenderer.removeListener(IPC.PLAYBACK_PROGRESS, listener)
    }
  },

  saveMacro: (macro: unknown) => ipcRenderer.invoke(IPC.MACRO_SAVE, macro),
  loadMacro: (id: string) => ipcRenderer.invoke(IPC.MACRO_LOAD, id),
  deleteMacro: (id: string) => ipcRenderer.invoke(IPC.MACRO_DELETE, id),
  listMacros: () => ipcRenderer.invoke(IPC.MACRO_LIST),
  exportMacro: (id: string) => ipcRenderer.invoke(IPC.MACRO_EXPORT, id),
  importMacro: () => ipcRenderer.invoke(IPC.MACRO_IMPORT),
  updateMacro: (macro: unknown) => ipcRenderer.invoke(IPC.MACRO_UPDATE, macro),

  getSettings: () => ipcRenderer.invoke(IPC.SETTINGS_GET),
  setSettings: (settings: unknown) => ipcRenderer.invoke(IPC.SETTINGS_SET, settings),

  listProfiles: () => ipcRenderer.invoke(IPC.PROFILE_LIST),
  saveProfile: (profile: unknown) => ipcRenderer.invoke(IPC.PROFILE_SAVE, profile),
  deleteProfile: (id: string) => ipcRenderer.invoke(IPC.PROFILE_DELETE, id),
  activateProfile: (id: string) => ipcRenderer.invoke(IPC.PROFILE_ACTIVATE, id),

  getPortableStatus: () => ipcRenderer.invoke(IPC.PORTABLE_STATUS),
  togglePortable: (enable: boolean) => ipcRenderer.invoke(IPC.PORTABLE_TOGGLE, enable),

  minimizeWindow: () => ipcRenderer.send(IPC.WINDOW_MINIMIZE),
  maximizeWindow: () => ipcRenderer.send(IPC.WINDOW_MAXIMIZE),
  closeWindow: () => ipcRenderer.send(IPC.WINDOW_CLOSE),
  toTray: () => ipcRenderer.send(IPC.WINDOW_TO_TRAY),
  isMaximized: () => ipcRenderer.invoke(IPC.WINDOW_IS_MAXIMIZED),

  onAppStatus: (callback: (status: unknown) => void) => {
    const listener = (_: unknown, status: unknown): void => callback(status)
    ipcRenderer.on(IPC.APP_STATUS, listener)
    return () => {
      ipcRenderer.removeListener(IPC.APP_STATUS, listener)
    }
  },

  onHotkeyAction: (callback: (action: string) => void) => {
    const listener = (_: unknown, action: string): void => callback(action)
    ipcRenderer.on('hotkey:action', listener)
    return () => {
      ipcRenderer.removeListener('hotkey:action', listener)
    }
  }
}

contextBridge.exposeInMainWorld('api', api)

export type MacronyxAPI = typeof api
