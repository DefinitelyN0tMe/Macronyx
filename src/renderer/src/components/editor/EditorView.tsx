import { useState, useCallback, useEffect, useRef } from 'react'
import { useEditorStore } from '../../stores/editorStore'
import { useAppStore } from '../../stores/appStore'
import { useMacroStore } from '../../stores/macroStore'
import { useSettingsStore } from '../../stores/settingsStore'
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
  const smoothDelays = useEditorStore((s) => s.smoothDelays)
  const zoom = useEditorStore((s) => s.zoom)
  const setZoom = useEditorStore((s) => s.setZoom)
  const isDirty = useEditorStore((s) => s.isDirty)
  const historyIndex = useEditorStore((s) => s.historyIndex)
  const history = useEditorStore((s) => s.history)
  const setActiveView = useAppStore((s) => s.setActiveView)
  const status = useAppStore((s) => s.status)
  const loadMacros = useMacroStore((s) => s.loadMacros)
  const settings = useSettingsStore((s) => s.settings)
  const hotkeys = settings.hotkeys

  const [isEditingName, setIsEditingName] = useState(false)
  const [editName, setEditName] = useState('')
  const [isEditingDesc, setIsEditingDesc] = useState(false)
  const [editDesc, setEditDesc] = useState('')
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle')
  const [showSmoothPopover, setShowSmoothPopover] = useState(false)
  const [smoothWindowSize, setSmoothWindowSize] = useState(5)
  const [smoothMinDelay, setSmoothMinDelay] = useState(10)
  const [smoothMaxDelay, setSmoothMaxDelay] = useState(2000)

  const handleSave = useCallback(async () => {
    setSaveStatus('saving')
    await saveMacro()
    await loadMacros()
    setSaveStatus('saved')
    setTimeout(() => setSaveStatus('idle'), 2000)
  }, [saveMacro, loadMacros])

  const handlePlay = useCallback(async () => {
    if (!macro) return
    await window.api.startPlayback(macro.id)
  }, [macro])

  const handleStop = useCallback(async () => {
    await window.api.stopPlayback()
  }, [])

  // Auto-save every 60s when dirty (respects settings toggle)
  const autoSaveTimerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  useEffect(() => {
    autoSaveTimerRef.current = setInterval(async () => {
      const autoSaveEnabled = useSettingsStore.getState().settings.general.autoSave !== false
      const state = useEditorStore.getState()
      if (autoSaveEnabled && state.isDirty && state.macro) {
        await state.saveMacro()
        await loadMacros()
      }
    }, 60000)
    return () => {
      if (autoSaveTimerRef.current) clearInterval(autoSaveTimerRef.current)
    }
  }, [loadMacros])

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

  const isPlaying = status === 'playing' || status === 'paused'

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
                color: 'var(--text-muted)',
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
        <div style={{ display: 'flex', gap: 6, flexShrink: 0, alignItems: 'center' }}>
          {/* Playback controls */}
          {isPlaying ? (
            <ToolbarBtn label="Stop" onClick={handleStop} color="var(--danger)" />
          ) : (
            <ToolbarBtn
              label="Play"
              onClick={handlePlay}
              disabled={macro.events.length === 0}
              color="var(--success)"
            />
          )}
          <div style={{ width: 1, background: 'var(--border-color)', margin: '0 4px', height: 20 }} />
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
          <div style={{ position: 'relative' }}>
            <ToolbarBtn
              label="Smooth"
              onClick={() => setShowSmoothPopover(!showSmoothPopover)}
              disabled={macro.events.length === 0}
            />
            {showSmoothPopover && (
              <div
                style={{
                  position: 'absolute',
                  top: '100%',
                  right: 0,
                  marginTop: 6,
                  width: 220,
                  background: 'var(--bg-secondary)',
                  border: '1px solid var(--border-color)',
                  borderRadius: 8,
                  padding: 14,
                  zIndex: 50,
                  boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 10
                }}
              >
                <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-primary)' }}>
                  Smooth Delays
                </div>
                <div>
                  <div style={{ fontSize: 10, color: 'var(--text-muted)', marginBottom: 4 }}>
                    Window size: {smoothWindowSize}
                  </div>
                  <input
                    type="range"
                    min={3}
                    max={15}
                    value={smoothWindowSize}
                    onChange={(e) => setSmoothWindowSize(Number(e.target.value))}
                    style={{ width: '100%', accentColor: 'var(--accent-cyan)' }}
                  />
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 10, color: 'var(--text-muted)', marginBottom: 4 }}>
                      Min (ms)
                    </div>
                    <input
                      type="number"
                      value={smoothMinDelay}
                      onChange={(e) => setSmoothMinDelay(Number(e.target.value))}
                      style={{
                        width: '100%',
                        padding: '4px 6px',
                        borderRadius: 4,
                        border: '1px solid var(--border-color)',
                        background: 'var(--bg-primary)',
                        color: 'var(--text-primary)',
                        fontSize: 11,
                        fontFamily: 'monospace'
                      }}
                    />
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 10, color: 'var(--text-muted)', marginBottom: 4 }}>
                      Max (ms)
                    </div>
                    <input
                      type="number"
                      value={smoothMaxDelay}
                      onChange={(e) => setSmoothMaxDelay(Number(e.target.value))}
                      style={{
                        width: '100%',
                        padding: '4px 6px',
                        borderRadius: 4,
                        border: '1px solid var(--border-color)',
                        background: 'var(--bg-primary)',
                        color: 'var(--text-primary)',
                        fontSize: 11,
                        fontFamily: 'monospace'
                      }}
                    />
                  </div>
                </div>
                <button
                  onClick={() => {
                    smoothDelays({
                      windowSize: smoothWindowSize,
                      minDelay: smoothMinDelay,
                      maxDelay: smoothMaxDelay
                    })
                    setShowSmoothPopover(false)
                  }}
                  style={{
                    padding: '6px 0',
                    borderRadius: 6,
                    border: 'none',
                    background: 'var(--accent-cyan)',
                    color: 'white',
                    cursor: 'pointer',
                    fontSize: 12,
                    fontWeight: 600
                  }}
                >
                  Apply
                </button>
                <div style={{ fontSize: 9, color: 'var(--text-muted)' }}>
                  Undoable with Ctrl+Z
                </div>
              </div>
            )}
          </div>
          <div style={{ width: 1, background: 'var(--border-color)', margin: '0 4px', height: 20 }} />
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
          <div style={{ width: 1, background: 'var(--border-color)', margin: '0 4px', height: 20 }} />
          <button
            onClick={handleSave}
            disabled={saveStatus === 'saving'}
            tabIndex={-1}
            style={{
              padding: '6px 14px',
              borderRadius: 6,
              border: 'none',
              background: saveStatus === 'saved' ? 'var(--success)' : 'var(--accent-cyan)',
              color: 'white',
              cursor: saveStatus === 'saving' ? 'wait' : 'pointer',
              fontSize: 12,
              fontWeight: 600,
              transition: 'background 0.2s',
              minWidth: 60,
              position: 'relative'
            }}
          >
            {saveStatus === 'saving' ? 'Saving...' : saveStatus === 'saved' ? 'Saved!' : isDirty ? 'Save*' : 'Save'}
            {isDirty && saveStatus === 'idle' && (
              <div
                style={{
                  position: 'absolute',
                  top: -2,
                  right: -2,
                  width: 8,
                  height: 8,
                  borderRadius: '50%',
                  background: '#f59e0b',
                  border: '2px solid var(--bg-primary)'
                }}
              />
            )}
          </button>
        </div>
      </div>

      {/* Hotkey hints */}
      <div style={{ display: 'flex', gap: 10, fontSize: 10, color: 'var(--text-muted)', flexShrink: 0, flexWrap: 'wrap' }}>
        <span>Play: <kbd style={{ color: 'var(--accent-cyan)', fontFamily: 'monospace' }}>{hotkeys.playStart}</kbd></span>
        <span>Pause: <kbd style={{ color: '#f59e0b', fontFamily: 'monospace' }}>{hotkeys.togglePause}</kbd></span>
        <span>Stop: <kbd style={{ color: 'var(--accent-cyan)', fontFamily: 'monospace' }}>{hotkeys.playStop}</kbd></span>
        <span style={{ color: 'var(--border-color)' }}>|</span>
        <span>Select all: <kbd style={{ color: 'var(--accent-violet)', fontFamily: 'monospace' }}>Ctrl+A</kbd></span>
        <span>Copy: <kbd style={{ color: 'var(--accent-violet)', fontFamily: 'monospace' }}>Ctrl+C</kbd></span>
        <span>Paste: <kbd style={{ color: 'var(--accent-violet)', fontFamily: 'monospace' }}>Ctrl+V</kbd></span>
        <span>Undo: <kbd style={{ color: 'var(--accent-violet)', fontFamily: 'monospace' }}>Ctrl+Z</kbd></span>
        <span>Delete: <kbd style={{ color: 'var(--danger)', fontFamily: 'monospace' }}>Del</kbd></span>
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
  onClick,
  color
}: {
  label: string
  disabled?: boolean
  onClick: () => void
  color?: string
}): JSX.Element {
  const isDisabled = disabled ?? false
  const c = color || 'var(--text-primary)'
  return (
    <button
      onClick={onClick}
      disabled={isDisabled}
      tabIndex={-1}
      style={{
        padding: '6px 12px',
        borderRadius: 6,
        border: `1px solid ${isDisabled ? 'var(--border-color)' : c + '44'}`,
        background: isDisabled ? 'transparent' : c + '11',
        color: isDisabled ? 'var(--text-muted)' : c,
        cursor: isDisabled ? 'not-allowed' : 'pointer',
        fontSize: 12,
        fontWeight: 500,
        opacity: isDisabled ? 0.5 : 1
      }}
    >
      {label}
    </button>
  )
}
