import React, { useState, useEffect, useRef } from 'react'
import ReactDOM from 'react-dom/client'

type OverlayStatus = 'idle' | 'recording' | 'playing' | 'paused'

interface StatusUpdate {
  status: OverlayStatus
  elapsedMs: number
}

const statusConfig: Record<OverlayStatus, { color: string; label: string }> = {
  idle: { color: '#22c55e', label: 'Idle' },
  recording: { color: '#ef4444', label: 'Recording' },
  playing: { color: '#06b6d4', label: 'Playing' },
  paused: { color: '#f59e0b', label: 'Paused' }
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
  const [hovered, setHovered] = useState(false)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const baseElapsedRef = useRef(0)
  const timerStartRef = useRef(0)

  useEffect(() => {
    const unsub = window.api.onOverlayStatus((data: unknown) => {
      const update = data as StatusUpdate
      setStatus(update.status)
      setElapsedMs(update.elapsedMs)
      // Store the elapsed offset so local timer can continue from it
      baseElapsedRef.current = update.elapsedMs
      timerStartRef.current = Date.now()
    })
    return unsub
  }, [])

  // Local timer for recording mode (recording doesn't send periodic progress)
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
        gap: 10,
        padding: '0 14px',
        borderRadius: 10,
        background: hovered ? 'rgba(13, 17, 23, 0.95)' : 'rgba(13, 17, 23, 0.88)',
        border: `1px solid ${hovered ? config.color : 'rgba(255,255,255,0.1)'}`,
        cursor: 'pointer',
        transition: 'all 0.2s ease',
        boxSizing: 'border-box',
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
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

      {/* Timer */}
      {showTimer && (
        <span
          style={{
            fontSize: 12,
            fontWeight: 500,
            color: config.color,
            fontVariantNumeric: 'tabular-nums',
            letterSpacing: 0.5
          }}
        >
          {formatTime(elapsedMs)}
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
