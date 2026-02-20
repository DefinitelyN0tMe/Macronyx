import { useRef, useEffect } from 'react'
import { useEditorStore } from '../../stores/editorStore'

export function MousePathPreview(): JSX.Element {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const macro = useEditorStore((s) => s.macro)
  const selectedEventIds = useEditorStore((s) => s.selectedEventIds)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas || !macro) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const rect = canvas.getBoundingClientRect()
    canvas.width = rect.width * window.devicePixelRatio
    canvas.height = rect.height * window.devicePixelRatio
    ctx.scale(window.devicePixelRatio, window.devicePixelRatio)
    const width = rect.width
    const height = rect.height

    ctx.clearRect(0, 0, width, height)

    // Draw background grid
    ctx.strokeStyle = '#1a1b2e'
    ctx.lineWidth = 0.5
    for (let x = 0; x < width; x += 40) {
      ctx.beginPath()
      ctx.moveTo(x, 0)
      ctx.lineTo(x, height)
      ctx.stroke()
    }
    for (let y = 0; y < height; y += 40) {
      ctx.beginPath()
      ctx.moveTo(0, y)
      ctx.lineTo(width, y)
      ctx.stroke()
    }

    const mouseEvents = macro.events.filter(
      (e) => e.type === 'mouse_move' || e.type === 'mouse_click'
    )
    if (mouseEvents.length === 0) return

    // Calculate scale (use reduce to avoid stack overflow on large arrays)
    let maxX = 1920
    let maxY = 1080
    for (const e of mouseEvents) {
      if ((e.x ?? 0) > maxX) maxX = e.x ?? 0
      if ((e.y ?? 0) > maxY) maxY = e.y ?? 0
    }
    const scaleX = (width - 20) / maxX
    const scaleY = (height - 20) / maxY
    const scale = Math.min(scaleX, scaleY)
    const offsetX = (width - maxX * scale) / 2
    const offsetY = (height - maxY * scale) / 2

    // Draw path
    const moves = mouseEvents.filter((e) => e.type === 'mouse_move')
    if (moves.length > 1) {
      ctx.strokeStyle = 'rgba(6, 182, 212, 0.25)'
      ctx.lineWidth = 1.5
      ctx.beginPath()
      ctx.moveTo((moves[0].x ?? 0) * scale + offsetX, (moves[0].y ?? 0) * scale + offsetY)
      for (let i = 1; i < moves.length; i++) {
        ctx.lineTo((moves[i].x ?? 0) * scale + offsetX, (moves[i].y ?? 0) * scale + offsetY)
      }
      ctx.stroke()
    }

    // Draw clicks
    const clicks = mouseEvents.filter((e) => e.type === 'mouse_click')
    for (const click of clicks) {
      const cx = (click.x ?? 0) * scale + offsetX
      const cy = (click.y ?? 0) * scale + offsetY
      const isSelected = selectedEventIds.includes(click.id)
      const radius = isSelected ? 6 : 3
      const fillColor = click.button === 'right' ? '#3b82f6' : '#ef4444'

      ctx.fillStyle = fillColor
      ctx.globalAlpha = isSelected ? 1 : 0.7
      ctx.beginPath()
      ctx.arc(cx, cy, radius, 0, Math.PI * 2)
      ctx.fill()

      if (isSelected) {
        ctx.strokeStyle = fillColor
        ctx.lineWidth = 2
        ctx.globalAlpha = 0.4
        ctx.beginPath()
        ctx.arc(cx, cy, radius + 4, 0, Math.PI * 2)
        ctx.stroke()
      }
      ctx.globalAlpha = 1
    }
  }, [macro, selectedEventIds])

  return (
    <div
      style={{
        height: 160,
        background: 'var(--bg-secondary)',
        borderRadius: 8,
        border: '1px solid var(--border-color)',
        overflow: 'hidden',
        flexShrink: 0
      }}
    >
      <canvas
        ref={canvasRef}
        style={{ width: '100%', height: '100%', display: 'block' }}
      />
    </div>
  )
}
