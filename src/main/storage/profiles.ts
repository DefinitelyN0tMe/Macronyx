import * as fs from 'fs/promises'
import * as path from 'path'
import type { Profile } from '../../shared/types'
import { getDataPath } from '../utils/paths'

const PROFILES_FILE = 'profiles.json'

export class ProfileStorage {
  private get filePath(): string {
    return path.join(getDataPath(), PROFILES_FILE)
  }

  async list(): Promise<Profile[]> {
    try {
      const data = await fs.readFile(this.filePath, 'utf-8')
      return JSON.parse(data) as Profile[]
    } catch {
      return []
    }
  }

  async save(profile: Profile): Promise<void> {
    const profiles = await this.list()
    const idx = profiles.findIndex((p) => p.id === profile.id)
    if (idx >= 0) {
      profiles[idx] = profile
    } else {
      profiles.push(profile)
    }
    await fs.mkdir(path.dirname(this.filePath), { recursive: true })
    await fs.writeFile(this.filePath, JSON.stringify(profiles, null, 2), 'utf-8')
  }

  async delete(id: string): Promise<void> {
    const profiles = await this.list()
    const filtered = profiles.filter((p) => p.id !== id)
    await fs.writeFile(this.filePath, JSON.stringify(filtered, null, 2), 'utf-8')
  }

  async activate(id: string): Promise<Profile | null> {
    const profiles = await this.list()
    let activated: Profile | null = null
    for (const p of profiles) {
      p.isActive = p.id === id
      if (p.isActive) activated = p
    }
    await fs.writeFile(this.filePath, JSON.stringify(profiles, null, 2), 'utf-8')
    return activated
  }
}
