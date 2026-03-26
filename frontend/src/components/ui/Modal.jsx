import { useEffect } from 'react'

export default function Modal({ open, onClose, title, children, zIndex = 'z-50' }) {
  useEffect(() => {
    if (open) document.body.style.overflow = 'hidden'
    else document.body.style.overflow = ''
    return () => { document.body.style.overflow = '' }
  }, [open])

  if (!open) return null

  return (
    <div className={`fixed inset-0 ${zIndex} flex items-center justify-center`}>
      {/* Backdrop */}
      <div
        className="absolute inset-0"
        style={{ background: 'rgba(3, 2, 10, 0.72)', backdropFilter: 'blur(4px)', WebkitBackdropFilter: 'blur(4px)' }}
        onClick={onClose}
      />

      {/* Sheet */}
      <div
        className="relative w-full max-w-md mx-4 max-h-[90dvh] overflow-y-auto rounded-3xl
                   animate-[slideUp_0.25s_ease-out]"
        style={{
          background: 'var(--modal-bg)',
          backdropFilter: 'blur(24px)',
          WebkitBackdropFilter: 'blur(24px)',
          border: '1px solid var(--modal-border)',
          boxShadow: '0 -8px 40px rgba(0,0,0,0.5)',
        }}
      >
        <div
          className="flex items-center justify-between px-5 pt-5 pb-3"
          style={{ borderBottom: '1px solid var(--modal-border)' }}
        >
          <h2 className="text-lg font-semibold" style={{ color: 'var(--text)' }}>{title}</h2>
          <button
            onClick={onClose}
            className="text-sm font-medium"
            style={{ color: 'var(--accent-bright)' }}
          >
            Schließen
          </button>
        </div>
        <div className="px-5 py-4">{children}</div>
      </div>

      <style>{`
        @keyframes slideUp {
          from { transform: translateY(100%); opacity: 0; }
          to   { transform: translateY(0);    opacity: 1; }
        }
      `}</style>
    </div>
  )
}
