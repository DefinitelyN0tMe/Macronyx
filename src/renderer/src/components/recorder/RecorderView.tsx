import { useRecording } from '../../hooks/useRecording'
import { useSettingsStore } from '../../stores/settingsStore'
import { formatTime } from '../../utils/formatTime'
import { formatNumber } from '../../utils/formatTime'

export function RecorderView(): JSX.Element {
  const {
    isRecording,
    isPaused,
    eventCount,
    elapsedMs,
    startRecording,
    stopRecording,
    pauseRecording,
    resumeRecording
  } = useRecording()
  const settings = useSettingsStore((s) => s.settings)
  const updateSettings = useSettingsStore((s) => s.updateSettings)
  const hotkeys = settings.hotkeys

  return (
    <div
      className="animate-slide-in"
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100%',
        gap: 24
      }}
    >
      <h2 style={{ fontSize: 18, fontWeight: 600, color: 'var(--text-primary)' }}>
        {isRecording ? (isPaused ? 'Recording Paused' : 'Recording in Progress') : 'Ready to Record'}
      </h2>

      {/* Record / Stop Button */}
      <button
        tabIndex={-1}
        onClick={isRecording ? stopRecording : startRecording}
        onKeyDown={(e) => { if (e.key === ' ') e.preventDefault() }}
        style={{
          width: 120,
          height: 120,
          borderRadius: '50%',
          border: `3px solid ${isRecording ? (isPaused ? '#f59e0b' : '#f87171') : '#374151'}`,
          background: isRecording
            ? isPaused
              ? 'radial-gradient(circle, #f59e0b 0%, #92400e 100%)'
              : 'radial-gradient(circle, #ef4444 0%, #991b1b 100%)'
            : 'radial-gradient(circle, #dc2626 0%, #7f1d1d 100%)',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          transition: 'all 0.2s ease',
          animation: isRecording && !isPaused ? 'pulse-glow 1.5s infinite' : 'none',
          boxShadow: isRecording
            ? isPaused
              ? '0 0 20px rgba(245,158,11,0.3)'
              : '0 0 30px rgba(239,68,68,0.4)'
            : '0 4px 12px rgba(0,0,0,0.3)'
        }}
      >
        {isRecording ? (
          <div style={{ width: 36, height: 36, borderRadius: 6, background: 'white' }} />
        ) : (
          <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'white' }} />
        )}
      </button>

      {/* Pause / Resume controls (shown only while recording) */}
      {isRecording && (
        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <button
            tabIndex={-1}
            onClick={isPaused ? resumeRecording : pauseRecording}
            onKeyDown={(e) => { if (e.key === ' ') e.preventDefault() }}
            title={isPaused ? 'Resume recording' : 'Pause recording'}
            style={{
              width: 44,
              height: 44,
              borderRadius: '50%',
              border: `2px solid ${isPaused ? '#22c55e' : '#f59e0b'}`,
              background: isPaused
                ? 'radial-gradient(circle, #22c55e 0%, #166534 100%)'
                : 'radial-gradient(circle, #f59e0b 0%, #92400e 100%)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.2s ease',
              boxShadow: `0 2px 8px ${isPaused ? 'rgba(34,197,94,0.3)' : 'rgba(245,158,11,0.3)'}`
            }}
          >
            {isPaused ? (
              /* Play / Resume triangle */
              <svg width="18" height="18" viewBox="0 0 24 24" fill="white" style={{ marginLeft: 2 }}>
                <polygon points="6,3 20,12 6,21" />
              </svg>
            ) : (
              /* Pause bars */
              <svg width="16" height="16" viewBox="0 0 24 24" fill="white">
                <rect x="5" y="3" width="5" height="18" rx="1" />
                <rect x="14" y="3" width="5" height="18" rx="1" />
              </svg>
            )}
          </button>
          <span style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 500 }}>
            {isPaused ? 'Resume' : 'Pause'}
          </span>
        </div>
      )}

      <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
        {isRecording
          ? isPaused
            ? `Paused — press ${hotkeys.recordStop} to stop`
            : `Click or press ${hotkeys.recordStop} to stop recording`
          : `Click or press ${hotkeys.recordStart} to start recording`}
      </div>

      {/* Timer & Stats */}
      <div style={{ display: 'flex', gap: 32, alignItems: 'center' }}>
        <div style={{ textAlign: 'center' }}>
          <div
            style={{
              fontSize: 36,
              fontWeight: 700,
              fontFamily: 'monospace',
              color: isRecording ? (isPaused ? '#f59e0b' : 'var(--danger)') : 'var(--text-primary)',
              letterSpacing: 2
            }}
          >
            {formatTime(elapsedMs)}
          </div>
          <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 4 }}>ELAPSED</div>
        </div>
        <div
          style={{
            width: 1,
            height: 40,
            background: 'var(--border-color)'
          }}
        />
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 36, fontWeight: 700, fontFamily: 'monospace', color: 'var(--accent-cyan)' }}>
            {formatNumber(eventCount)}
          </div>
          <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 4 }}>EVENTS</div>
        </div>
      </div>

      {/* Hotkey Info */}
      <HotkeyInfoBar hotkeys={hotkeys} isRecording={isRecording} />

      {/* Recording Options */}
      <div
        style={{
          padding: 16,
          background: 'var(--bg-secondary)',
          borderRadius: 10,
          border: '1px solid var(--border-color)',
          width: '100%',
          maxWidth: 400
        }}
      >
        <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 12, color: 'var(--text-secondary)' }}>
          Capture Options
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <ToggleOption
            label="Mouse Movement"
            checked={settings.recording.captureMouseMovement}
            onChange={(v) =>
              updateSettings({ recording: { ...settings.recording, captureMouseMovement: v } })
            }
          />
          <ToggleOption
            label="Mouse Clicks"
            checked={settings.recording.captureMouseClicks}
            onChange={(v) =>
              updateSettings({ recording: { ...settings.recording, captureMouseClicks: v } })
            }
          />
          <ToggleOption
            label="Mouse Scroll"
            checked={settings.recording.captureMouseScroll}
            onChange={(v) =>
              updateSettings({ recording: { ...settings.recording, captureMouseScroll: v } })
            }
          />
          <ToggleOption
            label="Keyboard"
            checked={settings.recording.captureKeyboard}
            onChange={(v) =>
              updateSettings({ recording: { ...settings.recording, captureKeyboard: v } })
            }
          />
        </div>
      </div>
    </div>
  )
}

