import { useEffect } from 'react'
import { useAnalyticsStore, computeDriftMetrics } from '../../stores/analyticsStore'
import { useMacroStore } from '../../stores/macroStore'
import type { PlaybackLogEntry, EventTimingEntry } from '../../../../shared/types'

function formatDate(ts: number): string {
  return new Date(ts).toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

export function PerformanceTab(): JSX.Element {
  const macros = useMacroStore((s) => s.macros)
  const aggregate = useAnalyticsStore((s) => s.aggregate)
  const selectedMacroId = useAnalyticsStore((s) => s.selectedMacroId)
  const macroLogs = useAnalyticsStore((s) => s.macroLogs)
  const selectedLogId = useAnalyticsStore((s) => s.selectedLogId)
  const selectMacro = useAnalyticsStore((s) => s.selectMacro)
  const selectLog = useAnalyticsStore((s) => s.selectLog)
  const loadAggregate = useAnalyticsStore((s) => s.loadAggregate)

  useEffect(() => {
    if (!aggregate) loadAggregate()
  }, [aggregate, loadAggregate])

  const playedMacroIds = aggregate ? Object.keys(aggregate.macroPlayCounts) : []
  const playableMacros = macros.filter((m) => playedMacroIds.includes(m.id))

  // Find selected log entry
  const selectedLog = macroLogs.find((l) => l.id === selectedLogId) || null
  const hasTimings = selectedLog?.eventTimings && selectedLog.eventTimings.length > 0

  if (playableMacros.length === 0) {
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
        <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 4 }}>No performance data yet</div>
        <div style={{ fontSize: 11 }}>Play a macro to start profiling timing accuracy.</div>
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      {/* Selectors */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
        <div>
          <label style={{ fontSize: 11, color: 'var(--text-muted)', display: 'block', marginBottom: 4, fontWeight: 600 }}>
            MACRO
          </label>
          <select
            value={selectedMacroId || ''}
            onChange={(e) => {
              selectMacro(e.target.value || null)
              selectLog(null)
            }}
            style={{
              width: '100%',
              padding: '8px 10px',
              borderRadius: 6,
              border: '1px solid var(--border-color)',
              background: 'var(--bg-primary)',
              color: 'var(--text-primary)',
              fontSize: 12
            }}
          >
            <option value="">— Select macro —</option>
            {playableMacros.map((m) => (
              <option key={m.id} value={m.id}>{m.name}</option>
            ))}
          </select>
        </div>
        <div>
          <label style={{ fontSize: 11, color: 'var(--text-muted)', display: 'block', marginBottom: 4, fontWeight: 600 }}>
            PLAYBACK RUN
          </label>
          <select
            value={selectedLogId || ''}
            onChange={(e) => selectLog(e.target.value || null)}
            disabled={macroLogs.length === 0}
            style={{
              width: '100%',
              padding: '8px 10px',
              borderRadius: 6,
              border: '1px solid var(--border-color)',
              background: 'var(--bg-primary)',
              color: 'var(--text-primary)',
              fontSize: 12,
              opacity: macroLogs.length === 0 ? 0.5 : 1
            }}
          >
            <option value="">— Select run —</option>
            {[...macroLogs].reverse().map((log) => (
              <option key={log.id} value={log.id}>
                {formatDate(log.startedAt)} — {log.successCount}✓ {log.failedCount > 0 ? `${log.failedCount}✗` : ''}
              </option>
            ))}
          </select>
        </div>
      </div>

      {selectedLog && hasTimings && (
        <>
          <DriftSummary log={selectedLog} />
          <DriftSparkline timings={selectedLog.eventTimings!} />
          <DriftHistogram timings={selectedLog.eventTimings!} />
        </>
      )}

      {selectedLog && !hasTimings && (
        <div
          style={{
            padding: 24,
            textAlign: 'center',
            color: 'var(--text-muted)',
            background: 'var(--bg-secondary)',
            borderRadius: 8,
            border: '1px solid var(--border-color)',
            fontSize: 12
          }}
        >
          No timing data available for this run. Timing data is collected starting from v1.6.
        </div>
      )}
    </div>
  )
}

function DriftSummary({ log }: { log: PlaybackLogEntry }): JSX.Element {
  const metrics = computeDriftMetrics(log.eventTimings || [])

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }}>
      <DriftStatCard label="Mean Drift" value={`${metrics.mean.toFixed(1)}ms`} />
      <DriftStatCard label="P95 Drift" value={`${metrics.p95.toFixed(1)}ms`} />
      <DriftStatCard label="Max Drift" value={`${metrics.max.toFixed(1)}ms`} />
      <DriftStatCard
        label="Accuracy"
        value={`${metrics.accuracyPct.toFixed(0)}%`}
        color={metrics.accuracyPct >= 90 ? '#22c55e' : metrics.accuracyPct >= 70 ? '#f59e0b' : '#ef4444'}
      />
    </div>
  )
}

