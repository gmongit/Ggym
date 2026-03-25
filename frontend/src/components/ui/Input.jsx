export default function Input({ label, error, className = '', ...props }) {
  return (
    <div className="space-y-1">
      {label && <label className="text-sm font-medium" style={{ color: 'var(--text-soft)' }}>{label}</label>}
      <input className={`ios-input ${error ? 'ring-2 ring-ios-red/30' : ''} ${className}`} {...props} />
      {error && <p className="text-xs text-ios-red">{error}</p>}
    </div>
  )
}
