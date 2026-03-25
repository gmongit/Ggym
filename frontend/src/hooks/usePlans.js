import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { plansApi } from '../api/plans'

export function usePlans() {
  return useQuery({ queryKey: ['plans'], queryFn: plansApi.list })
}

export function usePlan(id) {
  return useQuery({
    queryKey: ['plans', id],
    queryFn: () => plansApi.get(id),
    enabled: !!id,
  })
}

export function useCreatePlan() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: plansApi.create,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['plans'] }),
  })
}

export function useDeletePlan() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: plansApi.delete,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['plans'] }),
  })
}

export function useAddDay(planId) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data) => plansApi.addDay(planId, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['plans', planId] }),
  })
}

export function useDeleteDay(planId) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: plansApi.deleteDay,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['plans', planId] }),
  })
}

export function useAddExerciseToDay(planId) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ dayId, data }) => plansApi.addExercise(dayId, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['plans', planId] }),
  })
}

export function useRemoveExerciseFromDay(planId) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ dayId, entryId }) => plansApi.removeExercise(dayId, entryId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['plans', planId] }),
  })
}
