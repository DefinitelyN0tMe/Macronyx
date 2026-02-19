import { useEditorStore } from '../../stores/editorStore'
import { useAppStore } from '../../stores/appStore'
import { Timeline } from './Timeline'
import { EventInspector } from './EventInspector'
import { MousePathPreview } from './MousePathPreview'
import '../../styles/timeline.css'

export function EditorView(): JSX.Element {
  const macro = useEditorStore((s) => s.macro)
  const undo = useEditorStore((s) => s.undo)
  const redo = useEditorStore((s) => s.redo)
  const saveMacro = useEditorStore((s) => s.saveMacro)
  const zoom = useEditorStore((s) => s.zoom)
  const setZoom = useEditorStore((s) => s.setZoom)
  const historyIndex = useEditorStore((s) => s.historyIndex)
  const history = useEditorStore((s) => s.history)
  const setActiveView = useAppStore((s) => s.setActiveView)

  if (!macro) {
    return (
      <div
        className="animate-slide-in"
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          height: '100%',
          gap: 16,
          color: 'var(--text-muted)'
        }}
      >
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <line x1="2" y1="6" x2="22" y2="6" />
          <line x1="2" y1="12" x2="22" y2="12" />
          <line x1="2" y1="18" x2="22" y2="18" />
          <circle cx="8" cy="6" r="2" fill="currentColor" />
          <circle cx="16" cy="12" r="2" fill="currentColor" />
          <circle cx="10" cy="18" r="2" fill="currentColor" />
        </svg>
        <p style={{ fontSize: 14 }}>No macro loaded</p>
        <p style={{ fontSize: 12 }}>Select a macro from the Library to edit it</p>
        <button
          onClick={() => setActiveView('library')}
          style={{
            padding: '8px 20px',
            borderRadius: 8,
            border: '1px solid var(--accent-cyan)',
            background: 'transparent',
            color: 'var(--accent-cyan)',
            cursor: 'pointer',
            fontSize: 13,
            fontWeight: 500
          }}
        >
          Open Library
        </button>
      </div>
    )
  }

  return (
    <div className="animate-slide-in" style={{ height: '100%', display: 'flex', flexDirection: 'column', gap: 12 }}>
      {/* Toolbar */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexShrink: 0
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <h2 style={{ fontSize: 16, fontWeight: 600 }}>{macro.name}</h2>
          <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
            {macro.events.length} events &middot; {(macro.duration / 1000).toFixed(1)}s
          </span>
        </div>
        <div style={{ display: 'flex', gap: 6 }}>
          <ToolbarBtn
            label="Undo"
            disabled={historyIndex <= 0}
            onClick={undo}
          />
          <ToolbarBtn
            label="Redo"
            disabled={historyIndex >= history.length - 1}
            onClick={redo}
          />
          <div style={{ width: 1, background: 'var(--border-color)', margin: '0 4px' }} />
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>Zoom</span>
            <input
              type="range"
              min={10}
              max={500}
              value={zoom}
              onChange={(e) => setZoom(Number(e.target.value))}
              style={{ width: 80, accentColor: 'var(--accent-cyan)' }}
            />
            <span style={{ fontSize: 11, color: 'var(--text-secondary)', width: 36, textAlign: 'right' }}>
              {zoom}px/s
            </span>
          </div>
          <div style={{ width: 1, background: 'var(--border-color)', margin: '0 4px' }} />
          <button
            onClick={saveMacro}
            style={{
              padding: '6px 14px',
              borderRadius: 6,
              border: 'none',
              background: 'var(--accent-cyan)',
              color: 'white',
              cursor: 'pointer',
              fontSize: 12,
              fontWeight: 600
            }}
          >
            Save
          </button>
        </div>
      </div>

      {/* Main content: Timeline + Inspector */}
      <div style={{ display: 'flex', flex: 1, gap: 12, minHeight: 0 }}>
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 12, minWidth: 0 }}>
          <Timeline />
          <MousePathPreview />
        </div>
        <EventInspector />
      </div>
    </div>
  )
}

function ToolbarBtn({
  label,
  disabled,
  onClick
}: {
  label: string
  disabled: boolean
  onClick: () => void
}): JSX.Element {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        padding: '6px 12px',
        borderRadius: 6,
        border: '1px solid var(--border-color)',
        background: disabled ? 'transparent' : 'var(--bg-secondary)',
        color: disabled ? 'var(--text-muted)' : 'var(--text-primary)',
        cursor: disabled ? 'not-allowed' : 'pointer',
        fontSize: 12,
        fontWeight: 500,
        opacity: disabled ? 0.5 : 1
      }}
    >
      {label}
    </button>
  )
}
