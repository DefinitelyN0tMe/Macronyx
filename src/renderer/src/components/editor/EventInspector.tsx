import { useState, useEffect, useMemo } from 'react'
import { useEditorStore } from '../../stores/editorStore'
import { getEventTypeLabel, getEventTypeColor } from '../../utils/eventHelpers'
import { getKeyLabel } from '../../utils/keyLabels'

export function EventInspector(): JSX.Element {
  const macro = useEditorStore((s) => s.macro)
  const selectedEventIds = useEditorStore((s) => s.selectedEventIds)
  const updateEvent = useEditorStore((s) => s.updateEvent)
  const deleteEvents = useEditorStore((s) => s.deleteEvents)
  const offsetEvents = useEditorStore((s) => s.offsetEvents)
  const scaleDelays = useEditorStore((s) => s.scaleDelays)
  const groupEvents = useEditorStore((s) => s.groupEvents)
  const ungroupEvents = useEditorStore((s) => s.ungroupEvents)

  const selectedEvent =
    selectedEventIds.length === 1
      ? macro?.events.find((e) => e.id === selectedEventIds[0])
      : null

  // Collect existing group names for datalist
  const existingGroups = useMemo(() => {
    if (!macro) return []
    const groups = new Set<string>()
    for (const ev of macro.events) {
      if (ev.group) groups.add(ev.group)
    }
    return Array.from(groups).sort()
  }, [macro])

  // Check if any selected events have groups
  const selectedHaveGroups = useMemo(() => {
    if (!macro || selectedEventIds.length === 0) return false
    const idSet = new Set(selectedEventIds)
    return macro.events.some((e) => idSet.has(e.id) && e.group)
  }, [macro, selectedEventIds])

  // Multi-select batch panel
  if (selectedEventIds.length > 1) {
    return (
      <BatchPanel
        count={selectedEventIds.length}
        ids={selectedEventIds}
        existingGroups={existingGroups}
        hasGroups={selectedHaveGroups}
        onOffset={(delta) => offsetEvents(selectedEventIds, delta)}
        onScale={(factor) => scaleDelays(selectedEventIds, factor)}
        onGroup={(name) => groupEvents(selectedEventIds, name)}
        onUngroup={() => ungroupEvents(selectedEventIds)}
        onDelete={() => deleteEvents(selectedEventIds)}
      />
    )
  }

  // No selection
  if (!selectedEvent) {
    return (
      <div
        style={{
          width: 260,
          background: 'var(--bg-secondary)',
          borderRadius: 8,
          border: '1px solid var(--border-color)',
          padding: 16,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'var(--text-muted)',
          fontSize: 12,
          flexShrink: 0
        }}
      >
        Select an event to inspect
      </div>
    )
  }

  // Single event inspector
  const color = getEventTypeColor(selectedEvent.type)

  return (
    <div
      style={{
        width: 260,
        background: 'var(--bg-secondary)',
        borderRadius: 8,
        border: '1px solid var(--border-color)',
        padding: 16,
        flexShrink: 0,
        overflow: 'auto'
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
        <div
          style={{
            padding: '3px 8px',
            borderRadius: 4,
            background: color + '22',
            color,
            fontSize: 11,
            fontWeight: 600
          }}
        >
          {getEventTypeLabel(selectedEvent.type)}
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        <InspectorField
          label="Timestamp (ms)"
          value={selectedEvent.timestamp}
          type="number"
          onChange={(v) => updateEvent(selectedEvent.id, { timestamp: Number(v) })}
        />
        <InspectorField
          label="Delay (ms)"
          value={selectedEvent.delay}
          type="number"
          onChange={(v) => updateEvent(selectedEvent.id, { delay: Number(v) })}
        />

        {(selectedEvent.type === 'mouse_move' ||
          selectedEvent.type === 'mouse_click' ||
          selectedEvent.type === 'mouse_scroll') && (
          <>
            <InspectorField
              label="X"
              value={selectedEvent.x ?? 0}
              type="number"
              onChange={(v) => updateEvent(selectedEvent.id, { x: Number(v) })}
            />
            <InspectorField
              label="Y"
              value={selectedEvent.y ?? 0}
              type="number"
              onChange={(v) => updateEvent(selectedEvent.id, { y: Number(v) })}
            />
          </>
        )}

        {selectedEvent.type === 'mouse_click' && (
          <div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 4 }}>Button</div>
            <select
              value={selectedEvent.button ?? 'left'}
              onChange={(e) =>
                updateEvent(selectedEvent.id, {
                  button: e.target.value as 'left' | 'right' | 'middle'
                })
              }
              style={{
                width: '100%',
                padding: '6px 8px',
                borderRadius: 6,
                border: '1px solid var(--border-color)',
                background: 'var(--bg-primary)',
                color: 'var(--text-primary)',
                fontSize: 12
              }}
            >
              <option value="left">Left</option>
              <option value="right">Right</option>
              <option value="middle">Middle</option>
            </select>
          </div>
        )}

        {(selectedEvent.type === 'key_down' || selectedEvent.type === 'key_up') && (
          <div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 4 }}>Key</div>
            <div
              style={{
                padding: '6px 10px',
                borderRadius: 6,
                background: 'var(--bg-primary)',
                border: '1px solid var(--border-color)',
                color: 'var(--accent-violet)',
                fontSize: 13,
                fontWeight: 600,
                fontFamily: 'monospace'
              }}
            >
              {selectedEvent.keyCode ? getKeyLabel(selectedEvent.keyCode) : 'Unknown'}
            </div>
          </div>
        )}

        {selectedEvent.modifiers && selectedEvent.modifiers.length > 0 && (
          <div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 4 }}>
              Modifiers
            </div>
            <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
              {selectedEvent.modifiers.map((mod) => (
                <span
                  key={mod}
                  style={{
                    padding: '2px 6px',
                    borderRadius: 4,
                    background: 'var(--bg-primary)',
                    border: '1px solid var(--border-color)',
                    fontSize: 10,
                    fontWeight: 600,
                    color: 'var(--text-secondary)'
                  }}
                >
                  {mod}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Condition config (for condition_start events) */}
        {selectedEvent.type === 'condition_start' && selectedEvent.condition && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 2 }}>
              Condition Type
            </div>
            <select
              value={selectedEvent.condition.type}
              onChange={(e) => {
                const cType = e.target.value as 'pixel_color' | 'window_title' | 'time_of_day'
                updateEvent(selectedEvent.id, {
                  condition: { ...selectedEvent.condition!, type: cType }
                })
              }}
              style={{
                width: '100%',
                padding: '6px 8px',
                borderRadius: 6,
                border: '1px solid var(--border-color)',
                background: 'var(--bg-primary)',
                color: 'var(--text-primary)',
                fontSize: 12
              }}
            >
              <option value="pixel_color">Pixel Color</option>
              <option value="window_title">Window Title</option>
              <option value="time_of_day">Time of Day</option>
            </select>

            {selectedEvent.condition.type === 'pixel_color' && (
              <>
                <div style={{ display: 'flex', gap: 6 }}>
                  <InspectorField
                    label="X"
                    value={selectedEvent.condition.x ?? 0}
                    type="number"
                    onChange={(v) =>
                      updateEvent(selectedEvent.id, {
                        condition: { ...selectedEvent.condition!, x: Number(v) }
                      })
                    }
                  />
                  <InspectorField
                    label="Y"
                    value={selectedEvent.condition.y ?? 0}
                    type="number"
                    onChange={(v) =>
                      updateEvent(selectedEvent.id, {
                        condition: { ...selectedEvent.condition!, y: Number(v) }
                      })
                    }
                  />
                </div>
                <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 4 }}>Color</div>
                    <input
                      type="color"
                      value={selectedEvent.condition.color
                        ? `#${((1 << 24) + (selectedEvent.condition.color.r << 16) + (selectedEvent.condition.color.g << 8) + selectedEvent.condition.color.b).toString(16).slice(1)}`
                        : '#ff0000'}
                      onChange={(e) => {
                        const hex = e.target.value
                        const r = parseInt(hex.slice(1, 3), 16)
                        const g = parseInt(hex.slice(3, 5), 16)
                        const b = parseInt(hex.slice(5, 7), 16)
                        updateEvent(selectedEvent.id, {
                          condition: { ...selectedEvent.condition!, color: { r, g, b } }
                        })
                      }}
                      style={{ width: '100%', height: 28, border: 'none', cursor: 'pointer' }}
                    />
                  </div>
                  <InspectorField
                    label="Tolerance"
                    value={selectedEvent.condition.tolerance ?? 30}
                    type="number"
                    onChange={(v) =>
                      updateEvent(selectedEvent.id, {
                        condition: { ...selectedEvent.condition!, tolerance: Number(v) }
                      })
                    }
                  />
                </div>
              </>
            )}

            {selectedEvent.condition.type === 'window_title' && (
              <>
                <div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 4 }}>Match Type</div>
                  <select
                    value={selectedEvent.condition.matchType ?? 'contains'}
                    onChange={(e) =>
                      updateEvent(selectedEvent.id, {
                        condition: {
                          ...selectedEvent.condition!,
                          matchType: e.target.value as 'contains' | 'equals' | 'regex'
                        }
                      })
                    }
                    style={{
                      width: '100%',
                      padding: '6px 8px',
                      borderRadius: 6,
                      border: '1px solid var(--border-color)',
                      background: 'var(--bg-primary)',
                      color: 'var(--text-primary)',
                      fontSize: 12
                    }}
                  >
                    <option value="contains">Contains</option>
                    <option value="equals">Equals</option>
                    <option value="regex">Regex</option>
                  </select>
                </div>
                <InspectorField
                  label="Match Value"
                  value={selectedEvent.condition.matchValue ?? ''}
                  type="text"
                  onChange={(v) =>
                    updateEvent(selectedEvent.id, {
                      condition: { ...selectedEvent.condition!, matchValue: v }
                    })
                  }
                />
              </>
            )}

            {selectedEvent.condition.type === 'time_of_day' && (
              <div style={{ display: 'flex', gap: 6 }}>
                <InspectorField
                  label="After (HH:mm)"
                  value={selectedEvent.condition.afterTime ?? ''}
                  type="text"
                  onChange={(v) =>
                    updateEvent(selectedEvent.id, {
                      condition: { ...selectedEvent.condition!, afterTime: v }
                    })
                  }
                />
                <InspectorField
                  label="Before (HH:mm)"
                  value={selectedEvent.condition.beforeTime ?? ''}
                  type="text"
                  onChange={(v) =>
                    updateEvent(selectedEvent.id, {
                      condition: { ...selectedEvent.condition!, beforeTime: v }
                    })
                  }
                />
              </div>
            )}
          </div>
        )}

        {/* Relative positioning info (read-only display) */}
        {selectedEvent.relativeToWindow && (
          <div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 4 }}>
              Relative to Window
            </div>
            <div
              style={{
                padding: '6px 8px',
                borderRadius: 6,
                background: 'var(--bg-primary)',
                border: '1px solid var(--border-color)',
                fontSize: 11,
                color: 'var(--text-secondary)',
                lineHeight: 1.5
              }}
            >
              <div><strong>Process:</strong> {selectedEvent.relativeToWindow.processName}</div>
              <div><strong>Offset:</strong> {selectedEvent.relativeToWindow.offsetX}, {selectedEvent.relativeToWindow.offsetY}</div>
            </div>
          </div>
        )}

        {/* Group field for single event */}
        <SingleGroupField
          event={selectedEvent}
          existingGroups={existingGroups}
          onGroup={(name) => groupEvents([selectedEvent.id], name)}
          onUngroup={() => ungroupEvents([selectedEvent.id])}
        />
      </div>

      <button
        onClick={() => deleteEvents([selectedEvent.id])}
        style={{
          width: '100%',
          padding: '8px 0',
          borderRadius: 6,
          border: '1px solid var(--danger)',
          background: 'transparent',
          color: 'var(--danger)',
          cursor: 'pointer',
          fontSize: 12,
          fontWeight: 500,
          marginTop: 20
        }}
      >
        Delete Event
      </button>
    </div>
  )
}