function DriftStatCard({ label, value, color }: { label: string; value: string; color?: string }): JSX.Element {
  return (
    <div
      style={{
        padding: '10px 12px',
        background: 'var(--bg-secondary)',
        borderRadius: 8,
        border: '1px solid var(--border-color)'
      }}
    >
      <div style={{ fontSize: 9, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 0.5 }}>
        {label}
      </div>
      <div
        style={{
          fontSize: 16,
          fontWeight: 700,
          color: color || 'var(--text-primary)',
          marginTop: 3,
          fontVariantNumeric: 'tabular-nums'
        }}
      >
        {value}
      </div>
    </div>
  )
}

function DriftSparkline({ timings }: { timings: EventTimingEntry[] }): JSX.Element {
  // Skip first entry (always 0)
  const data = timings.slice(1)
  if (data.length === 0) return <></>

  const width = 600
  const height = 100
  const paddingY = 10

  const drifts = data.map((t) => t.driftMs)
  const maxAbs = Math.max(Math.max(...drifts.map(Math.abs)), 5) // min 5ms scale
  const yScale = (height - paddingY * 2) / (maxAbs * 2)
  const yCenter = height / 2

  const points = data
    .map((_, i) => {
      const x = (i / (data.length - 1)) * width
      const y = yCenter - drifts[i] * yScale
      return `${x},${y}`
    })
    .join(' ')

  return (
    <div
      style={{
        background: 'var(--bg-secondary)',
        borderRadius: 8,
        border: '1px solid var(--border-color)',
        padding: 14
      }}
    >
      <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 8 }}>
        Timing Drift per Event
      </div>
      <svg width="100%" height={height} viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none">
        {/* Zero line */}
        <line
          x1="0" y1={yCenter} x2={width} y2={yCenter}
          stroke="var(--text-muted)" strokeWidth="1" strokeDasharray="4 4" opacity="0.3"
        />
        {/* Acceptable drift band (-5ms to +5ms) */}
        <rect
          x="0" y={yCenter - 5 * yScale}
          width={width} height={10 * yScale}
          fill="#22c55e" opacity="0.05"
        />
        {/* Sparkline */}
        <polyline
          points={points}
          fill="none"
          stroke="var(--accent-cyan)"
          strokeWidth="1.5"
          vectorEffect="non-scaling-stroke"
        />
      </svg>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 9, color: 'var(--text-muted)', marginTop: 4 }}>
        <span>+{maxAbs.toFixed(0)}ms (late)</span>
        <span>Event index</span>
        <span>-{maxAbs.toFixed(0)}ms (early)</span>
      </div>
    </div>
  )
}

function DriftHistogram({ timings }: { timings: EventTimingEntry[] }): JSX.Element {
  const data = timings.slice(1)
  if (data.length === 0) return <></>

  const buckets = [
    { label: '<1ms', min: 0, max: 1, count: 0, color: '#22c55e' },
    { label: '1-5ms', min: 1, max: 5, count: 0, color: '#22c55e' },
    { label: '5-10ms', min: 5, max: 10, count: 0, color: '#f59e0b' },
    { label: '10-50ms', min: 10, max: 50, count: 0, color: '#f59e0b' },
    { label: '>50ms', min: 50, max: Infinity, count: 0, color: '#ef4444' }
  ]

  for (const t of data) {
    const abs = Math.abs(t.driftMs)
    for (const bucket of buckets) {
      if (abs >= bucket.min && abs < bucket.max) {
        bucket.count++
        break
      }
    }
  }

  const maxCount = Math.max(...buckets.map((b) => b.count), 1)

  return (
    <div
      style={{
        background: 'var(--bg-secondary)',
        borderRadius: 8,
        border: '1px solid var(--border-color)',
        padding: 14
      }}
    >
      <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 10 }}>
        Drift Distribution
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {buckets.map((bucket) => {
          const pct = (bucket.count / maxCount) * 100
          return (
            <div key={bucket.label} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 10, color: 'var(--text-muted)', width: 50, textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>
                {bucket.label}
              </span>
              <div style={{ flex: 1, height: 12, borderRadius: 3, background: 'var(--bg-primary)', overflow: 'hidden' }}>
                <div
                  style={{
                    width: `${Math.max(pct, bucket.count > 0 ? 2 : 0)}%`,
                    height: '100%',
                    background: bucket.color,
                    borderRadius: 3,
                    opacity: 0.7,
                    transition: 'width 0.3s ease'
                  }}
                />
              </div>
              <span style={{ fontSize: 10, color: 'var(--text-muted)', width: 30, fontVariantNumeric: 'tabular-nums' }}>
                {bucket.count}
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}
