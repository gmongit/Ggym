import { useReducer, useEffect } from 'react'

const getStored = () => {
  try {
    return {
      token: localStorage.getItem('fittrack_token'),
      user: JSON.parse(localStorage.getItem('fittrack_user') || 'null')
    }
  } catch {
    return { token: null, user: null }
  }
}

let _state = getStored()
let _listeners = []

const notify = () => _listeners.forEach(l => l())

export const getAuthToken = () => _state.token

export const setAuth = (token, user) => {
  _state = { ..._state, token, user }
  localStorage.setItem('fittrack_token', token)
  localStorage.setItem('fittrack_user', JSON.stringify(user))
  notify()
}

export const logout = () => {
  _state = { token: null, user: null }
  localStorage.removeItem('fittrack_token')
  localStorage.removeItem('fittrack_user')
  notify()
}

export function useAuthStore(selector) {
  const [, forceUpdate] = useReducer(x => x + 1, 0)
  useEffect(() => {
    _listeners.push(forceUpdate)
    return () => { _listeners = _listeners.filter(l => l !== forceUpdate) }
  }, [])
  return selector(_state)
}
