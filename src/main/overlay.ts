import { BrowserWindow, screen, ipcMain } from 'electron'
import { join } from 'path'
import { is } from '@electron-toolkit/utils'
import { IPC } from '../shared/constants'
import type { AppStatus } from '../shared/types'

let overlayWindow: BrowserWindow | null = null
let currentStatus: AppStatus = 'idle'
let elapsedMs = 0
let totalDurationMs = 0
let overlayEnabled = true

export function createOverlayWindow(): void {
  if (overlayWindow) return

  const { width: screenWidth } = screen.getPrimaryDisplay().workAreaSize

  overlayWindow = new BrowserWindow({
    width: 220,
    height: 52,
    x: screenWidth - 240,
    y: 20,
    frame: false,
    transparent: true,
    alwaysOnTop: true,
    skipTaskbar: true,
    resizable: false,
    focusable: false,
    show: false,
    hasShadow: false,
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false,
      contextIsolation: true,
      nodeIntegration: false
    }
  })

  // Allow mouse events on the overlay (not click-through)
  overlayWindow.setIgnoreMouseEvents(false)

  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    overlayWindow.loadURL(`${process.env['ELECTRON_RENDERER_URL']}/overlay.html`)
  } else {
    overlayWindow.loadFile(join(__dirname, '../renderer/overlay.html'))
  }

  // Listen for "show main window" requests from the overlay
  ipcMain.on(IPC.OVERLAY_SHOW_MAIN, () => {
    // This will be handled by index.ts which has access to mainWindow
  })

  overlayWindow.on('closed', () => {
    overlayWindow = null
  })
}

export function setOverlayEnabled(enabled: boolean): void {
  overlayEnabled = enabled
  if (!enabled) {
    hideOverlay()
  }
}

export function showOverlay(): void {
  if (!overlayEnabled) return
  if (!overlayWindow) {
    createOverlayWindow()
  }
  // Small delay to ensure the window is fully loaded
  setTimeout(() => {
    overlayWindow?.showInactive()
    sendStatusToOverlay()
  }, 100)
}

export function hideOverlay(): void {
  overlayWindow?.hide()
}

export function updateOverlayStatus(status: AppStatus, elapsed?: number, totalDuration?: number): void {
  currentStatus = status
  if (elapsed !== undefined) elapsedMs = elapsed
  if (totalDuration !== undefined) totalDurationMs = totalDuration
  if (status === 'idle') totalDurationMs = 0
  sendStatusToOverlay()
}

function sendStatusToOverlay(): void {
  if (!overlayWindow || overlayWindow.isDestroyed()) return
  overlayWindow.webContents.send(IPC.OVERLAY_STATUS, {
    status: currentStatus,
    elapsedMs,
    totalDurationMs
  })
}

export function destroyOverlay(): void {
  if (overlayWindow && !overlayWindow.isDestroyed()) {
    overlayWindow.destroy()
  }
  overlayWindow = null
}

export function getOverlayWindow(): BrowserWindow | null {
  return overlayWindow
}
