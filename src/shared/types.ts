export type MacroEventType =
  | 'mouse_move'
  | 'mouse_click'
  | 'mouse_up'
  | 'mouse_scroll'
  | 'key_down'
  | 'key_up'
  | 'condition_start'
  | 'condition_else'
  | 'condition_end'

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
  /** Relative positioning — stores offset from active window origin */
  relativeToWindow?: {
    title: string
    processName: string
    offsetX: number
    offsetY: number
    /** Window dimensions at recording time — used for proportional scaling (v1.4) */
    windowWidth?: number
    windowHeight?: number
  }
  /** Conditional logic — links condition_start/else/end events */
  conditionPairId?: string
  /** Condition evaluation config (only on condition_start events) */
  condition?: ConditionConfig
}

export interface ConditionConfig {
  type: 'pixel_color' | 'window_title' | 'time_of_day'
  // pixel_color
  x?: number
  y?: number
  color?: { r: number; g: number; b: number }
  tolerance?: number // 0-255
  // window_title
  matchType?: 'contains' | 'equals' | 'regex'
  matchValue?: string
  // time_of_day
  afterTime?: string // "HH:mm"
  beforeTime?: string // "HH:mm"
}

/** Mouse curve settings for natural movement (v1.4) */
export interface MouseCurveSettings {
  enabled: boolean
  curvature: number    // 0-100 — how much the path curves
  overshoot: number    // 0-50 — how much cursor overshoots the target
  speedProfile: 'constant' | 'ease-in-out' | 'natural'
}

export interface PlaybackSettings {
  speed: number // 0.25 - 4.0
  repeatCount: number // 0 = infinite
  repeatDelay: number // ms between repeats
  humanize: boolean
  humanizeAmount: number // 0-100
  /** Natural mouse curve settings (v1.4) */
  mouseCurve?: MouseCurveSettings
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
  /** Trigger configurations for this macro */
  triggers?: TriggerConfig[]
}

// ─── Macro Chaining ────────────────────────────────────────────────────

export interface ChainStep {
  macroId: string
  delayAfterMs: number // delay before next step
  enabled: boolean // skip this step if disabled
}

export interface MacroChain {
  id: string
  name: string
  description: string
  steps: ChainStep[]
  createdAt: string
  updatedAt: string
}

export interface ChainPlaybackState {
  chainId: string
  status: 'idle' | 'playing' | 'paused'
  currentStepIndex: number
  totalSteps: number
  currentMacroId: string | null
  currentRepeat?: number
  totalRepeats?: number
}

// ─── Triggers ──────────────────────────────────────────────────────────

export type TriggerType = 'hotkey_combo' | 'schedule' | 'window_focus' | 'pixel_color'

export interface TriggerConfig {
  id: string
  type: TriggerType
  enabled: boolean
  macroId: string
  // hotkey_combo
  hotkey?: string // e.g. "Ctrl+Alt+1"
  // schedule
  schedule?: string // cron expression e.g. "0 */5 * * *"
  // window_focus
  windowMatch?: {
    matchType: 'process' | 'title_contains' | 'title_regex'
    matchValue: string
  }
  // pixel_color
  pixelMatch?: {
    x: number
    y: number
    color: { r: number; g: number; b: number }
    tolerance: number // 0-255
  }
  /** Pixel color repeat mode: true = re-fire after each playback while pixel matches,
   *  false = fire once, don't re-fire until pixel stops matching then matches again.
   *  Default: false (fire once) */
  repeatWhileMatch?: boolean
}

// ─── Profile Auto-Switch ───────────────────────────────────────────────

export interface ProfileRule {
  id: string
  profileId: string
  matchType: 'process' | 'title_contains' | 'title_regex'
  matchValue: string
  priority: number // higher = checked first
}

// ─── Active Window ─────────────────────────────────────────────────────

export interface WindowInfo {
  title: string
  processName: string
  hwnd?: number
  bounds?: { x: number; y: number; width: number; height: number }
}

// ─── Settings ──────────────────────────────────────────────────────────

export interface AppSettings {
  general: {
    startMinimized: boolean
    minimizeToTray: boolean
    launchOnStartup: boolean
    portableMode: boolean
    showOverlayWidget: boolean
    autoSave: boolean
    enableTriggers: boolean
    autoSwitchProfiles: boolean
  }
  recording: {
    captureMouseMovement: boolean
    captureMouseClicks: boolean
    captureMouseScroll: boolean
    captureKeyboard: boolean
    mouseMoveSampleRate: number // ms between samples
    relativePositioning: boolean
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
    togglePause: string
    playStart: string
    playStop: string
    emergencyStop: string
  }
  appearance: {
    accentColor: string
  }
  /** Profile auto-switch rules */
  profileRules: ProfileRule[]
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

// ─── Playback Results (v1.4) ──────────────────────────────────────────

export type EventResultStatus = 'pending' | 'success' | 'failed' | 'skipped'

export interface EventResult {
  eventIndex: number
  status: EventResultStatus
  error?: string
  timestamp: number // when the result was recorded
}

export interface PlaybackReport {
  macroId: string
  startedAt: number
  finishedAt: number
  totalEvents: number
  successCount: number
  failedCount: number
  skippedCount: number
  results: EventResult[]
}
