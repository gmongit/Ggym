export default function Card({ children, className = '', onClick }) {
  return (
    <div
      className={`ios-card ${onClick ? 'active:scale-[0.98] transition-transform duration-75 cursor-pointer' : ''} ${className}`}
      onClick={onClick}
    >
      {children}
    </div>
  )
}
