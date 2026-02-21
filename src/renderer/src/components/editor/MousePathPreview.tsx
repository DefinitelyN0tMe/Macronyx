import { useRef, useEffect, useCallback, useState } from 'react'
import { useEditorStore } from '../../stores/editorStore'

export function MousePathPreview(): JSX.Element {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const animFrameRef = useRef<number>(0)
  const macro = useEditorStore((s) => s.macro)
  const selectedEventIds = useEditorStore((s) => s.selectedEventIds)
  const selectEvents = useEditorStore((s) => s.selectEvents)
  const [isPreviewPlaying, setIsPreviewPlaying] = useState(false)
  const previewStartRef = useRef<number>(0)
  const previewSpeedRef = useRef<number>(1)

  // Compute scaling factors
  const getScaling = useCallback(
    (width: number, height: number) => {
      if (!macro) return { scale: 1, offsetX: 0, offsetY: 0 }
      const mouseEvents = macro.events.filter(
        (e) => e.type === 'mouse_move' || e.type === 'mouse_click'
      )
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
      return { scale, offsetX, offsetY }
    },
    [macro]
  )

  // Draw static path
  const drawStatic = useCallback(() => {
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

    const { scale, offsetX, offsetY } = getScaling(width, height)

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
  }, [macro, selectedEventIds, getScaling])

  // Animated preview playback frame
  const drawPreviewFrame = useCallback(
    (elapsed: number) => {
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

      // Background grid
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

      const { scale, offsetX, offsetY } = getScaling(width, height)

      // Find current event index
      let currentIdx = 0
      for (let i = 0; i < macro.events.length; i++) {
        if (macro.events[i].timestamp <= elapsed) {
          currentIdx = i
        } else {
          break
        }
      }

      // Draw trail of past mouse moves (fading gradient)
      const pastMoves = macro.events.filter(
        (e, i) => (e.type === 'mouse_move' || e.type === 'mouse_click') && i <= currentIdx
      )
      if (pastMoves.length > 1) {
        for (let i = 1; i < pastMoves.length; i++) {
          const progress = i / pastMoves.length
          ctx.strokeStyle = `rgba(6, 182, 212, ${0.1 + progress * 0.4})`
          ctx.lineWidth = 1 + progress
          ctx.beginPath()
          ctx.moveTo(
            (pastMoves[i - 1].x ?? 0) * scale + offsetX,
            (pastMoves[i - 1].y ?? 0) * scale + offsetY
          )
          ctx.lineTo(
            (pastMoves[i].x ?? 0) * scale + offsetX,
            (pastMoves[i].y ?? 0) * scale + offsetY
          )
          ctx.stroke()
        }
      }

      // Draw future path dimmed
      const futureMoves = macro.events.filter(
        (e, i) => (e.type === 'mouse_move' || e.type === 'mouse_click') && i > currentIdx
      )
      if (futureMoves.length > 1 && pastMoves.length > 0) {
        ctx.strokeStyle = 'rgba(6, 182, 212, 0.08)'
        ctx.lineWidth = 1
        const lastPast = pastMoves[pastMoves.length - 1]
        ctx.beginPath()
        ctx.moveTo((lastPast.x ?? 0) * scale + offsetX, (lastPast.y ?? 0) * scale + offsetY)
        for (const e of futureMoves) {
          ctx.lineTo((e.x ?? 0) * scale + offsetX, (e.y ?? 0) * scale + offsetY)
        }
        ctx.stroke()
      }

      // Draw past clicks
      const pastClicks = macro.events.filter(
        (e, i) => e.type === 'mouse_click' && i <= currentIdx
      )
      for (const click of pastClicks) {
        const cx = (click.x ?? 0) * scale + offsetX
        const cy = (click.y ?? 0) * scale + offsetY
        const fillColor = click.button === 'right' ? '#3b82f6' : '#ef4444'
        ctx.fillStyle = fillColor
        ctx.globalAlpha = 0.5
        ctx.beginPath()
        ctx.arc(cx, cy, 3, 0, Math.PI * 2)
        ctx.fill()
        ctx.globalAlpha = 1
      }

      // Click flash for recent clicks (within 200ms)
      for (const click of pastClicks) {
        const age = elapsed - click.timestamp
        if (age >= 0 && age < 200) {
          const cx = (click.x ?? 0) * scale + offsetX
          const cy = (click.y ?? 0) * scale + offsetY
          const flash = 1 - age / 200
          const fillColor = click.button === 'right' ? '#3b82f6' : '#ef4444'
          ctx.strokeStyle = fillColor
          ctx.lineWidth = 2
          ctx.globalAlpha = flash * 0.8
          ctx.beginPath()
          ctx.arc(cx, cy, 3 + flash * 12, 0, Math.PI * 2)
          ctx.stroke()
          ctx.globalAlpha = 1
        }
      }

      // Key event labels near cursor
      const recentKeys = macro.events.filter(
        (e, i) => e.type === 'key_down' && i <= currentIdx && elapsed - e.timestamp < 500
      )
      if (recentKeys.length > 0 && pastMoves.length > 0) {
        const lastPos = pastMoves[pastMoves.length - 1]
        const cx = (lastPos.x ?? 0) * scale + offsetX
        const cy = (lastPos.y ?? 0) * scale + offsetY
        for (let k = 0; k < Math.min(recentKeys.length, 3); k++) {
          const keyEvt = recentKeys[recentKeys.length - 1 - k]
          const age = elapsed - keyEvt.timestamp
          const alpha = Math.max(0, 1 - age / 500)
          ctx.fillStyle = `rgba(168, 85, 247, ${alpha})`
          ctx.font = '10px monospace'
          ctx.fillText(keyEvt.key || `[${keyEvt.keyCode}]`, cx + 12, cy - 8 - k * 14)
        }
      }

      // Animated cursor dot
      if (pastMoves.length > 0) {
        const cursorPos = pastMoves[pastMoves.length - 1]
        const cx = (cursorPos.x ?? 0) * scale + offsetX
        const cy = (cursorPos.y ?? 0) * scale + offsetY

        // Pulsing glow
        const pulse = 0.5 + 0.5 * Math.sin(Date.now() / 150)
        ctx.beginPath()
        ctx.arc(cx, cy, 8 + pulse * 3, 0, Math.PI * 2)
        ctx.fillStyle = `rgba(6, 182, 212, ${0.15 + pulse * 0.1})`
        ctx.fill()

        // Solid cursor
        ctx.beginPath()
        ctx.arc(cx, cy, 5, 0, Math.PI * 2)
        ctx.fillStyle = '#06b6d4'
        ctx.fill()
        ctx.strokeStyle = '#fff'
        ctx.lineWidth = 1.5
        ctx.stroke()
      }

      // Progress bar
      if (macro.duration > 0) {
        const progress = Math.min(1, elapsed / macro.duration)
        ctx.fillStyle = 'rgba(0,0,0,0.3)'
        ctx.fillRect(0, height - 4, width, 4)
        ctx.fillStyle = '#06b6d4'
        ctx.fillRect(0, height - 4, width * progress, 4)
      }

      // Sync timeline selection to current event
      const currentEvent = macro.events[currentIdx]
      if (currentEvent) {
        selectEvents([currentEvent.id])
      }
    },
    [macro, getScaling, selectEvents]
  )

  // Animation loop
  const animatePreview = useCallback(() => {
    if (!macro) return
    const speed = previewSpeedRef.current
    const elapsed = (performance.now() - previewStartRef.current) * speed

    if (elapsed >= macro.duration) {
      setIsPreviewPlaying(false)
      drawStatic()
      return
    }

    drawPreviewFrame(elapsed)
    animFrameRef.current = requestAnimationFrame(animatePreview)
  }, [macro, drawPreviewFrame, drawStatic])

  const startPreview = useCallback(() => {
    if (!macro || macro.events.length === 0) return
    previewSpeedRef.current = macro.playbackSettings?.speed ?? 1
    previewStartRef.current = performance.now()
    setIsPreviewPlaying(true)
  }, [macro])

  const stopPreview = useCallback(() => {
    setIsPreviewPlaying(false)
    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current)
      animFrameRef.current = 0
    }
    drawStatic()
  }, [drawStatic])

  // Run animation when preview is playing
  useEffect(() => {
    if (isPreviewPlaying) {
      animFrameRef.current = requestAnimationFrame(animatePreview)
    }
    return () => {
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current)
      }
    }
  }, [isPreviewPlaying, animatePreview])

  // Redraw static when data changes (and not previewing)
  useEffect(() => {
    if (!isPreviewPlaying) {
      drawStatic()
    }
  }, [macro, selectedEventIds, isPreviewPlaying, drawStatic])

  return (
    <div
      style={{
        height: 160,
        background: 'var(--bg-secondary)',
        borderRadius: 8,
        border: '1px solid var(--border-color)',
        overflow: 'hidden',
        flexShrink: 0,
        position: 'relative'
      }}
    >
      <canvas
        ref={canvasRef}
        style={{ width: '100%', height: '100%', display: 'block' }}
      />

      {/* Preview controls overlay */}
      <div
        style={{
          position: 'absolute',
          top: 6,
          right: 6,
          display: 'flex',
          gap: 4
        }}
      >
        {!isPreviewPlaying ? (
          <button
            onClick={startPreview}
            title="Preview Playback"
            style={{
              width: 28,
              height: 28,
              border: 'none',
              borderRadius: 6,
              background: 'rgba(6, 182, 212, 0.2)',
              color: '#06b6d4',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.15s ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(6, 182, 212, 0.35)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'rgba(6, 182, 212, 0.2)'
            }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
              <polygon points="5,3 19,12 5,21" />
            </svg>
          </button>
        ) : (
          <button
            onClick={stopPreview}
            title="Stop Preview"
            style={{
              width: 28,
              height: 28,
              border: 'none',
              borderRadius: 6,
              background: 'rgba(239, 68, 68, 0.2)',
              color: '#ef4444',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.15s ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(239, 68, 68, 0.35)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'rgba(239, 68, 68, 0.2)'
            }}
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
              <rect x="4" y="4" width="16" height="16" rx="2" />
            </svg>
          </button>
        )}
      </div>
    </div>
  )
}
