interface ConfirmDialogProps {
  isOpen: boolean
  title: string
  message: string
  confirmLabel?: string
  cancelLabel?: string
  /** Optional third action (shown between cancel and confirm) */
  altLabel?: string
  altColor?: string
  onConfirm: () => void
  onCancel: () => void
  onAlt?: () => void
}

export function ConfirmDialog({
  isOpen,
  title,
  message,
  confirmLabel = 'Delete',
  cancelLabel = 'Cancel',
  altLabel,
  altColor,
  onConfirm,
  onCancel,
  onAlt
}: ConfirmDialogProps): JSX.Element | null {
  if (!isOpen) return null

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0, 0, 0, 0.6)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 100
      }}
      onClick={onCancel}
    >
      <div
        style={{
          background: 'var(--bg-secondary)',
          borderRadius: 12,
          border: '1px solid var(--border-color)',
          padding: 24,
          maxWidth: 400,
          width: '90%',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4)'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 8 }}>{title}</h3>
        <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 20, lineHeight: 1.5 }}>
          {message}
        </p>
        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
          <button
            onClick={onCancel}
            style={{
              padding: '8px 16px',
              borderRadius: 6,
              border: '1px solid var(--border-color)',
              background: 'transparent',
              color: 'var(--text-primary)',
              cursor: 'pointer',
              fontSize: 13,
              fontWeight: 500
            }}
          >
            {cancelLabel}
          </button>
          {altLabel && onAlt && (
            <button
              onClick={onAlt}
              style={{
                padding: '8px 16px',
                borderRadius: 6,
                border: `1px solid ${altColor || 'var(--border-color)'}`,
                background: 'transparent',
                color: altColor || 'var(--text-primary)',
                cursor: 'pointer',
                fontSize: 13,
                fontWeight: 500
              }}
            >
              {altLabel}
            </button>
          )}
          <button
            onClick={onConfirm}
            style={{
              padding: '8px 16px',
              borderRadius: 6,
              border: 'none',
              background: 'var(--danger)',
              color: 'white',
              cursor: 'pointer',
              fontSize: 13,
              fontWeight: 600
            }}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}
