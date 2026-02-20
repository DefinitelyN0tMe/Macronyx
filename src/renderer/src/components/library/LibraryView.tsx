import { useState } from 'react'
import { useMacroStore } from '../../stores/macroStore'
import { useAppStore } from '../../stores/appStore'
import { useEditorStore } from '../../stores/editorStore'
import { useSettingsStore } from '../../stores/settingsStore'
import { formatDuration } from '../../utils/formatTime'
import { ConfirmDialog } from '../common/ConfirmDialog'
import type { Macro } from '@shared/types'

export function LibraryView(): JSX.Element {
  const { macros, searchQuery, setSearchQuery, deleteMacro, loadMacros, selectedMacroId, selectMacro } = useMacroStore()
  const setActiveView = useAppStore((s) => s.setActiveView)
  const hotkeys = useSettingsStore((s) => s.settings.hotkeys)
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null)
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')

  const filteredMacros = useMacroStore.getState().getFilteredMacros()

  const handlePlay = async (macroId: string): Promise<void> => {
    selectMacro(macroId)
    await window.api.startPlayback(macroId)
  }

  const handleEdit = async (macro: Macro): Promise<void> => {
    const full = (await window.api.loadMacro(macro.id)) as Macro
    if (full) {
      useEditorStore.getState().loadMacro(full)
      setActiveView('editor')
    }
  }

  const handleExport = async (macroId: string): Promise<void> => {
    await window.api.exportMacro(macroId)
  }

  const handleImport = async (): Promise<void> => {
    await window.api.importMacro()
    await loadMacros()
  }

  const handleDelete = async (): Promise<void> => {
    if (deleteTarget) {
      await deleteMacro(deleteTarget)
      setDeleteTarget(null)
    }
  }

  return (
    <div className="animate-slide-in">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <h2 style={{ fontSize: 18, fontWeight: 600 }}>Macro Library</h2>
        <div style={{ display: 'flex', gap: 8 }}>
          <button
            onClick={handleImport}
            style={{
              padding: '6px 14px',
              borderRadius: 6,
              border: '1px solid var(--border-color)',
              background: 'var(--bg-secondary)',
              color: 'var(--text-primary)',
              cursor: 'pointer',
              fontSize: 12,
              fontWeight: 500
            }}
          >
            Import
          </button>
          <button
            onClick={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}
            style={{
              padding: '6px 10px',
              borderRadius: 6,
              border: '1px solid var(--border-color)',
              background: 'var(--bg-secondary)',
              color: 'var(--text-secondary)',
              cursor: 'pointer',
              fontSize: 12
            }}
          >
            {viewMode === 'grid' ? '☰' : '⊞'}
          </button>
        </div>
      </div>

      {/* Search */}
      <input
        type="text"
        placeholder="Search macros..."
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        style={{
          width: '100%',
          padding: '8px 14px',
          borderRadius: 8,
          border: '1px solid var(--border-color)',
          background: 'var(--bg-secondary)',
          color: 'var(--text-primary)',
          fontSize: 13,
          outline: 'none',
          marginBottom: 16
        }}
      />

      {/* Hotkey Info */}
      <div
        style={{
          display: 'flex',
          gap: 16,
          flexWrap: 'wrap',
          padding: '8px 14px',
          background: 'var(--bg-secondary)',
          borderRadius: 8,
          border: '1px solid var(--border-subtle)',
          marginBottom: 16,
          fontSize: 11
        }}
      >
        <HotkeyBadge label="Play" hotkey={hotkeys.playStart} />
        <HotkeyBadge label="Stop" hotkey={hotkeys.playStop} />
        <HotkeyBadge label="Record" hotkey={hotkeys.recordStart} />
        <HotkeyBadge label="Emergency" hotkey={hotkeys.emergencyStop} color="var(--danger)" />
      </div>

      {/* Macro Grid/List */}
      {filteredMacros.length === 0 ? (
        <div
          style={{
            padding: 48,
            textAlign: 'center',
            color: 'var(--text-muted)',
            background: 'var(--bg-secondary)',
            borderRadius: 10,
            border: '1px solid var(--border-color)'
          }}
        >
          {macros.length === 0
            ? 'No macros yet. Go to Recorder to create one!'
            : 'No macros match your search.'}
        </div>
      ) : (
        <div
          style={{
            display: viewMode === 'grid' ? 'grid' : 'flex',
            gridTemplateColumns: viewMode === 'grid' ? 'repeat(auto-fill, minmax(280px, 1fr))' : undefined,
            flexDirection: viewMode === 'list' ? 'column' : undefined,
            gap: 10
          }}
        >
          {filteredMacros.map((macro) => (
            <MacroCard
              key={macro.id}
              macro={macro}
              isSelected={selectedMacroId === macro.id}
              onSelect={() => selectMacro(macro.id)}
              onPlay={() => handlePlay(macro.id)}
              onEdit={() => handleEdit(macro)}
              onExport={() => handleExport(macro.id)}
              onDelete={() => setDeleteTarget(macro.id)}
            />
          ))}
        </div>
      )}

      <ConfirmDialog
        isOpen={deleteTarget !== null}
        title="Delete Macro"
        message="Are you sure you want to delete this macro? This action cannot be undone."
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  )
}

