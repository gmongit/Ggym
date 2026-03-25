import { api } from './client'

export const metricsApi = {
  list: () => api.get('/metrics/body').then((r) => r.data),

  create: (data) => api.post('/metrics/body', data).then((r) => r.data),

  trend: (days = 30) =>
    api.get('/metrics/body/trend', { params: { days } }).then((r) => r.data),
}
