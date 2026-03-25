export default function Button({ children, onClick, variant = 'primary', className = '', disabled = false, type = 'button' }) {
  const base = 'font-semibold rounded-2xl px-6 py-3 active:scale-95 transition-all duration-75 select-none disabled:opacity-40 disabled:pointer-events-none'

  const variants = {
    primary:   'ios-btn-primary',
    secondary: 'ios-btn-secondary',
    danger:    'font-semibold rounded-2xl px-6 py-3 text-white active:scale-95 transition-transform duration-75 select-none',
    ghost:     'font-medium text-sm',
  }

  const dangerStyle = variant === 'danger'
    ? { background: '#ff3b30', boxShadow: '0 0 18px rgba(255,59,48,0.35)' }
    : {}

  const ghostStyle = variant === 'ghost'
    ? { color: 'var(--accent-bright)' }
    : {}

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`${variant === 'primary' || variant === 'secondary' ? '' : base} ${variants[variant]} ${className}`}
      style={{ ...dangerStyle, ...ghostStyle }}
    >
      {children}
    </button>
  )
}
