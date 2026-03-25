import { api } from './client'

export const mlApi = {
  recommendation: (exerciseId) =>
    api.get(`/ml/recommendation/${exerciseId}`).then((r) => r.data),

  weeklySummary: () => api.get('/ml/weekly-summary').then((r) => r.data),

  feedback: (predictionId, helpful) =>
    api.post('/ml/feedback', { prediction_id: predictionId, helpful }).then((r) => r.data),

  chat: (message, exerciseId, chatHistory) =>
    api.post('/ml/chat', {
      message,
      exercise_id: exerciseId,
      chat_history: chatHistory,
    }).then((r) => r.data),
}