function MacroCard({
  macro,
  isSelected,
  onSelect,
  onPlay,
  onEdit,
  onExport,
  onDelete
}: {
  macro: Macro
  isSelected: boolean
  onSelect: () => void
  onPlay: () => void
  onEdit: () => void
  onExport: () => void
  onDelete: () => void
}): JSX.Element {
  const evtCount = macro.eventCount ?? macro.events.length
  return (
    <div
      onClick={onSelect}
      style={{
        padding: 14,
        background: isSelected ? 'rgba(6, 182, 212, 0.05)' : 'var(--bg-secondary)',
        borderRadius: 10,
        border: `1px solid ${isSelected ? 'var(--accent-cyan)' : 'var(--border-color)'}`,
        transition: 'border-color 0.15s, background 0.15s',
        cursor: 'pointer'
      }}
      onMouseEnter={(e) => {
        if (!isSelected) e.currentTarget.style.borderColor = 'var(--accent-cyan)'
      }}
      onMouseLeave={(e) => {
        if (!isSelected) e.currentTarget.style.borderColor = 'var(--border-color)'
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
            <div style={{ fontWeight: 600, fontSize: 14 }}>{macro.name}</div>
            {isSelected && (
              <span style={{
                padding: '1px 6px',
                borderRadius: 4,
                background: 'var(--accent-cyan)',
                color: 'white',
                fontSize: 9,
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: 0.5
              }}>
                Selected
              </span>
            )}
          </div>
          {macro.description && (
            <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 8 }}>
              {macro.description}
            </div>
          )}
          <div style={{ display: 'flex', gap: 8, fontSize: 11, color: 'var(--text-secondary)' }}>
            <span>{formatDuration(macro.duration)}</span>
            <span>&middot;</span>
            <span>{evtCount} events</span>
            <span>&middot;</span>
            <span>{new Date(macro.updatedAt).toLocaleDateString()}</span>
          </div>
          {macro.tags.length > 0 && (
            <div style={{ display: 'flex', gap: 4, marginTop: 8, flexWrap: 'wrap' }}>
              {macro.tags.map((tag) => (
                <span
                  key={tag}
                  style={{
                    padding: '1px 6px',
                    borderRadius: 4,
                    background: 'rgba(6, 182, 212, 0.1)',
                    color: 'var(--accent-cyan)',
                    fontSize: 10,
                    fontWeight: 600
                  }}
                >
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>

      <div
        style={{
          display: 'flex',
          gap: 6,
          marginTop: 12,
          borderTop: '1px solid var(--border-subtle)',
          paddingTop: 10
        }}
      >
        <ActionBtn label="Play" color="var(--success)" onClick={(e) => { e.stopPropagation(); onPlay() }} />
        <ActionBtn label="Edit" color="var(--accent-cyan)" onClick={(e) => { e.stopPropagation(); onEdit() }} />
        <ActionBtn label="Export" color="var(--text-secondary)" onClick={(e) => { e.stopPropagation(); onExport() }} />
        <ActionBtn label="Delete" color="var(--danger)" onClick={(e) => { e.stopPropagation(); onDelete() }} />
      </div>
    </div>
  )
}

function HotkeyBadge({
  label,
  hotkey,
  color
}: {
  label: string
  hotkey: string
  color?: string
}): JSX.Element {
  const c = color || 'var(--accent-cyan)'
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
      <span style={{ color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600, fontSize: 10 }}>
        {label}
      </span>
      <kbd
        style={{
          padding: '2px 8px',
          borderRadius: 4,
          background: `${c}15`,
          border: `1px solid ${c}40`,
          color: c,
          fontFamily: 'monospace',
          fontWeight: 600,
          letterSpacing: 0.5,
          fontSize: 11
        }}
      >
        {hotkey}
      </kbd>
    </div>
  )
}

function ActionBtn({
  label,
  color,
  onClick
}: {
  label: string
  color: string
  onClick: (e: React.MouseEvent) => void
}): JSX.Element {
  return (
    <button
      onClick={onClick}
      style={{
        padding: '4px 10px',
        borderRadius: 5,
        border: `1px solid ${color}33`,
        background: `${color}11`,
        color,
        cursor: 'pointer',
        fontSize: 11,
        fontWeight: 500,
        transition: 'background 0.15s'
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.background = `${color}22`
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = `${color}11`
      }}
    >
      {label}
    </button>
  )
}
