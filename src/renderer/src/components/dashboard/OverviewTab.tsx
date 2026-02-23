import { useEffect, useState } from 'react'
import { useAnalyticsStore } from '../../stores/analyticsStore'
import { useMacroStore } from '../../stores/macroStore'
import { BarChart } from './charts/BarChart'

function formatDuration(ms: number): string {
  if (ms < 1000) return `${Math.round(ms)}ms`
  if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`
  const minutes = Math.floor(ms / 60000)
  const seconds = Math.floor((ms % 60000) / 1000)
  if (minutes < 60) return `${minutes}m ${seconds}s`
  const hours = Math.floor(minutes / 60)
  return `${hours}h ${minutes % 60}m`
}

function getRecentDailyData(
  dailyCounts: Record<string, number>,
  days: number
): { label: string; value: number }[] {
  const result: { label: string; value: number }[] = []
  const today = new Date()
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(today)
    d.setDate(d.getDate() - i)
    const key = d.toISOString().slice(0, 10)
    const dayLabel = d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
    result.push({ label: dayLabel, value: dailyCounts[key] || 0 })
  }
  return result
}

export function OverviewTab(): JSX.Element {
  const aggregate = useAnalyticsStore((s) => s.aggregate)
  const loadAggregate = useAnalyticsStore((s) => s.loadAggregate)
  const macros = useMacroStore((s) => s.macros)

  useEffect(() => {
    loadAggregate()
  }, [loadAggregate])

  if (!aggregate || aggregate.totalPlayCount === 0) {
    return (
      <div
        style={{
          padding: 32,
          textAlign: 'center',
          color: 'var(--text-muted)',
          background: 'var(--bg-secondary)',
          borderRadius: 8,
          border: '1px solid var(--border-color)'
        }}
      >
        <div style={{ fontSize: 24, marginBottom: 8 }}>📊</div>
        <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 4 }}>No playback data yet</div>
        <div style={{ fontSize: 11 }}>Run a macro to start collecting analytics.</div>
      </div>
    )
  }

  // Compute overall success rate
  const totalRuns = Object.values(aggregate.macroSuccessRates).reduce(
    (sum, r) => sum + r.runs, 0
  )
  const fullSuccessRuns = Object.values(aggregate.macroSuccessRates).reduce(
    (sum, r) => sum + r.fullSuccess, 0
  )
  const successRate = totalRuns > 0 ? Math.round((fullSuccessRuns / totalRuns) * 100) : 100

  // Top macros by play count
  const topMacros = Object.entries(aggregate.macroPlayCounts)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5)

  // Map macro IDs to names
  const macroNameMap = new Map(macros.map((m) => [m.id, m.name]))

  // Daily usage chart data (last 14 days)
  const dailyData = getRecentDailyData(aggregate.dailyCounts, 14)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Stat cards row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10 }}>
        <OverviewStatCard label="Total Plays" value={String(aggregate.totalPlayCount)} color="var(--accent-cyan)" />
        <OverviewStatCard label="Time Saved" value={formatDuration(aggregate.totalTimeSavedMs)} color="#22c55e" />
        <OverviewStatCard label="Success Rate" value={`${successRate}%`} color={successRate >= 80 ? '#22c55e' : '#f59e0b'} />
        <OverviewStatCard label="Active Macros" value={String(Object.keys(aggregate.macroPlayCounts).length)} color="var(--accent-violet)" />
      </div>

      {/* Usage chart */}
      <div
        style={{
          background: 'var(--bg-secondary)',
          borderRadius: 8,
          border: '1px solid var(--border-color)',
          padding: 14
        }}
      >
        <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 10 }}>
          Usage — Last 14 Days
        </div>
        <BarChart data={dailyData} height={100} />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        {/* Top macros */}
        <div
          style={{
            background: 'var(--bg-secondary)',
            borderRadius: 8,
            border: '1px solid var(--border-color)',
            padding: 14
          }}
        >
          <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 10 }}>
            Most Used Macros
          </div>
          {topMacros.length === 0 ? (
            <div style={{ color: 'var(--text-muted)', fontSize: 11 }}>No data</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {topMacros.map(([macroId, count]) => {
                const maxCount = topMacros[0][1]
                const pct = (count / maxCount) * 100
                return (
                  <div key={macroId}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, marginBottom: 3 }}>
                      <span style={{ color: 'var(--text-primary)', fontWeight: 500 }}>
                        {macroNameMap.get(macroId) || macroId.slice(0, 8)}
                      </span>
                      <span style={{ color: 'var(--text-muted)', fontVariantNumeric: 'tabular-nums' }}>
                        {count} plays
                      </span>
                    </div>
                    <div style={{ height: 4, borderRadius: 2, background: 'var(--bg-primary)', overflow: 'hidden' }}>
                      <div
                        style={{
                          width: `${pct}%`,
                          height: '100%',
                          background: 'var(--accent-cyan)',
                          borderRadius: 2,
                          transition: 'width 0.3s ease'
                        }}
                      />
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Export & Reset */}
        <div
          style={{
            background: 'var(--bg-secondary)',
            borderRadius: 8,
            border: '1px solid var(--border-color)',
            padding: 14,
            display: 'flex',
            flexDirection: 'column',
            gap: 10
          }}
        >
          <div>
            <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-primary)' }}>
              Export Analytics
            </div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4, marginBottom: 6 }}>
              Download all playback data for external analysis.
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <ExportButton format="csv" />
              <ExportButton format="json" />
            </div>
          </div>

          <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: 10 }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-primary)' }}>
              Reset Analytics
            </div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4, marginBottom: 6 }}>
              Clear all playback history and statistics.
            </div>
            <ResetButton onReset={loadAggregate} />
          </div>
        </div>
      </div>
    </div>
  )
}

function OverviewStatCard({
  label,
  value,
  color
}: {
  label: string
  value: string
  color: string
}): JSX.Element {
  return (
    <div
      style={{
        padding: '12px 14px',
        background: 'var(--bg-secondary)',
        borderRadius: 8,
        border: '1px solid var(--border-color)'
      }}
    >
      <div style={{ fontSize: 10, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 0.5 }}>
        {label}
      </div>
      <div style={{ fontSize: 20, fontWeight: 700, color, marginTop: 4, fontVariantNumeric: 'tabular-nums' }}>
        {value}
      </div>
    </div>
  )
}

function ResetButton({ onReset }: { onReset: () => Promise<void> }): JSX.Element {
  const [confirming, setConfirming] = useState(false)

  const handleReset = async (): Promise<void> => {
    try {
      await window.api.clearAllLogs()
      await onReset()
      setConfirming(false)
    } catch (err) {
      console.error('Reset failed:', err)
    }
  }

  if (confirming) {
    return (
      <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
        <span style={{ fontSize: 11, color: '#ef4444', fontWeight: 500 }}>Are you sure?</span>
        <button
          onClick={handleReset}
          style={{
            padding: '5px 12px',
            border: '1px solid #ef4444',
            borderRadius: 6,
            background: 'rgba(239, 68, 68, 0.15)',
            color: '#ef4444',
            fontSize: 11,
            fontWeight: 600,
            cursor: 'pointer'
          }}
        >
          Confirm
        </button>
        <button
          onClick={() => setConfirming(false)}
          style={{
            padding: '5px 12px',
            border: '1px solid var(--border-color)',
            borderRadius: 6,
            background: 'var(--bg-primary)',
            color: 'var(--text-muted)',
            fontSize: 11,
            fontWeight: 500,
            cursor: 'pointer'
          }}
        >
          Cancel
        </button>
      </div>
    )
  }

  return (
    <button
      onClick={() => setConfirming(true)}
      style={{
        padding: '6px 14px',
        border: '1px solid var(--border-color)',
        borderRadius: 6,
        background: 'var(--bg-primary)',
        color: '#ef4444',
        fontSize: 11,
        fontWeight: 600,
        cursor: 'pointer',
        transition: 'border-color 0.15s'
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = '#ef4444'
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = 'var(--border-color)'
      }}
    >
      Clear All Data
    </button>
  )
}

function ExportButton({ format }: { format: 'csv' | 'json' }): JSX.Element {
  const handleExport = async (): Promise<void> => {
    try {
      await window.api.exportAnalytics(format)
    } catch (err) {
      console.error('Export failed:', err)
    }
  }

  return (
    <button
      onClick={handleExport}
      style={{
        padding: '6px 14px',
        border: '1px solid var(--border-color)',
        borderRadius: 6,
        background: 'var(--bg-primary)',
        color: 'var(--text-primary)',
        fontSize: 11,
        fontWeight: 600,
        cursor: 'pointer',
        transition: 'border-color 0.15s'
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = 'var(--accent-cyan)'
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = 'var(--border-color)'
      }}
    >
      {format.toUpperCase()}
    </button>
  )
}
