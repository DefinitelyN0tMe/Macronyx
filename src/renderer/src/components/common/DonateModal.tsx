interface DonateModalProps {
  isOpen: boolean
  onClose: () => void
}

export function DonateModal({ isOpen, onClose }: DonateModalProps): JSX.Element | null {
  if (!isOpen) return null

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0, 0, 0, 0.6)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 100
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: 'var(--bg-secondary)',
          borderRadius: 14,
          border: '1px solid var(--border-color)',
          padding: 28,
          width: 380,
          maxWidth: '90vw',
          position: 'relative'
        }}
      >
        {/* Close button */}
        <button
          onClick={onClose}
          style={{
            position: 'absolute',
            top: 12,
            right: 12,
            width: 28,
            height: 28,
            border: 'none',
            background: 'transparent',
            color: 'var(--text-muted)',
            cursor: 'pointer',
            fontSize: 18,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: 6
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.color = 'var(--text-primary)'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.color = 'var(--text-muted)'
          }}
        >
          &times;
        </button>

        {/* Heart icon */}
        <div style={{ textAlign: 'center', marginBottom: 16 }}>
          <svg
            width="40"
            height="40"
            viewBox="0 0 24 24"
            fill="#ec4899"
            stroke="none"
          >
            <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z" />
          </svg>
        </div>

        <h3
          style={{
            textAlign: 'center',
            fontSize: 18,
            fontWeight: 700,
            color: 'var(--text-primary)',
            margin: '0 0 6px 0'
          }}
        >
          Support Macronyx
        </h3>

        <p
          style={{
            textAlign: 'center',
            fontSize: 12,
            color: 'var(--text-muted)',
            margin: '0 0 24px 0',
            lineHeight: 1.5
          }}
        >
          If you find Macronyx useful, consider supporting the developer.
          Every contribution helps keep the project alive!
        </p>

        {/* Ko-fi button */}
        <a
          href="https://ko-fi.com/definitelyforme"
          target="_blank"
          rel="noopener noreferrer"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 10,
            width: '100%',
            padding: '12px 16px',
            borderRadius: 8,
            border: 'none',
            background: '#FF5E5B',
            color: 'white',
            cursor: 'pointer',
            fontSize: 14,
            fontWeight: 600,
            textDecoration: 'none',
            transition: 'opacity 0.15s',
            marginBottom: 12
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.opacity = '0.9'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.opacity = '1'
          }}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="white">
            <path d="M23.881 8.948c-.773-4.085-4.859-4.593-4.859-4.593H.723c-.604 0-.679.798-.679.798s-.082 7.324-.022 11.822c.164 2.424 2.586 2.672 2.586 2.672s8.267-.023 11.966-.049c2.438-.426 2.683-2.566 2.658-3.734 4.352.24 7.422-2.831 6.649-6.916zm-11.062 3.511c-1.246 1.453-4.011 3.976-4.011 3.976s-.121.119-.31.023c-.076-.057-.108-.09-.108-.09-.443-.441-3.368-3.049-4.034-3.954-.709-.965-1.041-2.7-.091-3.71.951-1.01 3.005-1.086 4.363.407 0 0 1.565-1.782 3.468-.963 1.904.82 1.832 3.011.723 4.311z" />
          </svg>
          Support on Ko-fi
        </a>

        {/* PayPal section */}
        <div
          style={{
            borderTop: '1px solid var(--border-subtle)',
            paddingTop: 16,
            textAlign: 'center'
          }}
        >
          <p
            style={{
              fontSize: 11,
              color: 'var(--text-muted)',
              margin: '0 0 12px 0',
              textTransform: 'uppercase',
              letterSpacing: 1,
              fontWeight: 600
            }}
          >
            Or tip via PayPal
          </p>
          <div
            style={{
              display: 'inline-block',
              background: 'white',
              borderRadius: 10,
              padding: 8
            }}
          >
            <img
              src={new URL('../../assets/paypal-qr.png', import.meta.url).href}
              alt="PayPal QR Code"
              style={{
                width: 160,
                height: 160,
                display: 'block'
              }}
              onError={(e) => {
                // Hide QR section if image not found
                const target = e.currentTarget.parentElement?.parentElement
                if (target) target.style.display = 'none'
              }}
            />
          </div>
        </div>

        {/* Footer note */}
        <p
          style={{
            textAlign: 'center',
            fontSize: 10,
            color: 'var(--text-muted)',
            margin: '16px 0 0 0',
            opacity: 0.7
          }}
        >
          Thank you for your support!
        </p>
      </div>
    </div>
  )
}
