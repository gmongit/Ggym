import { api } from './client'

export const workoutsApi = {
  list: (params) => api.get('/workouts/', { params }).then((r) => r.data),

  create: (data) => api.post('/workouts/', data).then((r) => r.data),

  get: (id) => api.get(`/workouts/${id}`).then((r) => r.data),

  update: (id, data) => api.put(`/workouts/${id}`, data).then((r) => r.data),

  delete: (id) => api.delete(`/workouts/${id}`),

  addSet: (workoutId, data) =>
    api.post(`/workouts/${workoutId}/sets`, data).then((r) => r.data),

  history: (exerciseId, limit = 20) =>
    api.get('/workouts/history', { params: { exercise_id: exerciseId, limit } }).then((r) => r.data),

  volumeByMuscle: (weeks = 8) =>
    api.get('/workouts/volume-by-muscle', { params: { weeks } }).then((r) => r.data),

  setsByMuscle: (weeks = 8) =>
    api.get('/workouts/sets-by-muscle', { params: { weeks } }).then((r) => r.data),
}
