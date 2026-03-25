import { NavLink } from 'react-router-dom'

const tabs = [
  { to: '/training', icon: '🏋️', label: 'Training' },
  { to: '/progress', icon: '📊', label: 'Progress' },
  { to: '/coach', icon: '🤖', label: 'Coach' },
  { to: '/nutrition', icon: '🍎', label: 'Ernährung' },
  { to: '/profile', icon: '👤', label: 'Profil' },
]

export default function BottomNav() {
  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 border-t"
      style={{
        background: 'var(--nav-bg)',
        backdropFilter: 'blur(24px)',
        WebkitBackdropFilter: 'blur(24px)',
        borderColor: 'var(--border)',
        paddingBottom: 'env(safe-area-inset-bottom)',
      }}
    >
      <div className="flex">
        {tabs.map(({ to, icon, label }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `relative flex-1 flex flex-col items-center py-2 gap-0.5 transition-colors duration-100 select-none`
            }
            style={({ isActive }) => ({
              color: isActive ? 'var(--accent-bright)' : 'var(--text-muted)',
            })}
          >
            {({ isActive }) => (
              <>
                <span className="text-2xl leading-none">{icon}</span>
                <span
                  className="text-[10px] font-medium"
                  style={isActive ? { color: 'var(--accent-bright)', textShadow: '0 0 8px var(--accent-dim)' } : {}}
                >
                  {label}
                </span>
                {isActive && (
                  <span
                    className="absolute bottom-1 w-1 h-1 rounded-full"
                    style={{ background: 'var(--accent-bright)', boxShadow: '0 0 6px var(--accent)' }}
                  />
                )}
              </>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  )
}
