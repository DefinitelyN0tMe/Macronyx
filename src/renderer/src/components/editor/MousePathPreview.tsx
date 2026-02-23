import { useRef, useEffect, useCallback } from 'react'
import { useEditorStore } from '../../stores/editorStore'

function formatPreviewTime(ms: number): string {
  const totalSeconds = ms / 1000
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60
  return `${minutes}:${seconds.toFixed(1).padStart(4, '0')}`
}

// SVG icon components for control bar
function PlayIcon(): JSX.Element {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
      <polygon points="5,3 19,12 5,21" />
    </svg>
  )
}

function PauseIcon(): JSX.Element {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
      <rect x="5" y="3" width="4" height="18" rx="1" />
      <rect x="15" y="3" width="4" height="18" rx="1" />
    </svg>
  )
}

function StopIcon(): JSX.Element {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
      <rect x="4" y="4" width="16" height="16" rx="2" />
    </svg>
  )
}

// Control bar button
function CtrlBtn({
  onClick,
  title,
  color,
  disabled,
  children
}: {
  onClick: () => void
  title: string
  color: string
  disabled?: boolean
  children: React.ReactNode
}): JSX.Element {
  return (
    <button
      onClick={onClick}
      title={title}
      aria-label={title}
      disabled={disabled}
      style={{
        width: 30,
        height: 30,
        border: 'none',
        borderRadius: 6,
        background: disabled ? 'rgba(255,255,255,0.03)' : `${color}20`,
        color: disabled ? 'var(--text-muted)' : color,
        cursor: disabled ? 'not-allowed' : 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        transition: 'all 0.15s ease',
        opacity: disabled ? 0.4 : 1,
        flexShrink: 0
      }}
      onMouseEnter={(e) => {
        if (!disabled) e.currentTarget.style.background = `${color}35`
      }}
      onMouseLeave={(e) => {
        if (!disabled) e.currentTarget.style.background = `${color}20`
      }}
    >
      {children}
    </button>
  )
}

