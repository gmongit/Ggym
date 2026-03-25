import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { metricsApi } from '../api/metrics'

export function useBodyMetricTrend(days = 30) {
  return useQuery({
    queryKey: ['body-trend', days],
    queryFn: () => metricsApi.trend(days),
  })
}

export function useAddBodyMetric() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: metricsApi.create,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['body-trend'] })
    },
  })
}
