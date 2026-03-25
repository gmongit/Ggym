// Minimaler Auth-State – Event-basiert ohne externe Abhängigkeiten
// Nutzt localStorage + einfachen Subscriber-Pattern

let _user = null
let _listeners = []

function getStoredUser() {
  try {
    const raw = localStorage.getItem('user')
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

_user = getStoredUser()

export function getUser() {
  return _user
}

export function isAuthenticated() {
  return !!localStorage.getItem('token')
}

export function login(token, user) {
  localStorage.setItem('token', token)
  localStorage.setItem('user', JSON.stringify(user))
  _user = user
  _listeners.forEach((fn) => fn(user))
}

export function logout() {
  localStorage.removeItem('token')
  localStorage.removeItem('user')
  _user = null
  _listeners.forEach((fn) => fn(null))
}

export function subscribeToAuth(fn) {
  _listeners.push(fn)
  return () => {
    _listeners = _listeners.filter((l) => l !== fn)
  }
}
