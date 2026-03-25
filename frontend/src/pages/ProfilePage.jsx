import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { THEMES, getTheme, setTheme, WALLPAPERS, getWallpaper, setWallpaper } from '../store/theme'
import PageLayout from '../components/layout/PageLayout'
import Card from '../components/ui/Card'
import Button from '../components/ui/Button'
import Modal from '../components/ui/Modal'
import Input from '../components/ui/Input'
import { useAuth } from '../hooks/useAuth'
import { useAddBodyMetric } from '../hooks/useMetrics'
import { authApi } from '../api/auth'

export default function ProfilePage() {
  const navigate = useNavigate()
  const { user, logout } = useAuth()
  const [activeTheme, setActiveTheme] = useState(getTheme)
  const [activeWallpaper, setActiveWallpaper] = useState(getWallpaper)
  const addMetric = useAddBodyMetric()
  const [showWeight, setShowWeight] = useState(false)
  const [showInvite, setShowInvite] = useState(false)
  const [weight, setWeight] = useState('')
  const [bodyFat, setBodyFat] = useState('')
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteLink, setInviteLink] = useState('')
  const [copied, setCopied] = useState(false)

  const handleSaveWeight = async () => {
    await addMetric.mutateAsync({
      weight_kg: parseFloat(weight),
      body_fat_percent: bodyFat ? parseFloat(bodyFat) : null,
    })
    setShowWeight(false)
    setWeight('')
    setBodyFat('')
  }

  const handleCreateInvite = async () => {
    const data = await authApi.createInvite(inviteEmail || null)
    setInviteLink(data.invite_url)
  }

  const handleCopy = () => {
    navigator.clipboard.writeText(inviteLink)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  // PWA Installations-Hinweis
  const [showInstall, setShowInstall] = useState(true)
  const isStandalone = window.matchMedia('(display-mode: standalone)').matches

  return (
    <PageLayout title="Profil">
      {/* User Info */}
      <Card>
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 bg-ios-blue rounded-full flex items-center justify-center">
            <span className="text-white text-2xl font-bold">
              {user?.username?.[0]?.toUpperCase() || '?'}
            </span>
          </div>
          <div>
            <p className="font-bold text-lg">{user?.username}</p>
            <p className="text-ios-gray-1 text-sm">{user?.email}</p>
          </div>
        </div>
      </Card>

      {/* Körpergewicht */}
      <div>
        <p className="ios-section-title">Körperdaten</p>
        <Card onClick={() => setShowWeight(true)}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-2xl">⚖️</span>
              <div>
                <p className="font-medium">Gewicht eintragen</p>
                <p className="text-xs text-ios-gray-1">Täglich für beste Trends</p>
              </div>
            </div>
            <span className="text-ios-gray-2">›</span>
          </div>
        </Card>
      </div>

      {/* Trainingspläne */}
      <div>
        <p className="ios-section-title">Training</p>
        <Card onClick={() => navigate('/plans')}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-2xl">📋</span>
              <div>
                <p className="font-medium">Trainingspläne</p>
                <p className="text-xs text-ios-gray-1">Splits definieren & verwalten</p>
              </div>
            </div>
            <span className="text-ios-gray-2">›</span>
          </div>
        </Card>
      </div>

      {/* Theme Auswahl */}
      <div>
        <p className="ios-section-title">Design</p>
        <div className="grid grid-cols-3 gap-3 px-0">
          {THEMES.map((theme) => {
            const isActive = activeTheme === theme.id
            return (
              <button
                key={theme.id}
                onClick={() => {
                  setTheme(theme.id)
                  setActiveTheme(theme.id)
                }}
                className="rounded-2xl overflow-hidden transition-transform active:scale-95"
                style={{
                  border: isActive
                    ? `2px solid ${theme.colors[1]}`
                    : '2px solid transparent',
                  boxShadow: isActive
                    ? `0 0 14px ${theme.colors[1]}55`
                    : 'none',
                }}
              >
                {/* Color preview */}
                <div
                  className="h-14 w-full relative flex items-center justify-center gap-1"
                  style={{ background: theme.colors[0] }}
                >
                  {theme.colors.slice(1).map((c, i) => (
                    <div
                      key={i}
                      className="w-5 h-5 rounded-full"
                      style={{
                        background: c,
                        boxShadow: `0 0 8px ${c}88`,
                      }}
                    />
                  ))}
                  {isActive && (
                    <div
                      className="absolute top-1 right-1 w-4 h-4 rounded-full flex items-center justify-center text-[9px]"
                      style={{ background: theme.colors[1], color: '#fff' }}
                    >
                      ✓
                    </div>
                  )}
                </div>
                {/* Name */}
                <div
                  className="py-1.5 px-1 text-center"
                  style={{
                    background: 'var(--surface)',
                    borderTop: `1px solid ${theme.colors[1]}33`,
                  }}
                >
                  <p
                    className="text-[10px] font-semibold leading-tight"
                    style={{ color: isActive ? theme.colors[1] : 'var(--text-muted)' }}
                  >
                    {theme.name}
                  </p>
                </div>
              </button>
            )
          })}
        </div>
      </div>

      {/* Wallpaper */}
      <div>
        <p className="ios-section-title">Hintergrundbild</p>
        <div className="flex gap-3">
          {WALLPAPERS.map((wp) => {
            const isActive = activeWallpaper === wp.id
            return (
              <button
                key={wp.id}
                onClick={() => { setWallpaper(wp.id); setActiveWallpaper(wp.id) }}
                className="flex-1 rounded-2xl overflow-hidden active:scale-95 transition-transform"
                style={{
                  border: isActive ? `2px solid var(--accent)` : '2px solid var(--border)',
                  boxShadow: isActive ? '0 0 14px var(--accent-dim)' : 'none',
                }}
              >
                {wp.preview ? (
                  <div className="relative h-20 w-full">
                    <img
                      src={wp.preview}
                      alt={wp.name}
                      className="w-full h-full object-cover"
                      style={{ opacity: 0.75 }}
                    />
                    {isActive && (
                      <div
                        className="absolute top-1 right-1 w-5 h-5 rounded-full flex items-center justify-center text-[10px] text-white font-bold"
                        style={{ background: 'var(--accent)' }}
                      >
                        ✓
                      </div>
                    )}
                  </div>
                ) : (
                  <div
                    className="h-20 w-full flex items-center justify-center text-2xl"
                    style={{ background: 'var(--chip-bg)' }}
                  >
                    🚫
                  </div>
                )}
                <div
                  className="py-1.5 text-center"
                  style={{ background: 'var(--surface)', borderTop: '1px solid var(--border-subtle)' }}
                >
                  <p
                    className="text-[11px] font-semibold"
                    style={{ color: isActive ? 'var(--accent-bright)' : 'var(--text-muted)' }}
                  >
                    {wp.name}
                  </p>
                </div>
              </button>
            )
          })}
        </div>
      </div>

      {/* Freunde einladen */}
      <div>
        <p className="ios-section-title">Social</p>
        <Card onClick={() => setShowInvite(true)}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-2xl">👥</span>
              <div>
                <p className="font-medium">Freund einladen</p>
                <p className="text-xs text-ios-gray-1">Einladungslink generieren</p>
              </div>
            </div>
            <span className="text-ios-gray-2">›</span>
          </div>
        </Card>
      </div>

      {/* PWA Installation */}
      {!isStandalone && showInstall && (
        <div>
          <p className="ios-section-title">App installieren</p>
          <Card>
            <div className="flex items-start gap-3">
              <span className="text-2xl mt-1">📱</span>
              <div className="flex-1">
                <p className="font-medium">Zum Homescreen hinzufügen</p>
                <p className="text-sm text-ios-gray-1 mt-1">
                  <span className="font-semibold">iOS Safari:</span> Tippe auf{' '}
                  <span className="inline-block bg-ios-gray-6 px-1.5 py-0.5 rounded text-xs">Teilen ↑</span>
                  {' '}→{' '}
                  <span className="inline-block bg-ios-gray-6 px-1.5 py-0.5 rounded text-xs">Zum Homescreen</span>
                </p>
                <p className="text-sm text-ios-gray-1 mt-1">
                  <span className="font-semibold">Android Chrome:</span> Tippe auf{' '}
                  <span className="inline-block bg-ios-gray-6 px-1.5 py-0.5 rounded text-xs">⋮</span>
                  {' '}→ App installieren
                </p>
              </div>
              <button onClick={() => setShowInstall(false)} className="text-ios-gray-2 text-sm">✕</button>
            </div>
          </Card>
        </div>
      )}

      {/* Abmelden */}
      <div>
        <p className="ios-section-title">Account</p>
        <Card>
          <button onClick={logout} className="w-full text-left text-ios-red font-medium py-1">
            Abmelden
          </button>
        </Card>
      </div>

      {/* Modal: Gewicht eintragen */}
      <Modal open={showWeight} onClose={() => setShowWeight(false)} title="Gewicht eintragen">
        <div className="space-y-4">
          <div>
            <label className="text-xs font-semibold text-ios-gray-1 uppercase tracking-wide">Körpergewicht (kg)</label>
            <input className="ios-input mt-1 text-center text-3xl font-bold" type="number" inputMode="decimal"
              step="0.1" placeholder="80.0" value={weight} onChange={(e) => setWeight(e.target.value)} />
          </div>
          <Input label="Körperfettanteil % (optional)" type="number" inputMode="decimal"
            step="0.1" placeholder="z.B. 15.5" value={bodyFat} onChange={(e) => setBodyFat(e.target.value)} />
          <Button onClick={handleSaveWeight} disabled={!weight || addMetric.isPending} className="w-full">
            Speichern
          </Button>
        </div>
      </Modal>

      {/* Modal: Freund einladen */}
      <Modal open={showInvite} onClose={() => { setShowInvite(false); setInviteLink(''); setInviteEmail('') }} title="Freund einladen">
        {!inviteLink ? (
          <div className="space-y-4">
            <Input label="E-Mail (optional)" type="email" placeholder="freund@beispiel.de"
              value={inviteEmail} onChange={(e) => setInviteEmail(e.target.value)} />
            <p className="text-sm text-ios-gray-1">Der Link ist 7 Tage gültig.</p>
            <Button onClick={handleCreateInvite} className="w-full">Link generieren</Button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="bg-ios-gray-6 rounded-xl p-3 text-xs break-all text-ios-gray-1 font-mono">
              {inviteLink}
            </div>
            <Button onClick={handleCopy} className="w-full" variant={copied ? 'secondary' : 'primary'}>
              {copied ? '✓ Kopiert!' : '📋 Link kopieren'}
            </Button>
            <p className="text-xs text-ios-gray-1 text-center">
              Sende diesen Link an deinen Freund. Er kann sich damit direkt registrieren.
            </p>
          </div>
        )}
      </Modal>
    </PageLayout>
  )
}
