import { api } from './client'

export const exercisesApi = {
  list: (muscleGroup) =>
    api.get('/exercises/', { params: muscleGroup ? { muscle_group: muscleGroup } : {} }).then((r) => r.data),

  create: (data) => api.post('/exercises/', data).then((r) => r.data),

  get: (id) => api.get(`/exercises/${id}`).then((r) => r.data),

  history: (id, limit = 50) =>
    api.get(`/exercises/${id}/history`, { params: { limit } }).then((r) => r.data),
}
