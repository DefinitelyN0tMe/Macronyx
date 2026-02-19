import * as fs from 'fs/promises'
import * as path from 'path'
import type { AppSettings } from '../../shared/types'
import { DEFAULT_SETTINGS } from '../../shared/constants'
import { getDataPath } from '../utils/paths'

const SETTINGS_FILE = 'settings.json'

export class SettingsStorage {
  private cache: AppSettings | null = null

  private get filePath(): string {
    return path.join(getDataPath(), SETTINGS_FILE)
  }

  async get(): Promise<AppSettings> {
    if (this.cache) return this.cache
    try {
      await fs.mkdir(path.dirname(this.filePath), { recursive: true })
      const data = await fs.readFile(this.filePath, 'utf-8')
      this.cache = this.deepMerge(DEFAULT_SETTINGS, JSON.parse(data)) as AppSettings
      return this.cache
    } catch {
      this.cache = { ...DEFAULT_SETTINGS }
      return this.cache
    }
  }

  async set(settings: Partial<AppSettings>): Promise<AppSettings> {
    const current = await this.get()
    const merged = this.deepMerge(current, settings) as AppSettings
    await fs.mkdir(path.dirname(this.filePath), { recursive: true })
    await fs.writeFile(this.filePath, JSON.stringify(merged, null, 2), 'utf-8')
    this.cache = merged
    return merged
  }

  private deepMerge(target: Record<string, unknown>, source: Record<string, unknown>): Record<string, unknown> {
    const result: Record<string, unknown> = { ...target }
    for (const key of Object.keys(source)) {
      const val = source[key]
      if (val && typeof val === 'object' && !Array.isArray(val)) {
        result[key] = this.deepMerge(
          (target[key] as Record<string, unknown>) || {},
          val as Record<string, unknown>
        )
      } else {
        result[key] = val
      }
    }
    return result
  }
}
