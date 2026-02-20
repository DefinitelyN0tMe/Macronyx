import { useCallback, useRef, useState, useEffect, useMemo } from 'react'
import {
  DndContext,
  useDraggable,
  MouseSensor,
  useSensor,
  useSensors,
  type DragEndEvent
} from '@dnd-kit/core'
import { useEditorStore } from '../../stores/editorStore'
import { getEventTypeColor } from '../../utils/eventHelpers'
import { stringToColor } from '../../utils/eventHelpers'
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
  const toggleSelectEvent = useEditorStore((s) => s.toggleSelectEvent)
  const deleteEvents = useEditorStore((s) => s.deleteEvents)
  const moveEvent = useEditorStore((s) => s.moveEvent)
  const copyEvents = useEditorStore((s) => s.copyEvents)
  const pasteEvents = useEditorStore((s) => s.pasteEvents)
  const containerRef = useRef<HTMLDivElement>(null)
  const [containerWidth, setContainerWidth] = useState(2000)
  const lastSelectedRef = useRef<string | null>(null)

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

  // Sorted events for range selection
  const sortedEvents = useMemo(() => {
    if (!macro) return []
    return [...macro.events].sort((a, b) => a.timestamp - b.timestamp)
  }, [macro])

  const handleSelect = useCallback(
    (eventId: string, e: React.MouseEvent) => {
      if (e.ctrlKey || e.metaKey) {
        // Ctrl/Cmd+click: toggle individual event
        toggleSelectEvent(eventId)
        lastSelectedRef.current = eventId
      } else if (e.shiftKey && lastSelectedRef.current) {
        // Shift+click: range select
        const lastIdx = sortedEvents.findIndex((ev) => ev.id === lastSelectedRef.current)
        const currentIdx = sortedEvents.findIndex((ev) => ev.id === eventId)
        if (lastIdx >= 0 && currentIdx >= 0) {
          const start = Math.min(lastIdx, currentIdx)
          const end = Math.max(lastIdx, currentIdx)
          const rangeIds = sortedEvents.slice(start, end + 1).map((ev) => ev.id)
          // Merge with existing selection
          const existing = new Set(useEditorStore.getState().selectedEventIds)
          for (const id of rangeIds) existing.add(id)
          selectEvents(Array.from(existing))
        }
      } else {
        // Plain click: single select
        selectEvents([eventId])
        lastSelectedRef.current = eventId
      }
    },
    [toggleSelectEvent, selectEvents, sortedEvents]
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
      if (e.key === 'c' && (e.ctrlKey || e.metaKey)) {
        e.preventDefault()
        if (selectedEventIds.length > 0) {
          copyEvents(selectedEventIds)
        }
      }
      if (e.key === 'v' && (e.ctrlKey || e.metaKey)) {
        e.preventDefault()
        pasteEvents()
      }
    },
    [selectedEventIds, deleteEvents, selectEvents, copyEvents, pasteEvents, macro]
  )

  // Drag sensors — require 4px movement before drag starts (prevents eating clicks)
  const mouseSensor = useSensor(MouseSensor, {
    activationConstraint: { distance: 4 }
  })
  const sensors = useSensors(mouseSensor)

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, delta } = event
      if (!macro || delta.x === 0) return
      const eventId = active.id as string
      const macroEvent = macro.events.find((e) => e.id === eventId)
      if (!macroEvent) return
      // Convert pixel delta to time delta
      const timeDelta = (delta.x / zoom) * 1000
      const newTimestamp = Math.max(0, macroEvent.timestamp + timeDelta)
      moveEvent(eventId, newTimestamp)
    },
    [macro, zoom, moveEvent]
  )

  // Compute group bands
  const groupBands = useMemo(() => {
    if (!macro) return []
    const groups = new Map<string, { minTs: number; maxTs: number }>()
    for (const ev of macro.events) {
      if (!ev.group) continue
      const existing = groups.get(ev.group)
      if (existing) {
        existing.minTs = Math.min(existing.minTs, ev.timestamp)
        existing.maxTs = Math.max(existing.maxTs, ev.timestamp)
      } else {
        groups.set(ev.group, { minTs: ev.timestamp, maxTs: ev.timestamp })
      }
    }
    return Array.from(groups.entries()).map(([name, span]) => ({
      name,
      left: (span.minTs / 1000) * zoom - scrollOffset,
      width: Math.max(20, ((span.maxTs - span.minTs) / 1000) * zoom + 20),
      color: stringToColor(name)
    }))
  }, [macro, zoom, scrollOffset])

  if (!macro || macro.events.length === 0) {
    return <div className="timeline-empty">No events to display</div>
  }

  const mouseEvents = macro.events.filter((e) => e.type.startsWith('mouse_'))
  const keyEvents = macro.events.filter((e) => e.type.startsWith('key_'))

  return (
    <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
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
            {/* Group bands */}
            {groupBands.map((band) => (
              <div
                key={`grp-mouse-${band.name}`}
                className="timeline-group-band"
                style={{
                  left: band.left,
                  width: band.width,
                  background: `${band.color}18`,
                  borderLeft: `2px solid ${band.color}60`
                }}
              >
                <span className="timeline-group-label" style={{ color: band.color }}>
                  {band.name}
                </span>
              </div>
            ))}
            {mouseEvents.map((event) => (
              <TimelineEventChip
                key={event.id}
                event={event}
                zoom={zoom}
                scrollOffset={scrollOffset}
                isSelected={selectedEventIds.includes(event.id)}
                onSelect={handleSelect}
                viewportWidth={containerWidth}
              />
            ))}
          </div>
        </div>

        {/* Keyboard Track */}
        <div className="timeline-track">
          <div className="timeline-track-label">Keys</div>
          <div className="timeline-track-content">
            {/* Group bands */}
            {groupBands.map((band) => (
              <div
                key={`grp-keys-${band.name}`}
                className="timeline-group-band"
                style={{
                  left: band.left,
                  width: band.width,
                  background: `${band.color}18`,
                  borderLeft: `2px solid ${band.color}60`
                }}
              />
            ))}
            {keyEvents.map((event) => (
              <TimelineEventChip
                key={event.id}
                event={event}
                zoom={zoom}
                scrollOffset={scrollOffset}
                isSelected={selectedEventIds.includes(event.id)}
                onSelect={handleSelect}
                viewportWidth={containerWidth}
              />
            ))}
          </div>
        </div>
      </div>
    </DndContext>
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
  onSelect: (eventId: string, e: React.MouseEvent) => void
  viewportWidth: number
}): JSX.Element {
  const baseLeft = (event.timestamp / 1000) * zoom - scrollOffset
  const color = getEventTypeColor(event.type)

  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: event.id
  })

  // Apply drag transform to position
  const left = baseLeft + (transform?.x ?? 0)

  if (baseLeft < -50 || baseLeft > viewportWidth + 50) return null as unknown as JSX.Element

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
      ref={setNodeRef}
      className={`timeline-event ${isSelected ? 'selected' : ''} ${isDragging ? 'dragging' : ''}`}
      style={{
        left,
        outline: isSelected ? `2px solid ${color}` : 'none',
        outlineOffset: 2,
        borderRadius: 4,
        opacity: isDragging ? 0.5 : 1,
        zIndex: isDragging ? 20 : isSelected ? 5 : undefined
      }}
      onClick={(e) => {
        e.stopPropagation()
        onSelect(event.id, e)
      }}
      {...listeners}
      {...attributes}
    >
      {renderContent()}
    </div>
  )
}