/** Group assignment field for a single event */
function SingleGroupField({
  event,
  existingGroups,
  onGroup,
  onUngroup
}: {
  event: { group?: string }
  existingGroups: string[]
  onGroup: (name: string) => void
  onUngroup: () => void
}): JSX.Element {
  const [groupInput, setGroupInput] = useState(event.group || '')

  useEffect(() => {
    setGroupInput(event.group || '')
  }, [event.group])

  return (
    <div>
      <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 4 }}>Group</div>
      <div style={{ display: 'flex', gap: 4 }}>
        <input
          type="text"
          list="group-names"
          value={groupInput}
          onChange={(e) => setGroupInput(e.target.value)}
          onBlur={() => {
            if (groupInput.trim() && groupInput !== event.group) {
              onGroup(groupInput.trim())
            }
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && groupInput.trim()) {
              onGroup(groupInput.trim())
            }
          }}
          placeholder="Assign group..."
          style={{
            flex: 1,
            padding: '6px 8px',
            borderRadius: 6,
            border: '1px solid var(--border-color)',
            background: 'var(--bg-primary)',
            color: 'var(--text-primary)',
            fontSize: 12
          }}
        />
        {event.group && (
          <button
            onClick={onUngroup}
            title="Remove from group"
            style={{
              padding: '4px 8px',
              borderRadius: 6,
              border: '1px solid var(--border-color)',
              background: 'var(--bg-primary)',
              color: 'var(--text-muted)',
              cursor: 'pointer',
              fontSize: 11
            }}
          >
            x
          </button>
        )}
      </div>
      <datalist id="group-names">
        {existingGroups.map((g) => (
          <option key={g} value={g} />
        ))}
      </datalist>
    </div>
  )
}

