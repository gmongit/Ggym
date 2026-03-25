import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import Input from '../components/ui/Input'
import Button from '../components/ui/Button'

export default function LoginPage() {
  const { login } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await login(email, password)
    } catch (err) {
      setError(err.response?.data?.detail || 'Anmeldung fehlgeschlagen')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-dvh flex flex-col justify-center px-6">
      <div className="mb-10 text-center">
        <div className="text-6xl mb-3">🏋️</div>
        <h1 className="text-3xl font-bold" style={{ color: 'var(--text)' }}>FitTrack AI</h1>
        <p className="mt-1" style={{ color: 'var(--text-muted)' }}>Dein KI-Fitness-Coach</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="E-Mail"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="du@beispiel.de"
          autoComplete="email"
          required
        />
        <Input
          label="Passwort"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Passwort"
          autoComplete="current-password"
          required
        />
        {error && <p className="text-ios-red text-sm text-center">{error}</p>}
        <Button type="submit" disabled={loading} className="w-full">
          {loading ? 'Wird geladen...' : 'Anmelden'}
        </Button>
      </form>

      <p className="text-center text-ios-gray-1 mt-6 text-sm">
        Noch kein Konto?{' '}
        <Link to="/register" className="text-ios-blue font-medium">Registrieren</Link>
      </p>
    </div>
  )
}
