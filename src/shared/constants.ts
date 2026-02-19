import type { AppSettings } from './types'

export const IPC = {
  RECORDING_START: 'recording:start',
  RECORDING_STOP: 'recording:stop',
  RECORDING_EVENT: 'recording:event',
  RECORDING_STATUS: 'recording:status',

  PLAYBACK_START: 'playback:start',
  PLAYBACK_STOP: 'playback:stop',
  PLAYBACK_PAUSE: 'playback:pause',
  PLAYBACK_RESUME: 'playback:resume',
  PLAYBACK_STATUS: 'playback:status',
  PLAYBACK_PROGRESS: 'playback:progress',

  MACRO_SAVE: 'macro:save',
  MACRO_LOAD: 'macro:load',
  MACRO_DELETE: 'macro:delete',
  MACRO_LIST: 'macro:list',
  MACRO_EXPORT: 'macro:export',
  MACRO_IMPORT: 'macro:import',
  MACRO_UPDATE: 'macro:update',

  SETTINGS_GET: 'settings:get',
  SETTINGS_SET: 'settings:set',

  PROFILE_LIST: 'profile:list',
  PROFILE_SAVE: 'profile:save',
  PROFILE_DELETE: 'profile:delete',
  PROFILE_ACTIVATE: 'profile:activate',

  WINDOW_MINIMIZE: 'window:minimize',
  WINDOW_MAXIMIZE: 'window:maximize',
  WINDOW_CLOSE: 'window:close',
  WINDOW_TO_TRAY: 'window:toTray',
  WINDOW_IS_MAXIMIZED: 'window:isMaximized',

  APP_STATUS: 'app:status'
} as const

export const DEFAULT_SETTINGS: AppSettings = {
  general: {
    startMinimized: false,
    minimizeToTray: true,
    launchOnStartup: false,
    portableMode: false
  },
  recording: {
    captureMouseMovement: true,
    captureMouseClicks: true,
    captureMouseScroll: true,
    captureKeyboard: true,
    mouseMoveSampleRate: 16
  },
  playback: {
    defaultSpeed: 1.0,
    defaultRepeatCount: 1,
    defaultRepeatDelay: 0,
    defaultHumanize: false,
    defaultHumanizeAmount: 10
  },
  hotkeys: {
    recordStart: 'F9',
    recordStop: 'F10',
    playStart: 'F11',
    playStop: 'F12',
    emergencyStop: 'Escape'
  },
  appearance: {
    accentColor: '#06b6d4'
  }
}

export const DEFAULT_PLAYBACK_SETTINGS = {
  speed: 1.0,
  repeatCount: 1,
  repeatDelay: 0,
  humanize: false,
  humanizeAmount: 10
}
