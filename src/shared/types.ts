export type MacroEventType =
  | 'mouse_move'
  | 'mouse_click'
  | 'mouse_up'
  | 'mouse_scroll'
  | 'key_down'
  | 'key_up'

export type MouseButton = 'left' | 'right' | 'middle'

export type AppStatus = 'idle' | 'recording' | 'recording_paused' | 'playing' | 'paused'

export interface MacroEvent {
  id: string
  type: MacroEventType
  timestamp: number // ms from macro start
  delay: number // ms since previous event
  x?: number
  y?: number
  button?: MouseButton
  scrollDelta?: { x: number; y: number }
  key?: string
  keyCode?: number
  modifiers?: string[]
  group?: string
}

export interface PlaybackSettings {
  speed: number // 0.25 - 4.0
  repeatCount: number // 0 = infinite
  repeatDelay: number // ms between repeats
  humanize: boolean
  humanizeAmount: number // 0-100
}

export interface Macro {
  id: string
  name: string
  description: string
  events: MacroEvent[]
  eventCount?: number // used by list() when events are omitted for performance
  duration: number // ms
  createdAt: string
  updatedAt: string
  tags: string[]
  folder: string
  hotkey: string
  playbackSettings: PlaybackSettings
}

export interface AppSettings {
  general: {
    startMinimized: boolean
    minimizeToTray: boolean
    launchOnStartup: boolean
    portableMode: boolean
    showOverlayWidget: boolean
  }
  recording: {
    captureMouseMovement: boolean
    captureMouseClicks: boolean
    captureMouseScroll: boolean
    captureKeyboard: boolean
    mouseMoveSampleRate: number // ms between samples
  }
  playback: {
    defaultSpeed: number
    defaultRepeatCount: number
    defaultRepeatDelay: number
    defaultHumanize: boolean
    defaultHumanizeAmount: number
  }
  hotkeys: {
    recordStart: string
    recordStop: string
    playStart: string
    playStop: string
    emergencyStop: string
  }
  appearance: {
    accentColor: string
  }
}

export interface Profile {
  id: string
  name: string
  settings: AppSettings
  isActive: boolean
}

export interface PlaybackState {
  macroId: string | null
  status: 'idle' | 'playing' | 'paused'
  currentEventIndex: number
  currentRepeat: number
  totalRepeats: number
  elapsedMs: number
}

export interface RecordingState {
  isRecording: boolean
  isPaused: boolean
  eventCount: number
  elapsedMs: number
  startTime: number
}
