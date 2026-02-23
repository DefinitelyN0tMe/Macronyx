import { useAnalyticsStore } from '../../stores/analyticsStore'

const tabs = [
  { id: 'overview' as const, label: 'Overview' },
  { id: 'macro' as const, label: 'Per-Macro' },
  { id: 'performance' as const, label: 'Performance' }
]

export function DashboardTabs(): JSX.Element {
  const activeTab = useAnalyticsStore((s) => s.activeTab)
  const setActiveTab = useAnalyticsStore((s) => s.setActiveTab)

  return (
    <div
      style={{
        display: 'flex',
        gap: 2,
        background: 'var(--bg-primary)',
        borderRadius: 8,
        padding: 3,
        marginBottom: 16
      }}
    >
      {tabs.map((tab) => {
        const isActive = activeTab === tab.id
        return (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{
              flex: 1,
              padding: '6px 12px',
              border: 'none',
              borderRadius: 6,
              background: isActive ? 'var(--bg-secondary)' : 'transparent',
              color: isActive ? 'var(--text-primary)' : 'var(--text-muted)',
              fontSize: 12,
              fontWeight: isActive ? 600 : 500,
              cursor: 'pointer',
              transition: 'all 0.15s ease'
            }}
          >
            {tab.label}
          </button>
        )
      })}
    </div>
  )
}
