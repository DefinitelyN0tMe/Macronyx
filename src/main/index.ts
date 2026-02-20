import { app, BrowserWindow, shell } from 'electron'
import { join } from 'path'
import { is } from '@electron-toolkit/utils'
import { registerIpcHandlers, cleanupIpc, getAppSettings } from './ipc'
import { TrayManager } from './tray'
import { appState } from './app-state'

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

    // Handle startMinimized
    mainWindow.on('ready-to-show', () => {
      if (settings.general.startMinimized) {
        // Don't show the window — it stays hidden, accessible via tray
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
})
