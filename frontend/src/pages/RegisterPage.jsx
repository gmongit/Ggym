import { useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { authApi } from '../api/auth'
import { login as storeLogin } from '../store/auth'
import { useNavigate } from 'react-router-dom'
import Input from '../components/ui/Input'
import Button from '../components/ui/Button'

export default function RegisterPage() {
  const { register } = useAuth()
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const inviteToken = params.get('invite')

  const [form, setForm] = useState({ email: '', username: '', password: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const set = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      if (inviteToken) {
        const data = await authApi.acceptInvite(inviteToken, form.email, form.username, form.password)
        storeLogin(data.access_token, data.user)
        navigate('/training')
      } else {
        await register(form.email, form.username, form.password)
      }
    } catch (err) {
      setError(err.response?.data?.detail || 'Registrierung fehlgeschlagen')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-dvh flex flex-col justify-center px-6">
      <div className="mb-10 text-center">
        <div className="text-6xl mb-3">🏋️</div>
        <h1 className="text-3xl font-bold" style={{ color: 'var(--text)' }}>Konto erstellen</h1>
        {inviteToken && (
          <p className="text-ios-green font-medium mt-1 text-sm">✓ Einladungslink erkannt</p>
        )}
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <Input label="E-Mail" type="email" value={form.email} onChange={set('email')}
               placeholder="du@beispiel.de" autoComplete="email" required />
        <Input label="Benutzername" type="text" value={form.username} onChange={set('username')}
               placeholder="deinname" autoComplete="username" required />
        <Input label="Passwort" type="password" value={form.password} onChange={set('password')}
               placeholder="Mindestens 8 Zeichen" autoComplete="new-password" required minLength={8} />
        {error && <p className="text-ios-red text-sm text-center">{error}</p>}
        <Button type="submit" disabled={loading} className="w-full">
          {loading ? 'Wird erstellt...' : 'Konto erstellen'}
        </Button>
      </form>

      <p className="text-center text-ios-gray-1 mt-6 text-sm">
        Bereits registriert?{' '}
        <Link to="/login" className="text-ios-blue font-medium">Anmelden</Link>
      </p>
    </div>
  )
}
