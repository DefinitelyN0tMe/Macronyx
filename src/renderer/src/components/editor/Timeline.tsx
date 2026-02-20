import { useCallback, useRef, useState, useEffect } from 'react'
import { useEditorStore } from '../../stores/editorStore'
import { getEventTypeColor } from '../../utils/eventHelpers'
import { getKeyLabel } from '../../utils/keyLabels'
import type { MacroEvent } from '@shared/types'

export function Timeline(): JSX.Element {
  const macro = useEditorStore((s) => s.macro)
  const zoom = useEditorStore((s) => s.zoom)
  const scrollOffset = useEditorStore((s) => s.scrollOffset)
  const setScrollOffset = useEditorStore((s) => s.setScrollOffset)
  const setZoom = useEditorStore((s) => s.setZoom)
  const selectedEventIds = useEditorStore((s) => s.selectedEventIds)
  const selectEvents = useEditorStore((s) => s.selectEvents)
  const deleteEvents = useEditorStore((s) => s.deleteEvents)
  const containerRef = useRef<HTMLDivElement>(null)
  const [containerWidth, setContainerWidth] = useState(2000)

  // Track container width for viewport culling
  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        setContainerWidth(entry.contentRect.width)
      }
    })
    observer.observe(el)
    setContainerWidth(el.clientWidth)
    return () => observer.disconnect()
  }, [])

  const handleWheel = useCallback(
    (e: React.WheelEvent) => {
      if (e.ctrlKey) {
        e.preventDefault()
        const currentZoom = useEditorStore.getState().zoom
        setZoom(currentZoom + (e.deltaY > 0 ? -10 : 10))
      } else {
        const currentOffset = useEditorStore.getState().scrollOffset
        setScrollOffset(currentOffset + e.deltaY * 0.5)
      }
    },
    [setZoom, setScrollOffset]
  )

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Delete' || e.key === 'Backspace') {
        if (selectedEventIds.length > 0) {
          deleteEvents(selectedEventIds)
        }
      }
      if (e.key === 'a' && (e.ctrlKey || e.metaKey)) {
        e.preventDefault()
        if (macro) {
          selectEvents(macro.events.map((ev) => ev.id))
        }
      }
    },
    [selectedEventIds, deleteEvents, selectEvents, macro]
  )

  if (!macro || macro.events.length === 0) {
    return <div className="timeline-empty">No events to display</div>
  }

  const totalWidth = (macro.duration / 1000) * zoom + 200
  const mouseEvents = macro.events.filter((e) => e.type.startsWith('mouse_'))
  const keyEvents = macro.events.filter((e) => e.type.startsWith('key_'))

  return (
    <div
      ref={containerRef}
      className="timeline-container"
      style={{ flex: 1, minHeight: 180, outline: 'none' }}
      onWheel={handleWheel}
      onKeyDown={handleKeyDown}
      tabIndex={0}
    >
      {/* Ruler */}
      <TimelineRuler zoom={zoom} duration={macro.duration} scrollOffset={scrollOffset} viewportWidth={containerWidth} />

      {/* Mouse Track */}
      <div className="timeline-track">
        <div className="timeline-track-label">Mouse</div>
        <div className="timeline-track-content">
          {mouseEvents.map((event) => (
            <TimelineEventChip
              key={event.id}
              event={event}
              zoom={zoom}
              scrollOffset={scrollOffset}
              isSelected={selectedEventIds.includes(event.id)}
              onSelect={() => selectEvents([event.id])}
              viewportWidth={containerWidth}
            />
          ))}
        </div>
      </div>

      {/* Keyboard Track */}
      <div className="timeline-track">
        <div className="timeline-track-label">Keys</div>
        <div className="timeline-track-content">
          {keyEvents.map((event) => (
            <TimelineEventChip
              key={event.id}
              event={event}
              zoom={zoom}
              scrollOffset={scrollOffset}
              isSelected={selectedEventIds.includes(event.id)}
              onSelect={() => selectEvents([event.id])}
              viewportWidth={containerWidth}
            />
          ))}
        </div>
      </div>
    </div>
  )
}

function TimelineRuler({
  zoom,
  duration,
  scrollOffset,
  viewportWidth
}: {
  zoom: number
  duration: number
  scrollOffset: number
  viewportWidth: number
}): JSX.Element {
  const totalSeconds = Math.ceil(duration / 1000) + 2
  const tickInterval = zoom < 30 ? 5 : zoom < 80 ? 2 : 1

  const ticks: JSX.Element[] = []
  for (let s = 0; s <= totalSeconds; s += tickInterval) {
    const left = (s * zoom) - scrollOffset + 80
    if (left < 40 || left > viewportWidth + 50) continue
    ticks.push(
      <div
        key={s}
        style={{
          position: 'absolute',
          left,
          top: 0,
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center'
        }}
      >
        <span style={{ fontSize: 9, color: 'var(--text-muted)', marginTop: 2 }}>{s}s</span>
        <div style={{ width: 1, flex: 1, background: 'var(--border-subtle)' }} />
      </div>
    )
  }

  return <div className="timeline-ruler">{ticks}</div>
}

function TimelineEventChip({
  event,
  zoom,
  scrollOffset,
  isSelected,
  onSelect,
  viewportWidth
}: {
  event: MacroEvent
  zoom: number
  scrollOffset: number
  isSelected: boolean
  onSelect: () => void
  viewportWidth: number
}): JSX.Element {
  const left = (event.timestamp / 1000) * zoom - scrollOffset
  const color = getEventTypeColor(event.type)

  if (left < -50 || left > viewportWidth + 50) return null as unknown as JSX.Element

  const renderContent = (): JSX.Element => {
    switch (event.type) {
      case 'mouse_move':
        return (
          <div
            className="timeline-event-dot"
            style={{ background: color, opacity: 0.6 }}
          />
        )
      case 'mouse_click':
        return (
          <div
            className="timeline-event-click"
            style={{
              borderColor: color,
              background: isSelected ? color : 'transparent'
            }}
          />
        )
      case 'mouse_scroll':
        return (
          <div
            className="timeline-event-scroll"
            style={{ borderColor: color }}
          />
        )
      case 'key_down':
        return (
          <div
            className="timeline-event-key"
            style={{ background: color + '88' }}
          >
            {event.keyCode ? getKeyLabel(event.keyCode) : '?'}
          </div>
        )
      case 'key_up':
        return (
          <div
            className="timeline-event-key"
            style={{
              background: 'transparent',
              border: `1px solid ${color}88`,
              color: color
            }}
          >
            {event.keyCode ? getKeyLabel(event.keyCode) : '?'}
          </div>
        )
      default:
        return <div className="timeline-event-dot" style={{ background: '#666' }} />
    }
  }

  return (
    <div
      className={`timeline-event ${isSelected ? 'selected' : ''}`}
      style={{
        left,
        outline: isSelected ? `2px solid ${color}` : 'none',
        outlineOffset: 2,
        borderRadius: 4
      }}
      onClick={(e) => {
        e.stopPropagation()
        onSelect()
      }}
    >
      {renderContent()}
    </div>
  )
}
