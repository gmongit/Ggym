import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { nutritionApi } from '../api/nutrition'

export function useNutritionSummary(date) {
  return useQuery({
    queryKey: ['nutrition-summary', date],
    queryFn: () => nutritionApi.summary(date),
  })
}

export function useAddNutrition(date) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: nutritionApi.create,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['nutrition-summary', date] }),
  })
}
