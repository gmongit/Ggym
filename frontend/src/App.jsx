import { Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { useEffect, useState } from 'react'
import BottomNav from './components/layout/BottomNav'
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import TrainingPage from './pages/TrainingPage'
import WorkoutDetailPage from './pages/WorkoutDetailPage'
import ProgressPage from './pages/ProgressPage'
import CoachPage from './pages/CoachPage'
import NutritionPage from './pages/NutritionPage'
import ProfilePage from './pages/ProfilePage'
import PlansPage from './pages/PlansPage'
import { isAuthenticated, subscribeToAuth } from './store/auth'
import { initTheme } from './store/theme'

function ProtectedRoute({ children }) {
  if (!isAuthenticated()) return <Navigate to="/login" replace />
  return children
}

function AuthRoute({ children }) {
  if (isAuthenticated()) return <Navigate to="/training" replace />
  return children
}

export default function App() {
  const location = useLocation()
  const [authed, setAuthed] = useState(isAuthenticated)
  const showNav = authed && !['/login', '/register'].includes(location.pathname)

  useEffect(() => { initTheme() }, [])
  useEffect(() => subscribeToAuth((user) => setAuthed(!!user)), [])

  return (
    <>
      <Routes>
        <Route path="/login" element={<AuthRoute><LoginPage /></AuthRoute>} />
        <Route path="/register" element={<AuthRoute><RegisterPage /></AuthRoute>} />

        <Route path="/training" element={<ProtectedRoute><TrainingPage /></ProtectedRoute>} />
        <Route path="/training/:id" element={<ProtectedRoute><WorkoutDetailPage /></ProtectedRoute>} />
        <Route path="/progress" element={<ProtectedRoute><ProgressPage /></ProtectedRoute>} />
        <Route path="/coach" element={<ProtectedRoute><CoachPage /></ProtectedRoute>} />
        <Route path="/nutrition" element={<ProtectedRoute><NutritionPage /></ProtectedRoute>} />
        <Route path="/profile" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
        <Route path="/plans" element={<ProtectedRoute><PlansPage /></ProtectedRoute>} />

        <Route path="*" element={<Navigate to={authed ? '/training' : '/login'} replace />} />
      </Routes>

      {showNav && <BottomNav />}
    </>
  )
}
