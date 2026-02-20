import { useState } from 'react'
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
  const renameMacro = useEditorStore((s) => s.renameMacro)
  const updateMacroDescription = useEditorStore((s) => s.updateMacroDescription)
  const zoom = useEditorStore((s) => s.zoom)
  const setZoom = useEditorStore((s) => s.setZoom)
  const historyIndex = useEditorStore((s) => s.historyIndex)
  const history = useEditorStore((s) => s.history)
  const setActiveView = useAppStore((s) => s.setActiveView)

  const [isEditingName, setIsEditingName] = useState(false)
  const [editName, setEditName] = useState('')
  const [isEditingDesc, setIsEditingDesc] = useState(false)
  const [editDesc, setEditDesc] = useState('')

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

  const startEditingName = (): void => {
    setEditName(macro.name)
    setIsEditingName(true)
  }

  const commitName = (): void => {
    const trimmed = editName.trim()
    if (trimmed && trimmed !== macro.name) {
      renameMacro(trimmed)
    }
    setIsEditingName(false)
  }

  const startEditingDesc = (): void => {
    setEditDesc(macro.description)
    setIsEditingDesc(true)
  }

  const commitDesc = (): void => {
    if (editDesc !== macro.description) {
      updateMacroDescription(editDesc)
    }
    setIsEditingDesc(false)
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
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0, flex: 1 }}>
          {isEditingName ? (
            <input
              autoFocus
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              onBlur={commitName}
              onKeyDown={(e) => {
                if (e.key === 'Enter') commitName()
                if (e.key === 'Escape') setIsEditingName(false)
              }}
              style={{
                fontSize: 16,
                fontWeight: 600,
                background: 'var(--bg-tertiary)',
                border: '1px solid var(--accent-cyan)',
                borderRadius: 6,
                color: 'var(--text-primary)',
                padding: '2px 8px',
                outline: 'none',
                minWidth: 120,
                maxWidth: 300
              }}
            />
          ) : (
            <h2
              onClick={startEditingName}
              title="Click to rename"
              style={{
                fontSize: 16,
                fontWeight: 600,
                cursor: 'pointer',
                padding: '2px 8px',
                borderRadius: 6,
                border: '1px solid transparent',
                transition: 'border-color 0.15s',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = 'var(--border-color)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = 'transparent'
              }}
            >
              {macro.name}
            </h2>
          )}
          {isEditingDesc ? (
            <input
              autoFocus
              value={editDesc}
              onChange={(e) => setEditDesc(e.target.value)}
              onBlur={commitDesc}
              onKeyDown={(e) => {
                if (e.key === 'Enter') commitDesc()
                if (e.key === 'Escape') setIsEditingDesc(false)
              }}
              placeholder="Add description..."
              style={{
                fontSize: 11,
                background: 'var(--bg-tertiary)',
                border: '1px solid var(--accent-violet)',
                borderRadius: 4,
                color: 'var(--text-secondary)',
                padding: '2px 6px',
                outline: 'none',
                minWidth: 100,
                maxWidth: 200
              }}
            />
          ) : (
            <span
              onClick={startEditingDesc}
              title="Click to edit description"
              style={{
                fontSize: 11,
                color: macro.description ? 'var(--text-muted)' : 'var(--text-muted)',
                cursor: 'pointer',
                opacity: macro.description ? 1 : 0.5,
                padding: '2px 4px',
                borderRadius: 4,
                border: '1px solid transparent',
                transition: 'border-color 0.15s'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = 'var(--border-color)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = 'transparent'
              }}
            >
              {macro.description || '+ description'}
            </span>
          )}
          <span style={{ fontSize: 11, color: 'var(--text-muted)', flexShrink: 0 }}>
            {macro.events.length} events &middot; {(macro.duration / 1000).toFixed(1)}s
          </span>
        </div>
        <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
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