/** Batch editing panel for multiple selected events */
function BatchPanel({
  count,
  ids,
  existingGroups,
  hasGroups,
  onOffset,
  onScale,
  onGroup,
  onUngroup,
  onDelete
}: {
  count: number
  ids: string[]
  existingGroups: string[]
  hasGroups: boolean
  onOffset: (delta: number) => void
  onScale: (factor: number) => void
  onGroup: (name: string) => void
  onUngroup: () => void
  onDelete: () => void
}): JSX.Element {
  const [offsetMs, setOffsetMs] = useState('0')
  const [scalePercent, setScalePercent] = useState('100')
  const [groupName, setGroupName] = useState('')

  return (
    <div
      style={{
        width: 260,
        background: 'var(--bg-secondary)',
        borderRadius: 8,
        border: '1px solid var(--border-color)',
        padding: 16,
        flexShrink: 0,
        overflow: 'auto'
      }}
    >
      <div
        style={{
          fontSize: 13,
          fontWeight: 600,
          color: 'var(--text-primary)',
          marginBottom: 4
        }}
      >
        {count} events selected
      </div>
      <div
        style={{
          fontSize: 11,
          color: 'var(--text-muted)',
          marginBottom: 16
        }}
      >
        Batch edit selected events
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {/* Offset time */}
        <div>
          <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 4 }}>
            Offset time by (ms)
          </div>
          <div style={{ display: 'flex', gap: 4 }}>
            <input
              type="number"
              value={offsetMs}
              onChange={(e) => setOffsetMs(e.target.value)}
              style={{
                flex: 1,
                padding: '6px 8px',
                borderRadius: 6,
                border: '1px solid var(--border-color)',
                background: 'var(--bg-primary)',
                color: 'var(--text-primary)',
                fontSize: 12,
                fontFamily: 'monospace'
              }}
            />
            <button
              onClick={() => {
                const delta = parseInt(offsetMs, 10)
                if (!isNaN(delta) && delta !== 0) onOffset(delta)
              }}
              style={{
                padding: '6px 12px',
                borderRadius: 6,
                border: '1px solid var(--accent-cyan)',
                background: 'var(--accent-cyan)22',
                color: 'var(--accent-cyan)',
                cursor: 'pointer',
                fontSize: 11,
                fontWeight: 600
              }}
            >
              Apply
            </button>
          </div>
        </div>

        {/* Scale delays */}
        <div>
          <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 4 }}>
            Scale delays (%)
          </div>
          <div style={{ display: 'flex', gap: 4 }}>
            <input
              type="number"
              value={scalePercent}
              min={1}
              onChange={(e) => setScalePercent(e.target.value)}
              style={{
                flex: 1,
                padding: '6px 8px',
                borderRadius: 6,
                border: '1px solid var(--border-color)',
                background: 'var(--bg-primary)',
                color: 'var(--text-primary)',
                fontSize: 12,
                fontFamily: 'monospace'
              }}
            />
            <button
              onClick={() => {
                const pct = parseInt(scalePercent, 10)
                if (!isNaN(pct) && pct > 0 && pct !== 100) onScale(pct / 100)
              }}
              style={{
                padding: '6px 12px',
                borderRadius: 6,
                border: '1px solid var(--accent-cyan)',
                background: 'var(--accent-cyan)22',
                color: 'var(--accent-cyan)',
                cursor: 'pointer',
                fontSize: 11,
                fontWeight: 600
              }}
            >
              Apply
            </button>
          </div>
        </div>

        {/* Group assignment */}
        <div>
          <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 4 }}>
            Assign to group
          </div>
          <div style={{ display: 'flex', gap: 4 }}>
            <input
              type="text"
              list="batch-group-names"
              value={groupName}
              onChange={(e) => setGroupName(e.target.value)}
              placeholder="Group name..."
              style={{
                flex: 1,
                padding: '6px 8px',
                borderRadius: 6,
                border: '1px solid var(--border-color)',
                background: 'var(--bg-primary)',
                color: 'var(--text-primary)',
                fontSize: 12
              }}
            />
            <button
              onClick={() => {
                if (groupName.trim()) {
                  onGroup(groupName.trim())
                  setGroupName('')
                }
              }}
              style={{
                padding: '6px 12px',
                borderRadius: 6,
                border: '1px solid var(--accent-cyan)',
                background: 'var(--accent-cyan)22',
                color: 'var(--accent-cyan)',
                cursor: 'pointer',
                fontSize: 11,
                fontWeight: 600
              }}
            >
              Set
            </button>
          </div>
          <datalist id="batch-group-names">
            {existingGroups.map((g) => (
              <option key={g} value={g} />
            ))}
          </datalist>
        </div>

        {/* Ungroup button */}
        {hasGroups && (
          <button
            onClick={onUngroup}
            style={{
              width: '100%',
              padding: '8px 0',
              borderRadius: 6,
              border: '1px solid var(--border-color)',
              background: 'transparent',
              color: 'var(--text-secondary)',
              cursor: 'pointer',
              fontSize: 12,
              fontWeight: 500
            }}
          >
            Ungroup Selected
          </button>
        )}

        {/* Delete all */}
        <button
          onClick={onDelete}
          style={{
            width: '100%',
            padding: '8px 0',
            borderRadius: 6,
            border: '1px solid var(--danger)',
            background: 'transparent',
            color: 'var(--danger)',
            cursor: 'pointer',
            fontSize: 12,
            fontWeight: 500,
            marginTop: 4
          }}
        >
          Delete {count} Events
        </button>
      </div>
    </div>
  )
}

function InspectorField({
  label,
  value,
  type,
  onChange
}: {
  label: string
  value: string | number
  type: string
  onChange: (value: string) => void
}): JSX.Element {
  const [localValue, setLocalValue] = useState(String(value))
  const [isFocused, setIsFocused] = useState(false)

  // Sync from external value when not focused
  useEffect(() => {
    if (!isFocused) {
      setLocalValue(String(value))
    }
  }, [value, isFocused])

  const commit = (): void => {
    if (localValue !== String(value)) {
      onChange(localValue)
    }
    setIsFocused(false)
  }

  return (
    <div>
      <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 4 }}>{label}</div>
      <input
        type={type}
        value={localValue}
        onFocus={() => setIsFocused(true)}
        onChange={(e) => setLocalValue(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => {
          if (e.key === 'Enter') commit()
        }}
        style={{
          width: '100%',
          padding: '6px 8px',
          borderRadius: 6,
          border: '1px solid var(--border-color)',
          background: 'var(--bg-primary)',
          color: 'var(--text-primary)',
          fontSize: 12,
          fontFamily: 'monospace'
        }}
      />
    </div>
  )
}
