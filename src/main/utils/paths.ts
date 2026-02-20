import { app } from 'electron'
import * as path from 'path'
import * as fs from 'fs'

/**
 * Get the real directory where the executable lives.
 * For portable builds, electron-builder extracts to a temp folder so
 * app.getPath('exe') points to temp. Use PORTABLE_EXECUTABLE_DIR
 * env var which electron-builder sets to the actual exe location.
 */
export function getExeDir(): string {
  return process.env.PORTABLE_EXECUTABLE_DIR || path.dirname(app.getPath('exe'))
}

export function getPortableMarkerPath(): string {
  return path.join(getExeDir(), 'portable')
}

export function isPortableMode(): boolean {
  try {
    return fs.existsSync(getPortableMarkerPath())
  } catch {
    return false
  }
}

export function getDataPath(): string {
  if (isPortableMode()) {
    return path.join(getExeDir(), 'data')
  }
  return path.join(app.getPath('userData'), 'data')
}
