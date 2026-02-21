import { uIOhook, UiohookKeyboardEvent, UiohookMouseEvent, UiohookWheelEvent } from 'uiohook-napi'
import { v4 as uuid } from 'uuid'
import type { MacroEvent, AppSettings } from '../../shared/types'

export class Recorder {
  private events: MacroEvent[] = []
  private startTime = 0
  private lastEventTime = 0
  private isRecording = false
  private isPaused = false
  private pausedDuration = 0
  private pauseStartTime = 0
  private lastMouseMoveTime = 0
  private resumeCooldownUntil = 0
  private onEvent?: (event: MacroEvent) => void
  private settings: AppSettings['recording'] | null = null

  start(settings: AppSettings['recording'], onEvent: (event: MacroEvent) => void): void {
    this.events = []
    this.startTime = Date.now()
    this.lastEventTime = this.startTime
    this.lastMouseMoveTime = 0
    this.isRecording = true
    this.isPaused = false
    this.pausedDuration = 0
    this.pauseStartTime = 0
    this.resumeCooldownUntil = 0
    this.onEvent = onEvent
    this.settings = settings

    uIOhook.removeAllListeners()

    if (settings.captureKeyboard) {
      uIOhook.on('keydown', this.handleKeyDown)
      uIOhook.on('keyup', this.handleKeyUp)
    }
    if (settings.captureMouseClicks) {
      uIOhook.on('click', this.handleMouseClick)
    }
    if (settings.captureMouseMovement) {
      uIOhook.on('mousemove', this.handleMouseMove)
    }
    if (settings.captureMouseScroll) {
      uIOhook.on('wheel', this.handleWheel)
    }

    uIOhook.start()
  }

  stop(): MacroEvent[] {
    this.isRecording = false
    this.isPaused = false
    this.resumeCooldownUntil = 0
    try {
      uIOhook.stop()
    } catch {
      // Already stopped
    }
    uIOhook.removeAllListeners()
    return [...this.events]
  }

  pause(): void {
    if (!this.isRecording || this.isPaused) return
    this.isPaused = true
    this.pauseStartTime = Date.now()
  }

  resume(): void {
    if (!this.isRecording || !this.isPaused) return
    this.pausedDuration += Date.now() - this.pauseStartTime
    this.isPaused = false
    // Cooldown period — suppress any events that arrive within 200ms of resume
    // (these are key releases from the resume hotkey, not real user input)
    this.resumeCooldownUntil = Date.now() + 200
    // Reset lastEventTime so delay after resume is measured from resume moment
    this.lastEventTime = Date.now()
  }

  /** Get current accumulated pause duration (for external elapsed calculations) */
  getPausedDuration(): number {
    if (this.isPaused && this.pauseStartTime > 0) {
      return this.pausedDuration + (Date.now() - this.pauseStartTime)
    }
    return this.pausedDuration
  }

  private isInCooldown(): boolean {
    return this.resumeCooldownUntil > 0 && Date.now() < this.resumeCooldownUntil
  }

  private addEvent(event: MacroEvent): void {
    this.events.push(event)
    this.onEvent?.(event)
  }

  private getTimings(): { timestamp: number; delay: number } {
    const now = Date.now()
    const timestamp = now - this.startTime - this.pausedDuration
    const delay = now - this.lastEventTime
    this.lastEventTime = now
    return { timestamp, delay }
  }

  private handleKeyDown = (e: UiohookKeyboardEvent): void => {
    if (!this.isRecording || this.isPaused || this.isInCooldown()) return
    const { timestamp, delay } = this.getTimings()
    this.addEvent({
      id: uuid(),
      type: 'key_down',
      timestamp,
      delay,
      keyCode: e.keycode,
      modifiers: this.getModifiers(e)
    })
  }

  private handleKeyUp = (e: UiohookKeyboardEvent): void => {
    if (!this.isRecording || this.isPaused || this.isInCooldown()) return
    const { timestamp, delay } = this.getTimings()
    this.addEvent({
      id: uuid(),
      type: 'key_up',
      timestamp,
      delay,
      keyCode: e.keycode,
      modifiers: this.getModifiers(e)
    })
  }

  private handleMouseClick = (e: UiohookMouseEvent): void => {
    if (!this.isRecording || this.isPaused || this.isInCooldown()) return
    const { timestamp, delay } = this.getTimings()
    const button = e.button === 1 ? 'left' : e.button === 2 ? 'right' : 'middle'
    this.addEvent({
      id: uuid(),
      type: 'mouse_click',
      timestamp,
      delay,
      x: e.x,
      y: e.y,
      button,
      modifiers: this.getModifiers(e)
    })
  }

  private handleMouseMove = (e: UiohookMouseEvent): void => {
    if (!this.isRecording || this.isPaused || this.isInCooldown()) return
    const now = Date.now()
    const sampleRate = this.settings?.mouseMoveSampleRate ?? 16
    if (now - this.lastMouseMoveTime < sampleRate) return
    this.lastMouseMoveTime = now
    const { timestamp, delay } = this.getTimings()
    this.addEvent({
      id: uuid(),
      type: 'mouse_move',
      timestamp,
      delay,
      x: e.x,
      y: e.y
    })
  }

  private handleWheel = (e: UiohookWheelEvent): void => {
    if (!this.isRecording || this.isPaused || this.isInCooldown()) return
    const { timestamp, delay } = this.getTimings()
    // uiohook: rotation > 0 = scroll down, direction 3 = vertical
    // Store raw rotation with direction sign for playback
    const scrollY = e.direction === 3 ? e.rotation : 0
    const scrollX = e.direction !== 3 ? e.rotation : 0
    this.addEvent({
      id: uuid(),
      type: 'mouse_scroll',
      timestamp,
      delay,
      x: e.x,
      y: e.y,
      scrollDelta: { x: scrollX, y: scrollY }
    })
  }

  private getModifiers(e: {
    altKey: boolean
    ctrlKey: boolean
    metaKey: boolean
    shiftKey: boolean
  }): string[] {
    const mods: string[] = []
    if (e.altKey) mods.push('alt')
    if (e.ctrlKey) mods.push('ctrl')
    if (e.metaKey) mods.push('meta')
    if (e.shiftKey) mods.push('shift')
    return mods
  }
}
