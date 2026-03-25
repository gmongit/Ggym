import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { authApi } from '../api/auth'
import { login as storeLogin, logout as storeLogout, getUser, isAuthenticated, subscribeToAuth } from '../store/auth'

export function useAuth() {
  const [user, setUser] = useState(getUser)
  const navigate = useNavigate()

  useEffect(() => subscribeToAuth(setUser), [])

  const login = async (email, password) => {
    const data = await authApi.login(email, password)
    const user = await authApi.me(data.access_token)
    storeLogin(data.access_token, user)
    navigate('/training')
    return user
  }

  const register = async (email, username, password) => {
    await authApi.register(email, username, password)
    const data = await authApi.login(email, password)
    const user = await authApi.me(data.access_token)
    storeLogin(data.access_token, user)
    navigate('/training')
    return user
  }

  const logout = () => {
    storeLogout()
    navigate('/login')
  }

  return { user, isAuthenticated: isAuthenticated(), login, register, logout }
}
