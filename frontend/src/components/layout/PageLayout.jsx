export default function PageLayout({ title, subtitle, action, children, noPadding = false }) {
  return (
    <div className="min-h-dvh pb-24">
      {/* Header */}
      <div
        className="sticky top-0 z-40 border-b"
        style={{
          background: 'var(--nav-bg)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          borderColor: 'var(--border)',
        }}
      >
        <div className="px-4 pt-4 pb-3 flex items-end justify-between">
          <div>
            <h1 className="text-2xl font-bold leading-tight" style={{ color: 'var(--text)' }}>
              {title}
            </h1>
            {subtitle && (
              <p className="text-sm mt-0.5" style={{ color: 'var(--text-muted)' }}>
                {subtitle}
              </p>
            )}
          </div>
          {action && <div>{action}</div>}
        </div>
      </div>

      {/* Content */}
      <div className={noPadding ? '' : 'px-4 py-4 space-y-4'}>
        {children}
      </div>
    </div>
  )
}
