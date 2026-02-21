import { useState } from 'react'
import { useEditorStore } from '../../stores/editorStore'
import { HotkeyInput } from '../common/HotkeyInput'
import { v4 as uuid } from 'uuid'
import type { TriggerConfig, TriggerType } from '@shared/types'

const TRIGGER_TYPES: { value: TriggerType; label: string; icon: string }[] = [
  { value: 'hotkey_combo', label: 'Hotkey Combo', icon: '⌨' },
  { value: 'schedule', label: 'Schedule', icon: '⏰' },
  { value: 'window_focus', label: 'Window Focus', icon: '🪟' },
  { value: 'pixel_color', label: 'Pixel Color', icon: '🎨' }
]

const SCHEDULE_EXAMPLES = [
  { label: 'Every 5 min', value: '*/5 * * * *' },
  { label: 'Every hour', value: '0 * * * *' },
  { label: 'Daily 9:00', value: '0 9 * * *' },
  { label: 'Mon-Fri 8:30', value: '30 8 * * 1-5' },
  { label: 'Every 15 min', value: '*/15 * * * *' }
]

export function TriggerPanel(): JSX.Element {
  const macro = useEditorStore((s) => s.macro)
  const [addingType, setAddingType] = useState<TriggerType | null>(null)

  if (!macro) {
    return (
      <div style={{ padding: 16, color: 'var(--text-secondary)', fontSize: 13 }}>
        Load a macro to manage triggers.
      </div>
    )
  }

  const triggers = macro.triggers || []

  const saveTriggers = (updated: TriggerConfig[]): void => {
    const updatedMacro = { ...macro, triggers: updated }
    useEditorStore.setState({ macro: updatedMacro, isDirty: true })
  }

  const addTrigger = (type: TriggerType): void => {
    const newTrigger: TriggerConfig = {
      id: uuid(),
      type,
      enabled: true,
      macroId: macro.id,
      ...(type === 'hotkey_combo' ? { hotkey: '' } : {}),
      ...(type === 'schedule' ? { schedule: '0 * * * *' } : {}),
      ...(type === 'window_focus'
        ? { windowMatch: { matchType: 'process' as const, matchValue: '' } }
        : {}),
      ...(type === 'pixel_color'
        ? { pixelMatch: { x: 0, y: 0, color: { r: 255, g: 0, b: 0 }, tolerance: 30 } }
        : {})
    }
    saveTriggers([...triggers, newTrigger])
    setAddingType(null)
  }

  const updateTrigger = (id: string, changes: Partial<TriggerConfig>): void => {
    saveTriggers(triggers.map((t) => (t.id === id ? { ...t, ...changes } : t)))
  }

  const deleteTrigger = (id: string): void => {
    saveTriggers(triggers.filter((t) => t.id !== id))
  }

  return (
    <div style={{ padding: 12, display: 'flex', flexDirection: 'column', gap: 10 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h4 style={{ margin: 0, fontSize: 13, color: 'var(--text-secondary)' }}>Triggers</h4>
        <div style={{ position: 'relative' }}>
          <button
            onClick={() => setAddingType(addingType ? null : 'hotkey_combo')}
            style={{
              border: 'none',
              borderRadius: 6,
              padding: '4px 10px',
              background: 'rgba(6, 182, 212, 0.15)',
              color: 'var(--accent-cyan)',
              fontSize: 12,
              fontWeight: 600,
              cursor: 'pointer'
            }}
          >
            + Add
          </button>
          {addingType !== null && (
            <div
              style={{
                position: 'absolute',
                top: '100%',
                right: 0,
                marginTop: 4,
                background: 'var(--bg-secondary)',
                border: '1px solid var(--border-color)',
                borderRadius: 8,
                padding: 4,
                zIndex: 10,
                minWidth: 160
              }}
            >
              {TRIGGER_TYPES.map((tt) => (
                <button
                  key={tt.value}
                  onClick={() => addTrigger(tt.value)}
                  style={{
                    display: 'block',
                    width: '100%',
                    border: 'none',
                    borderRadius: 6,
                    padding: '8px 12px',
                    background: 'transparent',
                    color: 'var(--text-primary)',
                    cursor: 'pointer',
                    textAlign: 'left',
                    fontSize: 12
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'rgba(6, 182, 212, 0.1)'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'transparent'
                  }}
                >
                  {tt.icon} {tt.label}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      <div style={{ fontSize: 11, color: 'var(--text-muted)', lineHeight: 1.4 }}>
        Triggers auto-play this macro when a condition is met.
        Enable <strong style={{ color: 'var(--accent-cyan)' }}>Triggers</strong> in Settings &gt; General for them to activate.
        Remember to save the macro after editing.
      </div>

      {triggers.length === 0 && (
        <div style={{ color: 'var(--text-secondary)', fontSize: 12, textAlign: 'center', padding: 16 }}>
          No triggers yet. Click "+ Add" to create one.
        </div>
      )}

      {triggers.map((trigger) => (
        <TriggerItem
          key={trigger.id}
          trigger={trigger}
          onUpdate={(changes) => updateTrigger(trigger.id, changes)}
          onDelete={() => deleteTrigger(trigger.id)}
        />
      ))}
    </div>
  )
}

function TriggerItem({
  trigger,
  onUpdate,
  onDelete
}: {
  trigger: TriggerConfig
  onUpdate: (changes: Partial<TriggerConfig>) => void
  onDelete: () => void
}): JSX.Element {
  const typeInfo = TRIGGER_TYPES.find((t) => t.value === trigger.type)

  return (
    <div
      style={{
        background: 'var(--bg-secondary)',
        border: '1px solid var(--border-color)',
        borderRadius: 8,
        padding: 10,
        opacity: trigger.enabled ? 1 : 0.5
      }}
    >
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
        <span style={{ fontSize: 14 }}>{typeInfo?.icon}</span>
        <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-primary)', flex: 1 }}>
          {typeInfo?.label}
        </span>
        <button
          onClick={() => onUpdate({ enabled: !trigger.enabled })}
          style={{
            border: 'none',
            borderRadius: 4,
            padding: '2px 8px',
            background: trigger.enabled ? 'rgba(34,197,94,0.15)' : 'rgba(100,100,100,0.1)',
            color: trigger.enabled ? '#22c55e' : 'var(--text-secondary)',
            cursor: 'pointer',
            fontSize: 11,
            fontWeight: 600
          }}
        >
          {trigger.enabled ? 'ON' : 'OFF'}
        </button>
        <button
          onClick={onDelete}
          style={{
            border: 'none',
            borderRadius: 4,
            padding: '2px 6px',
            background: 'rgba(239,68,68,0.1)',
            color: '#ef4444',
            cursor: 'pointer',
            fontSize: 14
          }}
        >
          ×
        </button>
      </div>

      {/* ── Hotkey combo: press-to-record ──────────────────────── */}
      {trigger.type === 'hotkey_combo' && (
        <div>
          <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 4 }}>
            Click the input below, then press the desired key combination:
          </div>
          <HotkeyInput
            value={trigger.hotkey || ''}
            onChange={(v) => onUpdate({ hotkey: v })}
          />
        </div>
      )}

      {/* ── Schedule: cron input with quick presets ────────────── */}
      {trigger.type === 'schedule' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <input
            value={trigger.schedule || ''}
            onChange={(e) => onUpdate({ schedule: e.target.value })}
            style={{
              width: '100%',
              background: 'var(--bg-primary)',
              border: '1px solid var(--border-color)',
              borderRadius: 6,
              padding: '6px 8px',
              color: 'var(--text-primary)',
              fontSize: 12,
              fontFamily: 'monospace'
            }}
          />
          <div style={{ fontSize: 10, color: 'var(--text-muted)', lineHeight: 1.5 }}>
            <strong>Cron format:</strong>{' '}
            <code style={{ color: 'var(--accent-cyan)' }}>minute hour day month weekday</code>
            <br />
            minute: 0-59 &middot; hour: 0-23 &middot; day: 1-31 &middot; month: 1-12 &middot; weekday: 0-6 (0=Sun)
            <br />
            <code style={{ color: 'var(--accent-cyan)' }}>*</code> = any,{' '}
            <code style={{ color: 'var(--accent-cyan)' }}>*/N</code> = every N,{' '}
            <code style={{ color: 'var(--accent-cyan)' }}>1,15</code> = specific values,{' '}
            <code style={{ color: 'var(--accent-cyan)' }}>1-5</code> = range
          </div>
          <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
            {SCHEDULE_EXAMPLES.map((ex) => (
              <button
                key={ex.value}
                title={ex.value}
                onClick={() => onUpdate({ schedule: ex.value })}
                style={{
                  border: 'none',
                  borderRadius: 4,
                  padding: '2px 6px',
                  background:
                    trigger.schedule === ex.value
                      ? 'rgba(6,182,212,0.2)'
                      : 'rgba(255,255,255,0.05)',
                  color:
                    trigger.schedule === ex.value
                      ? 'var(--accent-cyan)'
                      : 'var(--text-secondary)',
                  cursor: 'pointer',
                  fontSize: 10,
                  whiteSpace: 'nowrap'
                }}
              >
                {ex.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ── Window Focus ─────────────────────────────────────── */}
      {trigger.type === 'window_focus' && trigger.windowMatch && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <div style={{ display: 'flex', gap: 6 }}>
            <select
              value={trigger.windowMatch.matchType}
              onChange={(e) =>
                onUpdate({
                  windowMatch: {
                    ...trigger.windowMatch!,
                    matchType: e.target.value as 'process' | 'title_contains' | 'title_regex'
                  }
                })
              }
              style={{
                background: 'var(--bg-primary)',
                border: '1px solid var(--border-color)',
                borderRadius: 6,
                padding: '6px 8px',
                color: 'var(--text-primary)',
                fontSize: 12
              }}
            >
              <option value="process">Process name</option>
              <option value="title_contains">Title contains</option>
              <option value="title_regex">Title regex</option>
            </select>
            <input
              placeholder={
                trigger.windowMatch.matchType === 'process'
                  ? 'e.g. chrome, notepad, Code'
                  : trigger.windowMatch.matchType === 'title_contains'
                    ? 'e.g. Visual Studio, Untitled'
                    : 'e.g. .*\\.pdf$'
              }
              value={trigger.windowMatch.matchValue}
              onChange={(e) =>
                onUpdate({
                  windowMatch: { ...trigger.windowMatch!, matchValue: e.target.value }
                })
              }
              style={{
                flex: 1,
                background: 'var(--bg-primary)',
                border: '1px solid var(--border-color)',
                borderRadius: 6,
                padding: '6px 8px',
                color: 'var(--text-primary)',
                fontSize: 12
              }}
            />
          </div>
          <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>
            {trigger.windowMatch.matchType === 'process'
              ? 'Match by process name (without .exe). Case-insensitive. Example: "chrome", "notepad", "Code".'
              : trigger.windowMatch.matchType === 'title_contains'
                ? 'Fires when the window title contains this text. Case-insensitive. Example: "YouTube", "Untitled".'
                : 'Fires when the window title matches this regex (case-insensitive). Example: ".*\\.pdf$".'}
          </div>
        </div>
      )}

      {/* ── Pixel Color ──────────────────────────────────────── */}
      {trigger.type === 'pixel_color' && trigger.pixelMatch && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' }}>
            <label style={{ fontSize: 11, color: 'var(--text-secondary)' }}>X:</label>
            <input
              type="number"
              value={trigger.pixelMatch.x}
              onChange={(e) =>
                onUpdate({
                  pixelMatch: { ...trigger.pixelMatch!, x: parseInt(e.target.value) || 0 }
                })
              }
              style={{
                width: 60,
                background: 'var(--bg-primary)',
                border: '1px solid var(--border-color)',
                borderRadius: 6,
                padding: '4px 6px',
                color: 'var(--text-primary)',
                fontSize: 12,
                textAlign: 'center'
              }}
            />
            <label style={{ fontSize: 11, color: 'var(--text-secondary)' }}>Y:</label>
            <input
              type="number"
              value={trigger.pixelMatch.y}
              onChange={(e) =>
                onUpdate({
                  pixelMatch: { ...trigger.pixelMatch!, y: parseInt(e.target.value) || 0 }
                })
              }
              style={{
                width: 60,
                background: 'var(--bg-primary)',
                border: '1px solid var(--border-color)',
                borderRadius: 6,
                padding: '4px 6px',
                color: 'var(--text-primary)',
                fontSize: 12,
                textAlign: 'center'
              }}
            />
            <label style={{ fontSize: 11, color: 'var(--text-secondary)' }}>Color:</label>
            <input
              type="color"
              value={`#${trigger.pixelMatch.color.r.toString(16).padStart(2, '0')}${trigger.pixelMatch.color.g.toString(16).padStart(2, '0')}${trigger.pixelMatch.color.b.toString(16).padStart(2, '0')}`}
              onChange={(e) => {
                const hex = e.target.value
                onUpdate({
                  pixelMatch: {
                    ...trigger.pixelMatch!,
                    color: {
                      r: parseInt(hex.slice(1, 3), 16),
                      g: parseInt(hex.slice(3, 5), 16),
                      b: parseInt(hex.slice(5, 7), 16)
                    }
                  }
                })
              }}
              style={{
                width: 32,
                height: 24,
                border: '1px solid var(--border-color)',
                borderRadius: 4,
                cursor: 'pointer'
              }}
            />
            <label style={{ fontSize: 11, color: 'var(--text-secondary)' }}>Tol:</label>
            <input
              type="number"
              min={0}
              max={255}
              value={trigger.pixelMatch.tolerance}
              onChange={(e) =>
                onUpdate({
                  pixelMatch: {
                    ...trigger.pixelMatch!,
                    tolerance: Math.max(0, Math.min(255, parseInt(e.target.value) || 0))
                  }
                })
              }
              style={{
                width: 50,
                background: 'var(--bg-primary)',
                border: '1px solid var(--border-color)',
                borderRadius: 6,
                padding: '4px 6px',
                color: 'var(--text-primary)',
                fontSize: 12,
                textAlign: 'center'
              }}
            />
          </div>
          <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>
            Fires when pixel at (X,Y) matches the target color within tolerance (0-255, lower = stricter). Polled every 1s.
          </div>
        </div>
      )}
    </div>
  )
}
