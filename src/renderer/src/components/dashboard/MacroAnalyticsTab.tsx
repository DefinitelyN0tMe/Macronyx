import { useEffect } from 'react'
import { useAnalyticsStore } from '../../stores/analyticsStore'
import { useMacroStore } from '../../stores/macroStore'
import { DonutChart } from './charts/DonutChart'

function formatDuration(ms: number): string {
  if (ms < 1000) return `${Math.round(ms)}ms`
  if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`
  const minutes = Math.floor(ms / 60000)
  const seconds = Math.floor((ms % 60000) / 1000)
  return `${minutes}m ${seconds}s`
}

function formatDate(ts: number): string {
  return new Date(ts).toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

export function MacroAnalyticsTab(): JSX.Element {
  const macros = useMacroStore((s) => s.macros)
  const selectedMacroId = useAnalyticsStore((s) => s.selectedMacroId)
  const macroLogs = useAnalyticsStore((s) => s.macroLogs)
  const selectMacro = useAnalyticsStore((s) => s.selectMacro)
  const aggregate = useAnalyticsStore((s) => s.aggregate)
  const loadAggregate = useAnalyticsStore((s) => s.loadAggregate)

  useEffect(() => {
    if (!aggregate) loadAggregate()
  }, [aggregate, loadAggregate])

  // Find macros that have been played (have log entries)
  const playedMacroIds = aggregate ? Object.keys(aggregate.macroPlayCounts) : []
  const playableMacros = macros.filter((m) => playedMacroIds.includes(m.id))

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
        <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 4 }}>No macro analytics yet</div>
        <div style={{ fontSize: 11 }}>Play a macro to see per-macro analytics here.</div>
      </div>
    )
  }

  const selectedMacro = macros.find((m) => m.id === selectedMacroId)
  const macroStats = selectedMacroId && aggregate?.macroSuccessRates[selectedMacroId]
  const macroPlayCount = selectedMacroId ? (aggregate?.macroPlayCounts[selectedMacroId] || 0) : 0
  const successRate = macroStats && macroStats.runs > 0
    ? (macroStats.fullSuccess / macroStats.runs) * 100
    : 100

  const avgDuration = macroLogs.length > 0
    ? macroLogs.reduce((sum, l) => sum + l.durationMs, 0) / macroLogs.length
    : 0

  const lastRun = macroLogs.length > 0 ? macroLogs[macroLogs.length - 1] : null

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      {/* Macro selector */}
      <div>
        <label style={{ fontSize: 11, color: 'var(--text-muted)', display: 'block', marginBottom: 4, fontWeight: 600 }}>
          SELECT MACRO
        </label>
        <select
          value={selectedMacroId || ''}
          onChange={(e) => selectMacro(e.target.value || null)}
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
          <option value="">— Choose a macro —</option>
          {playableMacros.map((m) => (
            <option key={m.id} value={m.id}>
              {m.name} ({aggregate?.macroPlayCounts[m.id] || 0} plays)
            </option>
          ))}
        </select>
      </div>

      {selectedMacroId && (
        <>
          {/* Stats + Donut */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 14, alignItems: 'start' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              <MacroStatCard label="Play Count" value={String(macroPlayCount)} />
              <MacroStatCard label="Avg Duration" value={formatDuration(avgDuration)} />
              <MacroStatCard label="Success Rate" value={`${Math.round(successRate)}%`} />
              <MacroStatCard label="Last Run" value={lastRun ? formatDate(lastRun.startedAt) : '—'} />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '8px 0' }}>
              <DonutChart value={successRate} label="success" />
            </div>
          </div>

          {/* Run history */}
          <div
            style={{
              background: 'var(--bg-secondary)',
              borderRadius: 8,
              border: '1px solid var(--border-color)',
              padding: 14
            }}
          >
            <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 10 }}>
              Run History{selectedMacro ? ` — ${selectedMacro.name}` : ''}
            </div>
            {macroLogs.length === 0 ? (
              <div style={{ color: 'var(--text-muted)', fontSize: 11 }}>No runs recorded.</div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4, maxHeight: 240, overflowY: 'auto' }}>
                {[...macroLogs].reverse().map((log) => {
                  const allSuccess = log.failedCount === 0
                  return (
                    <div
                      key={log.id}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 10,
                        padding: '6px 10px',
                        borderRadius: 6,
                        background: 'var(--bg-primary)',
                        fontSize: 11
                      }}
                    >
                      <span style={{ color: allSuccess ? '#22c55e' : '#ef4444', fontSize: 12 }}>
                        {allSuccess ? '✓' : '✗'}
                      </span>
                      <span style={{ color: 'var(--text-muted)', fontVariantNumeric: 'tabular-nums', minWidth: 100 }}>
                        {formatDate(log.startedAt)}
                      </span>
                      <span style={{ color: 'var(--text-primary)', fontVariantNumeric: 'tabular-nums' }}>
                        {formatDuration(log.durationMs)}
                      </span>
                      <span style={{ color: '#22c55e', fontVariantNumeric: 'tabular-nums' }}>
                        {log.successCount}✓
                      </span>
                      {log.failedCount > 0 && (
                        <span style={{ color: '#ef4444', fontVariantNumeric: 'tabular-nums' }}>
                          {log.failedCount}✗
                        </span>
                      )}
                      <span
                        style={{
                          marginLeft: 'auto',
                          padding: '1px 6px',
                          borderRadius: 3,
                          background: 'rgba(6,182,212,0.1)',
                          color: 'var(--accent-cyan)',
                          fontSize: 9,
                          fontWeight: 600
                        }}
                      >
                        {log.trigger}
                      </span>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )
}

function MacroStatCard({ label, value }: { label: string; value: string }): JSX.Element {
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
      <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)', marginTop: 3, fontVariantNumeric: 'tabular-nums' }}>
        {value}
      </div>
    </div>
  )
}
