import { useEditorStore } from '../../stores/editorStore'
import { getEventTypeLabel, getEventTypeColor } from '../../utils/eventHelpers'
import { getKeyLabel } from '../../utils/keyLabels'

export function EventInspector(): JSX.Element {
  const macro = useEditorStore((s) => s.macro)
  const selectedEventIds = useEditorStore((s) => s.selectedEventIds)
  const updateEvent = useEditorStore((s) => s.updateEvent)
  const deleteEvents = useEditorStore((s) => s.deleteEvents)

  const selectedEvent =
    selectedEventIds.length === 1
      ? macro?.events.find((e) => e.id === selectedEventIds[0])
      : null

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
        {selectedEventIds.length > 1
          ? `${selectedEventIds.length} events selected`
          : 'Select an event to inspect'}
      </div>
    )
  }

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
  return (
    <div>
      <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 4 }}>{label}</div>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
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
