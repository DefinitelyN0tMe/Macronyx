import * as fs from 'fs/promises'
import * as path from 'path'
import type { Macro } from '../../shared/types'
import { getDataPath } from '../utils/paths'

const MACROS_DIR = 'macros'

export class MacroStorage {
  private get basePath(): string {
    return path.join(getDataPath(), MACROS_DIR)
  }

  private async ensureDir(): Promise<void> {
    await fs.mkdir(this.basePath, { recursive: true })
  }

  private macroPath(id: string): string {
    return path.join(this.basePath, `${id}.json`)
  }

  async save(macro: Macro): Promise<void> {
    await this.ensureDir()
    const filePath = this.macroPath(macro.id)
    await fs.writeFile(filePath, JSON.stringify(macro, null, 2), 'utf-8')
  }

  async load(id: string): Promise<Macro | null> {
    try {
      const filePath = this.macroPath(id)
      const data = await fs.readFile(filePath, 'utf-8')
      return JSON.parse(data) as Macro
    } catch {
      return null
    }
  }

  async delete(id: string): Promise<boolean> {
    try {
      await fs.unlink(this.macroPath(id))
      return true
    } catch {
      return false
    }
  }

  async list(): Promise<Macro[]> {
    await this.ensureDir()
    const macros: Macro[] = []
    try {
      const entries = await fs.readdir(this.basePath, { withFileTypes: true })
      for (const entry of entries) {
        if (!entry.isFile() || !entry.name.endsWith('.json')) continue
        try {
          const data = await fs.readFile(path.join(this.basePath, entry.name), 'utf-8')
          const macro = JSON.parse(data) as Macro
          // Return without the full events array for list performance
          macros.push({
            ...macro,
            eventCount: macro.events.length,
            events: [] // Omit events from list for performance
          })
        } catch {
          // Skip corrupt files
        }
      }
    } catch {
      // Directory empty or missing
    }
    return macros.sort(
      (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
    )
  }

  async exportMacro(id: string, exportPath: string): Promise<void> {
    const macro = await this.load(id)
    if (!macro) throw new Error(`Macro ${id} not found`)
    await fs.writeFile(exportPath, JSON.stringify(macro, null, 2), 'utf-8')
  }

  async importMacro(importPath: string): Promise<Macro> {
    const data = await fs.readFile(importPath, 'utf-8')
    const macro = JSON.parse(data) as Macro
    await this.save(macro)
    return macro
  }
}
