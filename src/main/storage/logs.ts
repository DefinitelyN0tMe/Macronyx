import * as fs from 'fs/promises'
import * as path from 'path'
import type { PlaybackLogEntry, AnalyticsAggregate } from '../../shared/types'
import { getDataPath } from '../utils/paths'

const LOGS_DIR = 'logs'
const AGGREGATE_FILE = '_aggregate.json'
const MAX_ENTRIES_PER_MACRO = 500

function emptyAggregate(): AnalyticsAggregate {
  return {
    totalPlayCount: 0,
    totalTimeSavedMs: 0,
    dailyCounts: {},
    macroPlayCounts: {},
    macroSuccessRates: {},
    lastUpdated: Date.now()
  }
}

export class LogStorage {
  private get basePath(): string {
    return path.join(getDataPath(), LOGS_DIR)
  }

  private async ensureDir(): Promise<void> {
    await fs.mkdir(this.basePath, { recursive: true })
  }

  private macroLogPath(macroId: string): string {
    return path.join(this.basePath, `${macroId}.json`)
  }

  private get aggregatePath(): string {
    return path.join(this.basePath, AGGREGATE_FILE)
  }

  /** Write JSON atomically: write to .tmp then rename */
  private async writeAtomic(filePath: string, data: unknown): Promise<void> {
    const tmpPath = filePath + '.tmp'
    await fs.writeFile(tmpPath, JSON.stringify(data, null, 2), 'utf-8')
    await fs.rename(tmpPath, filePath)
  }

  // ─── Core Methods ───────────────────────────────────────────────────

  async appendLog(entry: PlaybackLogEntry): Promise<void> {
    await this.ensureDir()

    // 1. Append to per-macro log file
    const logPath = this.macroLogPath(entry.macroId)
    let logs: PlaybackLogEntry[] = []
    try {
      const data = await fs.readFile(logPath, 'utf-8')
      logs = JSON.parse(data) as PlaybackLogEntry[]
    } catch {
      // File doesn't exist yet
    }

    logs.push(entry)

    // Cap at MAX_ENTRIES_PER_MACRO (evict oldest first)
    if (logs.length > MAX_ENTRIES_PER_MACRO) {
      logs = logs.slice(logs.length - MAX_ENTRIES_PER_MACRO)
    }

    await this.writeAtomic(logPath, logs)

    // 2. Update aggregate
    await this.updateAggregate(entry)
  }

  private async updateAggregate(entry: PlaybackLogEntry): Promise<void> {
    const agg = await this.getAggregate()

    agg.totalPlayCount++
    agg.totalTimeSavedMs += entry.durationMs

    // Daily count
    const day = new Date(entry.startedAt).toISOString().slice(0, 10) // "YYYY-MM-DD"
    agg.dailyCounts[day] = (agg.dailyCounts[day] || 0) + 1

    // Per-macro play count
    agg.macroPlayCounts[entry.macroId] = (agg.macroPlayCounts[entry.macroId] || 0) + 1

    // Per-macro success rate
    if (!agg.macroSuccessRates[entry.macroId]) {
      agg.macroSuccessRates[entry.macroId] = { runs: 0, fullSuccess: 0 }
    }
    agg.macroSuccessRates[entry.macroId].runs++
    if (entry.failedCount === 0) {
      agg.macroSuccessRates[entry.macroId].fullSuccess++
    }

    agg.lastUpdated = Date.now()

    await this.writeAtomic(this.aggregatePath, agg)
  }

  async getLogsForMacro(macroId: string): Promise<PlaybackLogEntry[]> {
    try {
      const data = await fs.readFile(this.macroLogPath(macroId), 'utf-8')
      return JSON.parse(data) as PlaybackLogEntry[]
    } catch {
      return []
    }
  }

  async getAggregate(): Promise<AnalyticsAggregate> {
    try {
      const data = await fs.readFile(this.aggregatePath, 'utf-8')
      return JSON.parse(data) as AnalyticsAggregate
    } catch {
      return emptyAggregate()
    }
  }

