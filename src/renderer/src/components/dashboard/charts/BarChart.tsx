interface BarChartProps {
  data: { label: string; value: number }[]
  color?: string
  height?: number
}

export function BarChart({ data, color = 'var(--accent-cyan)', height = 120 }: BarChartProps): JSX.Element {
  const maxValue = Math.max(...data.map((d) => d.value), 1)

  if (data.length === 0) {
    return (
      <div style={{ height, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', fontSize: 12 }}>
        No data
      </div>
    )
  }

  return (
    <div style={{ height, display: 'flex', flexDirection: 'column' }}>
      <div style={{ flex: 1, display: 'flex', alignItems: 'flex-end', gap: 2, minHeight: 0 }}>
        {data.map((d, i) => {
          const barHeight = maxValue > 0 ? (d.value / maxValue) * 100 : 0
          return (
            <div
              key={i}
              style={{
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'flex-end',
                height: '100%'
              }}
            >
              {d.value > 0 && (
                <span style={{ fontSize: 9, color: 'var(--text-muted)', marginBottom: 2, fontVariantNumeric: 'tabular-nums' }}>
                  {d.value}
                </span>
              )}
              <div
                style={{
                  width: '100%',
                  maxWidth: 32,
                  height: `${Math.max(barHeight, 2)}%`,
                  background: color,
                  borderRadius: '3px 3px 0 0',
                  opacity: d.value > 0 ? 0.8 : 0.15,
                  transition: 'height 0.3s ease',
                  minHeight: 2
                }}
              />
            </div>
          )
        })}
      </div>
      <div style={{ display: 'flex', gap: 2, marginTop: 4 }}>
        {data.map((d, i) => (
          <div
            key={i}
            style={{
              flex: 1,
              textAlign: 'center',
              fontSize: 9,
              color: 'var(--text-muted)',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap'
            }}
          >
            {d.label}
          </div>
        ))}
      </div>
    </div>
  )
}
