import { useState } from 'react'

interface HotkeyInputProps {
  value: string
  onChange: (value: string) => void
}

export function HotkeyInput({ value, onChange }: HotkeyInputProps): JSX.Element {
  const [isCapturing, setIsCapturing] = useState(false)

  const handleKeyDown = (e: React.KeyboardEvent): void => {
    e.preventDefault()
    e.stopPropagation()

    const parts: string[] = []
    if (e.ctrlKey) parts.push('Ctrl')
    if (e.shiftKey) parts.push('Shift')
    if (e.altKey) parts.push('Alt')
    if (e.metaKey) parts.push('Meta')

    const key = e.key
    if (!['Control', 'Shift', 'Alt', 'Meta'].includes(key)) {
      parts.push(key.length === 1 ? key.toUpperCase() : key)
      onChange(parts.join('+'))
      setIsCapturing(false)
    }
  }

  return (
    <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
      <input
        type="text"
        readOnly
        value={isCapturing ? 'Press a key...' : value || '—'}
        onFocus={() => setIsCapturing(true)}
        onBlur={() => setIsCapturing(false)}
        onKeyDown={isCapturing ? handleKeyDown : undefined}
        style={{
          width: 140,
          padding: '5px 10px',
          borderRadius: 6,
          border: `1px solid ${isCapturing ? 'var(--accent-cyan)' : 'var(--border-color)'}`,
          background: 'var(--bg-primary)',
          color: isCapturing ? 'var(--accent-cyan)' : 'var(--text-primary)',
          fontSize: 12,
          textAlign: 'center',
          cursor: 'pointer',
          outline: 'none',
          transition: 'border-color 0.15s'
        }}
      />
      {value && (
        <button
          onClick={() => onChange('')}
          style={{
            width: 20,
            height: 20,
            borderRadius: 4,
            border: 'none',
            background: 'rgba(255,255,255,0.05)',
            color: 'var(--text-muted)',
            cursor: 'pointer',
            fontSize: 12,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          ×
        </button>
      )}
    </div>
  )
}
