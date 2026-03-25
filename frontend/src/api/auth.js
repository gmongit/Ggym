import { api } from './client'

export const authApi = {
  login: (email, password) =>
    api.post('/auth/login', { email, password }).then((r) => r.data),

  register: (email, username, password) =>
    api.post('/auth/register', { email, username, password }).then((r) => r.data),

  acceptInvite: (token, email, username, password) =>
    api.post(`/auth/accept-invite/${token}`, { email, username, password }).then((r) => r.data),

  createInvite: (email) =>
    api.post('/auth/invite', { email }).then((r) => r.data),

  me: (token) => api.get('/auth/me', token ? { headers: { Authorization: `Bearer ${token}` } } : undefined).then((r) => r.data),
}
