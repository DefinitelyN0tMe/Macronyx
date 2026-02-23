import { useEditorStore } from '../../stores/editorStore'

export function PlaybackResultsPanel(): JSX.Element | null {
  const playbackReport = useEditorStore((s) => s.playbackReport)
  const clearPlaybackResults = useEditorStore((s) => s.clearPlaybackResults)

  if (!playbackReport) return null

  const duration = playbackReport.finishedAt - playbackReport.startedAt
  const durationSec = (duration / 1000).toFixed(1)
  const allSuccess = playbackReport.failedCount === 0

  return (
    <div
      style={{
        background: 'var(--bg-secondary)',
        borderRadius: 8,
        border: `1px solid ${allSuccess ? 'rgba(34, 197, 94, 0.3)' : 'rgba(239, 68, 68, 0.3)'}`,
        padding: '10px 14px',
        flexShrink: 0,
        display: 'flex',
        alignItems: 'center',
        gap: 12
      }}
    >
      {/* Status icon */}
      <div
        style={{
          width: 28,
          height: 28,
          borderRadius: '50%',
          background: allSuccess ? 'rgba(34, 197, 94, 0.15)' : 'rgba(239, 68, 68, 0.15)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0
        }}
      >
        <span style={{ fontSize: 14 }}>
          {allSuccess ? '\u2713' : '\u2717'}
        </span>
      </div>

      {/* Stats */}
      <div style={{ flex: 1, display: 'flex', gap: 16, alignItems: 'center', flexWrap: 'wrap' }}>
        <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-primary)' }}>
          Playback Complete
        </div>
        <div style={{ display: 'flex', gap: 10, fontSize: 11 }}>
          <span style={{ color: '#22c55e' }}>
            {playbackReport.successCount} passed
          </span>
          {playbackReport.failedCount > 0 && (
            <span style={{ color: '#ef4444' }}>
              {playbackReport.failedCount} failed
            </span>
          )}
          {playbackReport.skippedCount > 0 && (
            <span style={{ color: '#6b7280' }}>
              {playbackReport.skippedCount} skipped
            </span>
          )}
          <span style={{ color: 'var(--text-muted)' }}>
            {durationSec}s
          </span>
        </div>
      </div>

      {/* Dismiss */}
      <button
        onClick={clearPlaybackResults}
        title="Dismiss"
        style={{
          border: 'none',
          background: 'transparent',
          color: 'var(--text-muted)',
          cursor: 'pointer',
          fontSize: 16,
          padding: '2px 6px',
          borderRadius: 4,
          lineHeight: 1
        }}
      >
        &times;
      </button>
    </div>
  )
}
