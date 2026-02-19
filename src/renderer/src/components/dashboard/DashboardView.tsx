import { useMacroStore } from '../../stores/macroStore'
import { useAppStore } from '../../stores/appStore'
import { formatDuration } from '../../utils/formatTime'

export function DashboardView(): JSX.Element {
  const macros = useMacroStore((s) => s.macros)
  const setActiveView = useAppStore((s) => s.setActiveView)
  const recentMacros = macros.slice(0, 5)

  return (
    <div className="animate-slide-in" style={{ maxWidth: 900 }}>
      <h1
        style={{
          fontSize: 24,
          fontWeight: 700,
          marginBottom: 4,
          color: 'var(--text-primary)'
        }}
      >
        Welcome to Macronyx
      </h1>
      <p style={{ color: 'var(--text-secondary)', marginBottom: 24, fontSize: 13 }}>
        Record and replay mouse, keyboard, and scroll actions with precision.
      </p>

      {/* Quick Actions */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 32 }}>
        <QuickActionCard
          title="New Recording"
          description="Start capturing mouse and keyboard"
          color="var(--danger)"
          icon={
            <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
              <circle cx="12" cy="12" r="8" />
            </svg>
          }
          onClick={() => setActiveView('recorder')}
        />
        <QuickActionCard
          title="Open Library"
          description={`${macros.length} macro${macros.length !== 1 ? 's' : ''} saved`}
          color="var(--accent-cyan)"
          icon={
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M22 19a2 2 0 01-2 2H4a2 2 0 01-2-2V5a2 2 0 012-2h5l2 3h9a2 2 0 012 2z" />
            </svg>
          }
          onClick={() => setActiveView('library')}
        />
        <QuickActionCard
          title="Settings"
          description="Hotkeys, recording, playback"
          color="var(--accent-violet)"
          icon={
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="3" />
              <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" />
            </svg>
          }
          onClick={() => setActiveView('settings')}
        />
      </div>

      {/* Recent Macros */}
      <div>
        <h2 style={{ fontSize: 15, fontWeight: 600, marginBottom: 12, color: 'var(--text-primary)' }}>
          Recent Macros
        </h2>
        {recentMacros.length === 0 ? (
          <div
            style={{
              padding: 32,
              textAlign: 'center',
              color: 'var(--text-muted)',
              background: 'var(--bg-secondary)',
              borderRadius: 8,
              border: '1px solid var(--border-color)'
            }}
          >
            No macros yet. Start by creating a new recording!
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {recentMacros.map((macro) => (
              <div
                key={macro.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '10px 14px',
                  background: 'var(--bg-secondary)',
                  borderRadius: 8,
                  border: '1px solid var(--border-color)',
                  cursor: 'pointer',
                  transition: 'border-color 0.15s'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = 'var(--accent-cyan)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = 'var(--border-color)'
                }}
                onClick={() => {
                  useMacroStore.getState().selectMacro(macro.id)
                  setActiveView('library')
                }}
              >
                <div>
                  <div style={{ fontWeight: 600, fontSize: 13 }}>{macro.name}</div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>
                    {formatDuration(macro.duration)} &middot; {new Date(macro.updatedAt).toLocaleDateString()}
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 6 }}>
                  {macro.tags.map((tag) => (
                    <span
                      key={tag}
                      style={{
                        padding: '2px 8px',
                        borderRadius: 4,
                        background: 'rgba(6, 182, 212, 0.1)',
                        color: 'var(--accent-cyan)',
                        fontSize: 10,
                        fontWeight: 600
                      }}
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Stats */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: 12,
          marginTop: 24
        }}
      >
        <StatCard label="Total Macros" value={String(macros.length)} />
        <StatCard
          label="Total Duration"
          value={formatDuration(macros.reduce((sum, m) => sum + m.duration, 0))}
        />
        <StatCard
          label="Last Updated"
          value={
            macros.length > 0 ? new Date(macros[0].updatedAt).toLocaleDateString() : '—'
          }
        />
      </div>
    </div>
  )
}

function QuickActionCard({
  title,
  description,
  color,
  icon,
  onClick
}: {
  title: string
  description: string
  color: string
  icon: JSX.Element
  onClick: () => void
}): JSX.Element {
  return (
    <button
      onClick={onClick}
      style={{
        padding: 16,
        background: 'var(--bg-secondary)',
        border: '1px solid var(--border-color)',
        borderRadius: 10,
        cursor: 'pointer',
        textAlign: 'left',
        transition: 'border-color 0.15s, transform 0.1s',
        color: 'inherit'
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = color
        e.currentTarget.style.transform = 'translateY(-1px)'
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = 'var(--border-color)'
        e.currentTarget.style.transform = 'none'
      }}
    >
      <div style={{ color, marginBottom: 8 }}>{icon}</div>
      <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 4 }}>{title}</div>
      <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{description}</div>
    </button>
  )
}

function StatCard({ label, value }: { label: string; value: string }): JSX.Element {
  return (
    <div
      style={{
        padding: '12px 14px',
        background: 'var(--bg-secondary)',
        borderRadius: 8,
        border: '1px solid var(--border-color)'
      }}
    >
      <div style={{ fontSize: 10, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 0.5 }}>
        {label}
      </div>
      <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-primary)', marginTop: 4 }}>
        {value}
      </div>
    </div>
  )
}