export function PreviewSection(): JSX.Element {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const animFrameRef = useRef<number>(0)
  const pausedElapsedRef = useRef<number>(0)
  const playStartWallRef = useRef<number>(0)
  const canvasSizeRef = useRef<{ width: number; height: number }>({ width: 0, height: 0 })

  const macro = useEditorStore((s) => s.macro)
  const selectedEventIds = useEditorStore((s) => s.selectedEventIds)
  const selectEvents = useEditorStore((s) => s.selectEvents)
  const isPreviewPlaying = useEditorStore((s) => s.isPreviewPlaying)
  const isPreviewPaused = useEditorStore((s) => s.isPreviewPaused)
  const previewElapsedMs = useEditorStore((s) => s.previewElapsedMs)
  const previewSpeed = useEditorStore((s) => s.previewSpeed)

  // Compute scaling factors to fit mouse events into the canvas
  const getScaling = useCallback(
    (width: number, height: number) => {
      if (!macro) return { scale: 1, offsetX: 0, offsetY: 0, maxX: 1920, maxY: 1080 }
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
      return { scale, offsetX, offsetY, maxX, maxY }
    },
    [macro]
  )

  // Draw background grid
  const drawGrid = useCallback((ctx: CanvasRenderingContext2D, width: number, height: number) => {
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
  }, [])

  // Draw screen boundary indicator
  const drawBoundary = useCallback(
    (
      ctx: CanvasRenderingContext2D,
      scale: number,
      offsetX: number,
      offsetY: number,
      maxX: number,
      maxY: number
    ) => {
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.04)'
      ctx.lineWidth = 1
      ctx.setLineDash([4, 4])
      ctx.strokeRect(offsetX, offsetY, maxX * scale, maxY * scale)
      ctx.setLineDash([])
    },
    []
  )

  // Draw static path (when not previewing)
  const drawStatic = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas || !macro) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const rect = canvas.getBoundingClientRect()
    const dpr = window.devicePixelRatio
    canvas.width = rect.width * dpr
    canvas.height = rect.height * dpr
    ctx.scale(dpr, dpr)
    const width = rect.width
    const height = rect.height
    canvasSizeRef.current = { width, height }

    ctx.clearRect(0, 0, width, height)
    drawGrid(ctx, width, height)

    const mouseEvents = macro.events.filter(
      (e) => e.type === 'mouse_move' || e.type === 'mouse_click'
    )
    if (mouseEvents.length === 0) return

    const { scale, offsetX, offsetY, maxX, maxY } = getScaling(width, height)
    drawBoundary(ctx, scale, offsetX, offsetY, maxX, maxY)

    // Draw path using smooth bezier curves (midpoint technique)
    const moves = mouseEvents.filter((e) => e.type === 'mouse_move')
    if (moves.length > 1) {
      ctx.strokeStyle = 'rgba(6, 182, 212, 0.25)'
      ctx.lineWidth = 1.5
      ctx.beginPath()
      const sx = (moves[0].x ?? 0) * scale + offsetX
      const sy = (moves[0].y ?? 0) * scale + offsetY
      ctx.moveTo(sx, sy)
      for (let i = 1; i < moves.length; i++) {
        const cur = moves[i]
        const cx = (cur.x ?? 0) * scale + offsetX
        const cy = (cur.y ?? 0) * scale + offsetY
        if (i < moves.length - 1) {
          const next = moves[i + 1]
          const nx = (next.x ?? 0) * scale + offsetX
          const ny = (next.y ?? 0) * scale + offsetY
          const cpx = (cx + nx) / 2
          const cpy = (cy + ny) / 2
          ctx.quadraticCurveTo(cx, cy, cpx, cpy)
        } else {
          ctx.lineTo(cx, cy)
        }
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
  }, [macro, selectedEventIds, getScaling, drawGrid, drawBoundary])

  // Animated preview playback frame
  const drawPreviewFrame = useCallback(
    (elapsed: number) => {
      const canvas = canvasRef.current
      if (!macro) return
      const ctx = canvas?.getContext('2d')
      if (!canvas || !ctx) return

      const rect = canvas.getBoundingClientRect()
      const dpr = window.devicePixelRatio
      canvas.width = rect.width * dpr
      canvas.height = rect.height * dpr
      ctx.scale(dpr, dpr)
      const width = rect.width
      const height = rect.height

      ctx.clearRect(0, 0, width, height)
      drawGrid(ctx, width, height)

      const { scale, offsetX, offsetY, maxX, maxY } = getScaling(width, height)
      drawBoundary(ctx, scale, offsetX, offsetY, maxX, maxY)

      // Find current event index
      let currentIdx = 0
      for (let i = 0; i < macro.events.length; i++) {
        if (macro.events[i].timestamp <= elapsed) {
          currentIdx = i
        } else {
          break
        }
      }

      // Draw trail of past mouse moves (fading gradient with smooth curves)
      const pastMoves = macro.events.filter(
        (e, i) => (e.type === 'mouse_move' || e.type === 'mouse_click') && i <= currentIdx
      )
      if (pastMoves.length > 1) {
        for (let i = 1; i < pastMoves.length; i++) {
          const progress = i / pastMoves.length
          ctx.strokeStyle = `rgba(6, 182, 212, ${0.1 + progress * 0.4})`
          ctx.lineWidth = 1 + progress
          const px = (pastMoves[i - 1].x ?? 0) * scale + offsetX
          const py = (pastMoves[i - 1].y ?? 0) * scale + offsetY
          const cx = (pastMoves[i].x ?? 0) * scale + offsetX
          const cy = (pastMoves[i].y ?? 0) * scale + offsetY
          const cpx = (px + cx) / 2
          const cpy = (py + cy) / 2
          ctx.beginPath()
          ctx.moveTo(px, py)
          ctx.quadraticCurveTo(cx, cy, cpx, cpy)
          ctx.stroke()
        }
      }

      // Draw future path dimmed with smooth curves
      const futureMoves = macro.events.filter(
        (e, i) => (e.type === 'mouse_move' || e.type === 'mouse_click') && i > currentIdx
      )
      if (futureMoves.length > 1 && pastMoves.length > 0) {
        ctx.strokeStyle = 'rgba(6, 182, 212, 0.08)'
        ctx.lineWidth = 1
        const lastPast = pastMoves[pastMoves.length - 1]
        ctx.beginPath()
        ctx.moveTo(
          (lastPast.x ?? 0) * scale + offsetX,
          (lastPast.y ?? 0) * scale + offsetY
        )
        for (let i = 0; i < futureMoves.length; i++) {
          const prev = i === 0 ? lastPast : futureMoves[i - 1]
          const cur = futureMoves[i]
          const px = (prev.x ?? 0) * scale + offsetX
          const py = (prev.y ?? 0) * scale + offsetY
          const cx = (cur.x ?? 0) * scale + offsetX
          const cy = (cur.y ?? 0) * scale + offsetY
          ctx.quadraticCurveTo(cx, cy, (px + cx) / 2, (py + cy) / 2)
        }
        const last = futureMoves[futureMoves.length - 1]
        ctx.lineTo((last.x ?? 0) * scale + offsetX, (last.y ?? 0) * scale + offsetY)
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

      // Progress bar at canvas bottom
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
    [macro, getScaling, selectEvents, drawGrid, drawBoundary]
  )

  // Get current elapsed time
  const getElapsed = useCallback((): number => {
    const speed = useEditorStore.getState().previewSpeed
    return pausedElapsedRef.current + (performance.now() - playStartWallRef.current) * speed
  }, [])

  // Preview control callbacks
  const startPreview = useCallback(() => {
    if (!macro || macro.events.length === 0) return
    pausedElapsedRef.current = 0
    playStartWallRef.current = performance.now()
    const store = useEditorStore.getState()
    store.setPreviewPlaying(true)
    store.setPreviewPaused(false)
    store.setPreviewElapsedMs(0)
  }, [macro])

  const pausePreview = useCallback(() => {
    pausedElapsedRef.current = getElapsed()
    cancelAnimationFrame(animFrameRef.current)
    useEditorStore.getState().setPreviewPaused(true)
  }, [getElapsed])

  const resumePreview = useCallback(() => {
    playStartWallRef.current = performance.now()
    useEditorStore.getState().setPreviewPaused(false)
  }, [])

  const stopPreview = useCallback(() => {
    cancelAnimationFrame(animFrameRef.current)
    animFrameRef.current = 0
    pausedElapsedRef.current = 0
    const store = useEditorStore.getState()
    store.setPreviewPlaying(false)
    store.setPreviewPaused(false)
    store.setPreviewElapsedMs(0)
    drawStatic()
  }, [drawStatic])

  // Seek to a specific time (used by scrubber)
  const handleSeek = useCallback(
    (ms: number) => {
      pausedElapsedRef.current = ms
      playStartWallRef.current = performance.now()
      useEditorStore.getState().setPreviewElapsedMs(ms)
      // If paused or not playing, redraw frame at the seek position
      const state = useEditorStore.getState()
      if (!state.isPreviewPlaying || state.isPreviewPaused) {
        drawPreviewFrame(ms)
      }
    },
    [drawPreviewFrame]
  )

  // Animation loop
  const animatePreview = useCallback(() => {
    if (!macro) return
    const state = useEditorStore.getState()
    if (state.isPreviewPaused) return

    const elapsed = getElapsed()

    if (elapsed >= macro.duration) {
      stopPreview()
      return
    }

    state.setPreviewElapsedMs(elapsed)
    drawPreviewFrame(elapsed)
    animFrameRef.current = requestAnimationFrame(animatePreview)
  }, [macro, drawPreviewFrame, stopPreview, getElapsed])

  // Start/stop RAF when play/pause state changes
  useEffect(() => {
    if (isPreviewPlaying && !isPreviewPaused) {
      animFrameRef.current = requestAnimationFrame(animatePreview)
    }
    return () => {
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current)
      }
    }
  }, [isPreviewPlaying, isPreviewPaused, animatePreview])

  // Redraw static when data changes (and not previewing)
  useEffect(() => {
    if (!isPreviewPlaying) {
      drawStatic()
    }
  }, [macro, selectedEventIds, isPreviewPlaying, drawStatic])

  const canPlay = macro ? macro.events.length > 0 : false
  const duration = macro?.duration ?? 0

  return (
    <>
      {/* Preview control bar */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          padding: '4px 10px',
          background: 'var(--bg-secondary)',
          borderRadius: 8,
          border: '1px solid var(--border-color)',
          flexShrink: 0,
          minHeight: 36
        }}
      >
        {/* Play / Pause+Resume / Stop buttons */}
        {!isPreviewPlaying ? (
          <CtrlBtn
            onClick={startPreview}
            disabled={!canPlay}
            color="#06b6d4"
            title="Preview playback (visual only)"
          >
            <PlayIcon />
          </CtrlBtn>
        ) : (
          <>
            {isPreviewPaused ? (
              <CtrlBtn onClick={resumePreview} color="#06b6d4" title="Resume preview">
                <PlayIcon />
              </CtrlBtn>
            ) : (
              <CtrlBtn onClick={pausePreview} color="#f59e0b" title="Pause preview">
                <PauseIcon />
              </CtrlBtn>
            )}
            <CtrlBtn onClick={stopPreview} color="#ef4444" title="Stop preview">
              <StopIcon />
            </CtrlBtn>
          </>
        )}

        {/* Seek scrubber */}
        <input
          type="range"
          min={0}
          max={duration}
          step={10}
          value={previewElapsedMs}
          onChange={(e) => handleSeek(Number(e.target.value))}
          style={{
            flex: 1,
            accentColor: 'var(--accent-cyan)',
            cursor: 'pointer',
            height: 4
          }}
        />

        {/* Time display */}
        <span
          style={{
            fontSize: 11,
            color: 'var(--text-muted)',
            fontVariantNumeric: 'tabular-nums',
            minWidth: 90,
            textAlign: 'right',
            fontFamily: 'monospace',
            flexShrink: 0
          }}
        >
          {formatPreviewTime(previewElapsedMs)} / {formatPreviewTime(duration)}
        </span>

        {/* Speed selector */}
        <select
          value={previewSpeed}
          onChange={(e) => {
            const newSpeed = Number(e.target.value)
            // Preserve elapsed position when changing speed mid-playback
            if (isPreviewPlaying && !isPreviewPaused) {
              pausedElapsedRef.current = getElapsed()
              playStartWallRef.current = performance.now()
            }
            useEditorStore.getState().setPreviewSpeed(newSpeed)
          }}
          style={{
            padding: '3px 6px',
            borderRadius: 4,
            fontSize: 11,
            border: '1px solid var(--border-color)',
            background: 'var(--bg-primary)',
            color: 'var(--text-muted)',
            cursor: 'pointer',
            flexShrink: 0
          }}
        >
          {[0.25, 0.5, 1, 1.5, 2, 4].map((s) => (
            <option key={s} value={s}>
              {s}x
            </option>
          ))}
        </select>
      </div>

      {/* Canvas container */}
      <div
        style={{
          height: 220,
          background: 'var(--bg-secondary)',
          borderRadius: 8,
          border: '1px solid var(--border-color)',
          overflow: 'hidden',
          flexShrink: 0
        }}
      >
        <canvas
          ref={canvasRef}
          role="img"
          aria-label="Mouse path visualization"
          style={{ width: '100%', height: '100%', display: 'block' }}
        />
      </div>
    </>
  )
}