function HotkeyInfoBar({
  hotkeys,
  isRecording
}: {
  hotkeys: { recordStart: string; recordStop: string; playStart: string; playStop: string; emergencyStop: string }
  isRecording: boolean
}): JSX.Element {
  return (
    <div
      style={{
        display: 'flex',
        gap: 12,
        flexWrap: 'wrap',
        justifyContent: 'center',
        padding: '10px 16px',
        background: 'var(--bg-secondary)',
        borderRadius: 8,
        border: '1px solid var(--border-subtle)',
        maxWidth: 420,
        width: '100%'
      }}
    >
      <HotkeyBadge
        label="Start"
        hotkey={hotkeys.recordStart}
        active={!isRecording}
      />
      <HotkeyBadge
        label="Stop"
        hotkey={hotkeys.recordStop}
        active={isRecording}
      />
      <HotkeyBadge
        label="Emergency"
        hotkey={hotkeys.emergencyStop}
        color="var(--danger)"
        active={isRecording}
      />
    </div>
  )
}

function HotkeyBadge({
  label,
  hotkey,
  color,
  active
}: {
  label: string
  hotkey: string
  color?: string
  active?: boolean
}): JSX.Element {
  const c = color || 'var(--accent-cyan)'
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 6,
        opacity: active ? 1 : 0.4,
        transition: 'opacity 0.2s'
      }}
    >
      <span style={{ fontSize: 10, color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>
        {label}
      </span>
      <kbd
        style={{
          padding: '2px 8px',
          borderRadius: 4,
          background: `${c}15`,
          border: `1px solid ${c}40`,
          color: c,
          fontSize: 11,
          fontFamily: 'monospace',
          fontWeight: 600,
          letterSpacing: 0.5
        }}
      >
        {hotkey}
      </kbd>
    </div>
  )
}

function ToggleOption({
  label,
  checked,
  onChange
}: {
  label: string
  checked: boolean
  onChange: (val: boolean) => void
}): JSX.Element {
  return (
    <label
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        cursor: 'pointer',
        padding: '4px 0'
      }}
    >
      <span style={{ fontSize: 12, color: 'var(--text-primary)' }}>{label}</span>
      <button
        onClick={(e) => {
          e.preventDefault()
          onChange(!checked)
        }}
        style={{
          width: 36,
          height: 20,
          borderRadius: 10,
          border: 'none',
          background: checked ? 'var(--accent-cyan)' : '#374151',
          cursor: 'pointer',
          position: 'relative',
          transition: 'background 0.2s'
        }}
      >
        <div
          style={{
            width: 16,
            height: 16,
            borderRadius: '50%',
            background: 'white',
            position: 'absolute',
            top: 2,
            left: checked ? 18 : 2,
            transition: 'left 0.2s'
          }}
        />
      </button>
    </label>
  )
}
