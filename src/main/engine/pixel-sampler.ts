// Pixel Color Sampling Service — reads pixel colors from the screen
// Cross-platform: Windows (Win32 via PowerShell), Linux (xdotool+import), macOS (screencapture)

import { execSync } from 'child_process'
import { getInputSimulator } from './input-simulator'

export interface RGB {
  r: number
  g: number
  b: number
}

export class PixelSampler {
  /** Get the RGB color of the pixel at (x, y) on screen */
  async getPixelColor(x: number, y: number): Promise<RGB | null> {
    switch (process.platform) {
      case 'win32':
        return this.getPixelWindows(x, y)
      case 'linux':
        return this.getPixelLinux(x, y)
      case 'darwin':
        return this.getPixelMacOS(x, y)
      default:
        return null
    }
  }

  /** Check if pixel at (x,y) matches the target color within tolerance */
  async matchesColor(
    x: number,
    y: number,
    target: RGB,
    tolerance: number
  ): Promise<boolean> {
    const color = await this.getPixelColor(x, y)
    if (!color) return false
    const distance = Math.sqrt(
      (color.r - target.r) ** 2 +
      (color.g - target.g) ** 2 +
      (color.b - target.b) ** 2
    )
    return distance <= tolerance
  }

  private async getPixelWindows(x: number, y: number): Promise<RGB | null> {
    try {
      const sim = getInputSimulator()
      if ('getPixelColor' in sim) {
        return (sim as { getPixelColor: (x: number, y: number) => Promise<RGB | null> })
          .getPixelColor(x, y)
      }
      return null
    } catch {
      return null
    }
  }

  private async getPixelLinux(x: number, y: number): Promise<RGB | null> {
    try {
      // Use ImageMagick's import to capture a single pixel
      const result = execSync(
        `import -window root -crop 1x1+${Math.round(x)}+${Math.round(y)} -depth 8 txt:- | tail -1`,
        { timeout: 2000 }
      )
        .toString()
        .trim()
      // Output like: "0,0: (255,128,0)  #FF8000  srgb(255,128,0)"
      const match = result.match(/\((\d+),(\d+),(\d+)\)/)
      if (match) {
        return { r: parseInt(match[1]), g: parseInt(match[2]), b: parseInt(match[3]) }
      }
      return null
    } catch {
      return null
    }
  }

  private async getPixelMacOS(x: number, y: number): Promise<RGB | null> {
    try {
      // Capture a 1x1 screenshot and extract the pixel color
      const result = execSync(
        `screencapture -R${Math.round(x)},${Math.round(y)},1,1 -t bmp /dev/stdout | xxd -p -l 3 -s 54`,
        { timeout: 2000 }
      )
        .toString()
        .trim()
      if (result.length >= 6) {
        // BMP stores BGR
        return {
          r: parseInt(result.slice(4, 6), 16),
          g: parseInt(result.slice(2, 4), 16),
          b: parseInt(result.slice(0, 2), 16)
        }
      }
      return null
    } catch {
      return null
    }
  }
}

// Singleton
let instance: PixelSampler | null = null

export function getPixelSampler(): PixelSampler {
  if (!instance) {
    instance = new PixelSampler()
  }
  return instance
}
