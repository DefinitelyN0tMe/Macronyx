interface DonutChartProps {
  value: number // 0-100 (percentage)
  size?: number
  strokeWidth?: number
  successColor?: string
  failColor?: string
  label?: string
}

export function DonutChart({
  value,
  size = 80,
  strokeWidth = 8,
  successColor = '#22c55e',
  failColor = '#ef4444',
  label
}: DonutChartProps): JSX.Element {
  const radius = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius
  const successDash = (value / 100) * circumference
  const failDash = circumference - successDash
  const pct = Math.round(value)

  return (
    <div style={{ position: 'relative', width: size, height: size }}>
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
        {/* Background (fail) arc */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={failColor}
          strokeWidth={strokeWidth}
          opacity={0.2}
        />
        {/* Success arc */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={successColor}
          strokeWidth={strokeWidth}
          strokeDasharray={`${successDash} ${failDash}`}
          strokeLinecap="round"
          style={{ transition: 'stroke-dasharray 0.5s ease' }}
        />
      </svg>
      <div
        style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center'
        }}
      >
        <span style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)', fontVariantNumeric: 'tabular-nums' }}>
          {pct}%
        </span>
        {label && (
          <span style={{ fontSize: 9, color: 'var(--text-muted)', marginTop: 1 }}>{label}</span>
        )}
      </div>
    </div>
  )
}
