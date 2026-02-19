import { app } from 'electron'
import * as path from 'path'
import * as fs from 'fs'

export function isPortableMode(): boolean {
  try {
    const portableMarker = path.join(path.dirname(app.getPath('exe')), 'portable')
    return fs.existsSync(portableMarker)
  } catch {
    return false
  }
}

export function getDataPath(): string {
  if (isPortableMode()) {
    return path.join(path.dirname(app.getPath('exe')), 'data')
  }
  return path.join(app.getPath('userData'), 'data')
}
