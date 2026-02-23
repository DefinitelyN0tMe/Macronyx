import { app, BrowserWindow, shell, ipcMain } from 'electron'
import { join } from 'path'
import { is } from '@electron-toolkit/utils'
import { registerIpcHandlers, cleanupIpc, getAppSettings } from './ipc'
import { TrayManager } from './tray'
import { appState } from './app-state'
import {
  createOverlayWindow,
  showOverlay,
  setOverlayEnabled,
  setMainWindowVisible,
  destroyOverlay
} from './overlay'
import { IPC } from '../shared/constants'

let mainWindow: BrowserWindow | null = null
let trayManager: TrayManager | null = null

function createWindow(): void {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 960,
    minHeight: 600,
    show: false,
    frame: false,
    backgroundColor: '#0a0e27',
    titleBarStyle: 'hidden',
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false,
      contextIsolation: true,
      nodeIntegration: false
    }
  })

  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })

  // Handle minimizeToTray: intercept window close and hide instead.
  // When minimizeToTray is OFF, quit the whole app so the overlay
  // window doesn't keep the process alive in the background.
  mainWindow.on('close', (event) => {
    if (appState.isQuitting) return
    if (appState.minimizeToTray) {
      event.preventDefault()
      mainWindow?.hide()
    } else {
      // User wants a full exit — trigger app.quit() so before-quit
      // fires and cleans up tray, overlay, and IPC properly.
      app.quit()
    }
  })

  // Track main window visibility for smart overlay show/hide.
  // The overlay now auto-shows during active states (recording/playing/paused)
  // and auto-hides when idle + main window is visible.
  mainWindow.on('hide', () => {
    setMainWindowVisible(false)
  })
  mainWindow.on('minimize', () => {
    setMainWindowVisible(false)
  })
  mainWindow.on('show', () => {
    setMainWindowVisible(true)
  })
  mainWindow.on('restore', () => {
    setMainWindowVisible(true)
  })

  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }
}

app.whenReady().then(async () => {
  createWindow()

  if (mainWindow) {
    registerIpcHandlers(mainWindow)
    trayManager = new TrayManager(mainWindow)
    trayManager.create()

    // Load settings for startup behavior
    const settings = await getAppSettings()
    appState.minimizeToTray = settings.general.minimizeToTray

    // Initialize overlay widget setting
    const overlayEnabled = settings.general.showOverlayWidget !== false
    setOverlayEnabled(overlayEnabled)

    // Pre-create overlay window so it loads fast
    if (overlayEnabled) {
      createOverlayWindow()
    }

    // Listen for "show main window" from overlay
    ipcMain.on(IPC.OVERLAY_SHOW_MAIN, () => {
      if (mainWindow && !mainWindow.isDestroyed()) {
        mainWindow.show()
        mainWindow.focus()
      }
    })

    // Handle startMinimized
    mainWindow.on('ready-to-show', () => {
      if (settings.general.startMinimized) {
        // Don't show the window — it stays hidden, accessible via tray
        // Show overlay instead since window is hidden
        showOverlay()
      } else {
        mainWindow?.show()
      }
    })
  }

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow()
    } else {
      mainWindow?.show()
    }
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('before-quit', () => {
  appState.isQuitting = true
  cleanupIpc()
  trayManager?.destroy()
  destroyOverlay()
})
