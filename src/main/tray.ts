import { Tray, Menu, BrowserWindow, app, nativeImage } from 'electron'
import { join } from 'path'

export class TrayManager {
  private tray: Tray | null = null
  private mainWindow: BrowserWindow

  constructor(mainWindow: BrowserWindow) {
    this.mainWindow = mainWindow
  }

  create(): void {
    // Create a simple 16x16 icon programmatically
    const icon = nativeImage.createFromBuffer(this.createIconBuffer())
    this.tray = new Tray(icon.resize({ width: 16, height: 16 }))
    this.tray.setToolTip('Macronyx')
    this.updateContextMenu('Idle')

    this.tray.on('double-click', () => {
      this.mainWindow.show()
      this.mainWindow.focus()
    })
  }

  updateContextMenu(status: string): void {
    if (!this.tray) return
    const menu = Menu.buildFromTemplate([
      { label: `Macronyx — ${status}`, enabled: false },
      { type: 'separator' },
      {
        label: 'Show Window',
        click: () => {
          this.mainWindow.show()
          this.mainWindow.focus()
        }
      },
      { type: 'separator' },
      { label: 'Quit', click: () => app.quit() }
    ])
    this.tray.setContextMenu(menu)
  }

  destroy(): void {
    this.tray?.destroy()
    this.tray = null
  }

  private createIconBuffer(): Buffer {
    // Create a minimal 16x16 PNG with cyan color for the tray icon
    // This is a valid 16x16 PNG with a cyan M shape
    const width = 16
    const height = 16
    const data = Buffer.alloc(width * height * 4, 0)

    // Draw a simple "M" shape in cyan (#06b6d4)
    const r = 6,
      g = 182,
      b = 212,
      a = 255
    const setPixel = (x: number, y: number): void => {
      if (x >= 0 && x < width && y >= 0 && y < height) {
        const i = (y * width + x) * 4
        data[i] = r
        data[i + 1] = g
        data[i + 2] = b
        data[i + 3] = a
      }
    }

    // M shape - two verticals and a V in the middle
    for (let y = 2; y < 14; y++) {
      setPixel(2, y)
      setPixel(3, y)
      setPixel(12, y)
      setPixel(13, y)
    }
    // Top diagonals
    for (let i = 0; i < 4; i++) {
      setPixel(4 + i, 3 + i)
      setPixel(5 + i, 3 + i)
      setPixel(11 - i, 3 + i)
      setPixel(10 - i, 3 + i)
    }

    return nativeImage.createFromBuffer(data, { width, height }).toPNG()
  }
}
