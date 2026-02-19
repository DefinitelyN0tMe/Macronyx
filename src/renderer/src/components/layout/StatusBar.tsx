import { useAppStore } from '../../stores/appStore'
import { useSettingsStore } from '../../stores/settingsStore'
import { formatHotkey } from '../../hooks/useHotkey'

export function StatusBar(): JSX.Element {
  const status = useAppStore((s) => s.status)
  const settings = useSettingsStore((s) => s.settings)

  const statusTexts: Record<string, string> = {
    idle: 'Ready',
    recording: 'Recording in progress...',
    playing: 'Macro playback active',
    paused: 'Playback paused'
  }

  return (
    <div
      style={{
        height: 24,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 12px',
        background: '#0a0e17',
        borderTop: '1px solid var(--border-subtle)',
        fontSize: 11,
        color: 'var(--text-muted)',
        flexShrink: 0
      }}
    >
      <span>{statusTexts[status]}</span>
      <div style={{ display: 'flex', gap: 12 }}>
        <span>Record: {formatHotkey(settings.hotkeys.recordStart)}</span>
        <span>Play: {formatHotkey(settings.hotkeys.playStart)}</span>
        <span>Stop: {formatHotkey(settings.hotkeys.emergencyStop)}</span>
      </div>
    </div>
  )
}