  async clearLogsForMacro(macroId: string): Promise<void> {
    try {
      await fs.unlink(this.macroLogPath(macroId))
    } catch {
      // File doesn't exist
    }
    // Rebuild aggregate without this macro
    await this.rebuildAggregate()
  }

  async clearAll(): Promise<void> {
    await this.ensureDir()
    try {
      const entries = await fs.readdir(this.basePath, { withFileTypes: true })
      for (const entry of entries) {
        if (entry.isFile() && entry.name.endsWith('.json')) {
          await fs.unlink(path.join(this.basePath, entry.name))
        }
      }
    } catch {
      // Directory might not exist
    }
  }

  // ─── Export ─────────────────────────────────────────────────────────

  async exportAsJSON(): Promise<string> {
    const allLogs = await this.getAllLogs()
    return JSON.stringify(allLogs, null, 2)
  }

  async exportAsCSV(): Promise<string> {
    const allLogs = await this.getAllLogs()
    const header =
      'id,macroId,macroName,startedAt,finishedAt,durationMs,totalEvents,successCount,failedCount,skippedCount,trigger,meanDriftMs'
    const rows = allLogs.map((entry) => {
      const meanDrift = this.computeMeanDrift(entry)
      // Escape commas/quotes in macroName
      const safeName = `"${entry.macroName.replace(/"/g, '""')}"`
      return [
        entry.id,
        entry.macroId,
        safeName,
        entry.startedAt,
        entry.finishedAt,
        entry.durationMs,
        entry.totalEvents,
        entry.successCount,
        entry.failedCount,
        entry.skippedCount,
        entry.trigger,
        meanDrift.toFixed(2)
      ].join(',')
    })
    return [header, ...rows].join('\n')
  }

  // ─── Helpers ────────────────────────────────────────────────────────

  private async getAllLogs(): Promise<PlaybackLogEntry[]> {
    await this.ensureDir()
    const allLogs: PlaybackLogEntry[] = []
    try {
      const entries = await fs.readdir(this.basePath, { withFileTypes: true })
      for (const entry of entries) {
        if (!entry.isFile() || !entry.name.endsWith('.json') || entry.name === AGGREGATE_FILE) {
          continue
        }
        try {
          const data = await fs.readFile(path.join(this.basePath, entry.name), 'utf-8')
          const logs = JSON.parse(data) as PlaybackLogEntry[]
          allLogs.push(...logs)
        } catch {
          // Skip corrupt files
        }
      }
    } catch {
      // Directory empty or missing
    }
    return allLogs.sort((a, b) => b.startedAt - a.startedAt)
  }

  private computeMeanDrift(entry: PlaybackLogEntry): number {
    if (!entry.eventTimings || entry.eventTimings.length === 0) return 0
    const sum = entry.eventTimings.reduce((acc, t) => acc + Math.abs(t.driftMs), 0)
    return sum / entry.eventTimings.length
  }

  private async rebuildAggregate(): Promise<void> {
    const allLogs = await this.getAllLogs()
    const agg = emptyAggregate()

    for (const entry of allLogs) {
      agg.totalPlayCount++
      agg.totalTimeSavedMs += entry.durationMs

      const day = new Date(entry.startedAt).toISOString().slice(0, 10)
      agg.dailyCounts[day] = (agg.dailyCounts[day] || 0) + 1

      agg.macroPlayCounts[entry.macroId] = (agg.macroPlayCounts[entry.macroId] || 0) + 1

      if (!agg.macroSuccessRates[entry.macroId]) {
        agg.macroSuccessRates[entry.macroId] = { runs: 0, fullSuccess: 0 }
      }
      agg.macroSuccessRates[entry.macroId].runs++
      if (entry.failedCount === 0) {
        agg.macroSuccessRates[entry.macroId].fullSuccess++
      }
    }

    agg.lastUpdated = Date.now()
    await this.ensureDir()
    await this.writeAtomic(this.aggregatePath, agg)
  }
}
