import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { mlApi } from '../api/ml'

export function useRecommendation(exerciseId) {
  return useQuery({
    queryKey: ['recommendation', exerciseId],
    queryFn: () => mlApi.recommendation(exerciseId),
    enabled: !!exerciseId,
    staleTime: 1000 * 60 * 5,
  })
}

export function useWeeklySummary() {
  return useQuery({
    queryKey: ['weekly-summary'],
    queryFn: mlApi.weeklySummary,
    staleTime: 1000 * 60 * 5,
  })
}

export function useMLFeedback() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ predictionId, helpful }) => mlApi.feedback(predictionId, helpful),
    onSuccess: (_, { predictionId }) => {
      qc.invalidateQueries({ queryKey: ['recommendation'] })
    },
  })
}
