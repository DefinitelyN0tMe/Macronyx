import { useAppStore } from '../../stores/appStore'

export function TitleBar(): JSX.Element {
  const status = useAppStore((s) => s.status)

  const statusColors: Record<string, string> = {
    idle: '#6b7280',
    recording: '#ef4444',
    playing: '#22c55e',
    paused: '#f59e0b'
  }

  const statusLabels: Record<string, string> = {
    idle: 'Ready',
    recording: 'Recording',
    playing: 'Playing',
    paused: 'Paused'
  }

  return (
    <div
      className="titlebar-drag"
      style={{
        height: 32,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 8px',
        background: '#0a0e17',
        borderBottom: '1px solid var(--border-subtle)',
        flexShrink: 0
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <span
          style={{ fontSize: 13, fontWeight: 700, color: 'var(--accent-cyan)', letterSpacing: 1 }}
        >
          MACRONYX
        </span>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 4,
            padding: '2px 8px',
            borderRadius: 4,
            background: 'rgba(255,255,255,0.05)',
            fontSize: 10,
            color: statusColors[status],
            fontWeight: 600,
            textTransform: 'uppercase',
            letterSpacing: 0.5
          }}
        >
          <div
            style={{
              width: 6,
              height: 6,
              borderRadius: '50%',
              background: statusColors[status],
              animation: status === 'recording' ? 'pulse-record 1.5s infinite' : 'none'
            }}
          />
          {statusLabels[status]}
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 0 }}>
        <TitleButton onClick={() => window.api.minimizeWindow()} title="Minimize">
          <svg width="10" height="1" viewBox="0 0 10 1">
            <rect width="10" height="1" fill="currentColor" />
          </svg>
        </TitleButton>
        <TitleButton onClick={() => window.api.maximizeWindow()} title="Maximize">
          <svg width="10" height="10" viewBox="0 0 10 10">
            <rect
              x="0.5"
              y="0.5"
              width="9"
              height="9"
              fill="none"
              stroke="currentColor"
              strokeWidth="1"
            />
          </svg>
        </TitleButton>
        <TitleButton onClick={() => window.api.closeWindow()} title="Close" isClose>
          <svg width="10" height="10" viewBox="0 0 10 10">
            <line x1="0" y1="0" x2="10" y2="10" stroke="currentColor" strokeWidth="1.2" />
            <line x1="10" y1="0" x2="0" y2="10" stroke="currentColor" strokeWidth="1.2" />
          </svg>
        </TitleButton>
      </div>
    </div>
  )
}

function TitleButton({
  onClick,
  title,
  isClose,
  children
}: {
  onClick: () => void
  title: string
  isClose?: boolean
  children: React.ReactNode
}): JSX.Element {
  return (
    <button
      onClick={onClick}
      title={title}
      style={{
        width: 36,
        height: 32,
        border: 'none',
        background: 'transparent',
        color: '#9ca3af',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        transition: 'background 0.1s, color 0.1s'
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.background = isClose ? '#e81123' : 'rgba(255,255,255,0.1)'
        e.currentTarget.style.color = '#ffffff'
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = 'transparent'
        e.currentTarget.style.color = '#9ca3af'
      }}
    >
      {children}
    </button>
  )
}
