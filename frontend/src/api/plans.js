import { api } from './client'

export const plansApi = {
  list: () => api.get('/plans/').then((r) => r.data),
  get: (id) => api.get(`/plans/${id}`).then((r) => r.data),
  create: (data) => api.post('/plans/', data).then((r) => r.data),
  delete: (id) => api.delete(`/plans/${id}`),
  addDay: (planId, data) => api.post(`/plans/${planId}/days`, data).then((r) => r.data),
  deleteDay: (dayId) => api.delete(`/plans/days/${dayId}`),
  addExercise: (dayId, data) => api.post(`/plans/days/${dayId}/exercises`, data).then((r) => r.data),
  removeExercise: (dayId, entryId) => api.delete(`/plans/days/${dayId}/exercises/${entryId}`),
}
