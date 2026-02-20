import { app, BrowserWindow, shell, ipcMain } from 'electron'
import { join } from 'path'
import { is } from '@electron-toolkit/utils'
import { registerIpcHandlers, cleanupIpc, getAppSettings } from './ipc'
import { TrayManager } from './tray'
import { appState } from './app-state'
import {
  createOverlayWindow,
  showOverlay,
  hideOverlay,
  setOverlayEnabled,
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

  // Handle minimizeToTray: intercept window close and hide instead
  mainWindow.on('close', (event) => {
    if (!appState.isQuitting && appState.minimizeToTray) {
      event.preventDefault()
      mainWindow?.hide()
    }
  })

  // Show overlay when main window is hidden/minimized
  mainWindow.on('hide', () => {
    showOverlay()
  })
  mainWindow.on('minimize', () => {
    showOverlay()
  })

  // Hide overlay when main window is shown/restored
  mainWindow.on('show', () => {
    hideOverlay()
  })
  mainWindow.on('restore', () => {
    hideOverlay()
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
      if (mainWindow) {
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
