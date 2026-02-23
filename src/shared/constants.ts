import type { AppSettings, MouseCurveSettings } from './types'

export const IPC = {
  RECORDING_START: 'recording:start',
  RECORDING_STOP: 'recording:stop',
  RECORDING_PAUSE: 'recording:pause',
  RECORDING_RESUME: 'recording:resume',
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

  // Macro chains
  CHAIN_SAVE: 'chain:save',
  CHAIN_LOAD: 'chain:load',
  CHAIN_DELETE: 'chain:delete',
  CHAIN_LIST: 'chain:list',
  CHAIN_PLAY: 'chain:play',
  CHAIN_STOP: 'chain:stop',
  CHAIN_PROGRESS: 'chain:progress',

  SETTINGS_GET: 'settings:get',
  SETTINGS_SET: 'settings:set',

  PROFILE_LIST: 'profile:list',
  PROFILE_SAVE: 'profile:save',
  PROFILE_DELETE: 'profile:delete',
  PROFILE_ACTIVATE: 'profile:activate',
  PROFILE_ACTIVATED: 'profile:activated',

  WINDOW_MINIMIZE: 'window:minimize',
  WINDOW_MAXIMIZE: 'window:maximize',
  WINDOW_CLOSE: 'window:close',
  WINDOW_TO_TRAY: 'window:toTray',
  WINDOW_IS_MAXIMIZED: 'window:isMaximized',

  APP_STATUS: 'app:status',

  PORTABLE_STATUS: 'portable:status',
  PORTABLE_TOGGLE: 'portable:toggle',

  OVERLAY_STATUS: 'overlay:status',
  OVERLAY_SHOW_MAIN: 'overlay:showMain',

  // Active window & pixel sampling
  ACTIVE_WINDOW_INFO: 'active-window:info',
  PIXEL_SAMPLE: 'pixel:sample',
  PIXEL_PICK: 'pixel:pick',

  // Triggers
  TRIGGER_FIRED: 'trigger:fired',

  // Playback results (v1.4)
  PLAYBACK_EVENT_RESULT: 'playback:eventResult',
  PLAYBACK_REPORT: 'playback:report'
} as const

export const DEFAULT_SETTINGS: AppSettings = {
  general: {
    startMinimized: false,
    minimizeToTray: true,
    launchOnStartup: false,
    portableMode: false,
    showOverlayWidget: true,
    autoSave: true,
    enableTriggers: false,
    autoSwitchProfiles: false
  },
  recording: {
    captureMouseMovement: true,
    captureMouseClicks: true,
    captureMouseScroll: true,
    captureKeyboard: true,
    mouseMoveSampleRate: 16,
    relativePositioning: false
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
    togglePause: 'Shift+F9',
    playStart: 'F11',
    playStop: 'Shift+F11',
    emergencyStop: 'Escape'
  },
  appearance: {
    accentColor: '#06b6d4'
  },
  profileRules: []
}

export const DEFAULT_PLAYBACK_SETTINGS = {
  speed: 1.0,
  repeatCount: 1,
  repeatDelay: 0,
  humanize: false,
  humanizeAmount: 10
}

export const DEFAULT_MOUSE_CURVE: MouseCurveSettings = {
  enabled: false,
  curvature: 30,
  overshoot: 10,
  speedProfile: 'ease-in-out'
}

/** Shared status/UI color constants — single source of truth */
export const STATUS_COLORS = {
  idle: '#6b7280',
  recording: '#ef4444',
  playing: '#22c55e',
  paused: '#f59e0b',
  accentCyan: '#06b6d4',
  accentViolet: '#a855f7',
  danger: '#ef4444',
  success: '#22c55e',
  warning: '#f59e0b'
} as const
