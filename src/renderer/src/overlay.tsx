import React, { useState, useEffect, useRef } from 'react'
import ReactDOM from 'react-dom/client'
import { STATUS_COLORS } from '../../shared/constants'

type OverlayStatus = 'idle' | 'recording' | 'playing' | 'paused'

interface StatusUpdate {
  status: OverlayStatus
  elapsedMs: number
  totalDurationMs: number
  successCount?: number
  failedCount?: number
}

const statusConfig: Record<OverlayStatus, { color: string; label: string }> = {
  idle: { color: STATUS_COLORS.playing, label: 'Idle' },
  recording: { color: STATUS_COLORS.recording, label: 'Recording' },
  playing: { color: STATUS_COLORS.accentCyan, label: 'Playing' },
  paused: { color: STATUS_COLORS.paused, label: 'Paused' }
}

function formatTime(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000)
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
}

function OverlayWidget(): JSX.Element {
  const [status, setStatus] = useState<OverlayStatus>('idle')
  const [elapsedMs, setElapsedMs] = useState(0)
  const [totalDurationMs, setTotalDurationMs] = useState(0)
  const [successCount, setSuccessCount] = useState(0)
  const [failedCount, setFailedCount] = useState(0)
  const [hovered, setHovered] = useState(false)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const baseElapsedRef = useRef(0)
  const timerStartRef = useRef(0)

  useEffect(() => {
    const unsub = window.api.onOverlayStatus((data: unknown) => {
      const update = data as StatusUpdate
      setStatus(update.status)
      setElapsedMs(update.elapsedMs)
      if (update.totalDurationMs) setTotalDurationMs(update.totalDurationMs)
      if (update.status === 'idle') {
        setTotalDurationMs(0)
        setSuccessCount(0)
        setFailedCount(0)
      }
      if (update.successCount !== undefined) setSuccessCount(update.successCount)
      if (update.failedCount !== undefined) setFailedCount(update.failedCount)
      baseElapsedRef.current = update.elapsedMs
      timerStartRef.current = Date.now()
    })
    return unsub
  }, [])

  // Local timer for recording mode
  useEffect(() => {
    if (status === 'recording') {
      timerRef.current = setInterval(() => {
        setElapsedMs(baseElapsedRef.current + (Date.now() - timerStartRef.current))
      }, 200)
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current)
        timerRef.current = null
      }
    }
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current)
        timerRef.current = null
      }
    }
  }, [status])

  const config = statusConfig[status]
  const showTimer = status === 'recording' || status === 'playing' || status === 'paused'
  const showResults = (status === 'playing' || status === 'paused') && (successCount > 0 || failedCount > 0)

  return (
    <div
      onClick={() => {
        window.api.showMainFromOverlay()
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        padding: '0 14px',
        borderRadius: 10,
        background: hovered ? 'rgba(13, 17, 23, 0.95)' : 'rgba(13, 17, 23, 0.88)',
        border: `1px solid ${hovered ? config.color : 'rgba(255,255,255,0.1)'}`,
        cursor: 'pointer',
        transition: 'all 0.2s ease',
        boxSizing: 'border-box',
        fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        userSelect: 'none'
      }}
    >
      {/* Status dot with pulse animation for recording */}
      <div style={{ position: 'relative', width: 12, height: 12, flexShrink: 0 }}>
        {status === 'recording' && (
          <div
            style={{
              position: 'absolute',
              inset: -3,
              borderRadius: '50%',
              background: config.color,
              opacity: 0.3,
              animation: 'pulse 1.5s ease-in-out infinite'
            }}
          />
        )}
        <div
          style={{
            width: 12,
            height: 12,
            borderRadius: '50%',
            background: config.color,
            position: 'relative',
            boxShadow: `0 0 6px ${config.color}60`
          }}
        />
      </div>

      {/* Label */}
      <span
        style={{
          fontSize: 12,
          fontWeight: 600,
          color: '#e5e7eb',
          letterSpacing: 0.3,
          flex: 1
        }}
      >
        {config.label}
      </span>

      {/* Playback result counter (v1.4) */}
      {showResults && (
        <span
          style={{
            fontSize: 10,
            fontWeight: 600,
            fontVariantNumeric: 'tabular-nums',
            letterSpacing: 0.3,
            color: failedCount > 0 ? '#ef4444' : '#22c55e'
          }}
        >
          {successCount}{failedCount > 0 && <span style={{ color: '#ef4444' }}>/{failedCount}!</span>}
        </span>
      )}

      {/* Timer */}
      {showTimer && (
        <span
          style={{
            fontSize: totalDurationMs > 0 ? 11 : 12,
            fontWeight: 500,
            color: config.color,
            fontVariantNumeric: 'tabular-nums',
            letterSpacing: 0.5
          }}
        >
          {formatTime(elapsedMs)}{totalDurationMs > 0 && ` / ${formatTime(totalDurationMs)}`}
        </span>
      )}

      {/* Macronyx logo mark */}
      <svg
        width="14"
        height="14"
        viewBox="0 0 24 24"
        fill="none"
        stroke={hovered ? config.color : '#4b5563'}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        style={{ flexShrink: 0, transition: 'stroke 0.2s' }}
      >
        <rect x="3" y="3" width="7" height="7" />
        <rect x="14" y="3" width="7" height="7" />
        <rect x="14" y="14" width="7" height="7" />
        <rect x="3" y="14" width="7" height="7" />
      </svg>

      {/* Playback progress bar */}
      {totalDurationMs > 0 && (
        <div
          style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            height: 3,
            borderRadius: '0 0 10px 10px',
            overflow: 'hidden'
          }}
        >
          <div
            style={{
              width: `${Math.min(100, (elapsedMs / totalDurationMs) * 100)}%`,
              height: '100%',
              background: config.color,
              transition: 'width 0.2s linear'
            }}
          />
        </div>
      )}
    </div>
  )
}

// Inject pulse keyframes
const style = document.createElement('style')
style.textContent = `
  @keyframes pulse {
    0%, 100% { transform: scale(1); opacity: 0.3; }
    50% { transform: scale(1.5); opacity: 0.1; }
  }
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { background: transparent !important; }
`
document.head.appendChild(style)

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <OverlayWidget />
  </React.StrictMode>
)
