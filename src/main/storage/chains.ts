import * as fs from 'fs/promises'
import * as path from 'path'
import type { MacroChain } from '../../shared/types'
import { getDataPath } from '../utils/paths'

const CHAINS_DIR = 'chains'

export class ChainStorage {
  private get basePath(): string {
    return path.join(getDataPath(), CHAINS_DIR)
  }

  private async ensureDir(): Promise<void> {
    await fs.mkdir(this.basePath, { recursive: true })
  }

  private chainPath(id: string): string {
    return path.join(this.basePath, `${id}.json`)
  }

  async save(chain: MacroChain): Promise<void> {
    await this.ensureDir()
    const filePath = this.chainPath(chain.id)
    await fs.writeFile(filePath, JSON.stringify(chain, null, 2), 'utf-8')
  }

  async load(id: string): Promise<MacroChain | null> {
    try {
      const filePath = this.chainPath(id)
      const data = await fs.readFile(filePath, 'utf-8')
      return JSON.parse(data) as MacroChain
    } catch {
      return null
    }
  }

  async delete(id: string): Promise<boolean> {
    try {
      await fs.unlink(this.chainPath(id))
      return true
    } catch {
      return false
    }
  }

  async list(): Promise<MacroChain[]> {
    await this.ensureDir()
    const chains: MacroChain[] = []
    try {
      const entries = await fs.readdir(this.basePath, { withFileTypes: true })
      for (const entry of entries) {
        if (!entry.isFile() || !entry.name.endsWith('.json')) continue
        try {
          const data = await fs.readFile(path.join(this.basePath, entry.name), 'utf-8')
          chains.push(JSON.parse(data) as MacroChain)
        } catch {
          // Skip corrupt files
        }
      }
    } catch {
      // Directory empty or missing
    }
    return chains.sort(
      (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
    )
  }
}
