import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { workoutsApi } from '../api/workouts'
import { offlineDb } from '../store/offlineDb'

export function useWorkouts() {
  return useQuery({
    queryKey: ['workouts'],
    queryFn: async () => {
      try {
        const data = await workoutsApi.list({ limit: 30 })
        await offlineDb.cacheWorkouts(data)
        return data
      } catch {
        return offlineDb.getCachedWorkouts()
      }
    },
  })
}

export function useCreateWorkout() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: workoutsApi.create,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['workouts'] }),
  })
}

export function useWorkout(id) {
  return useQuery({
    queryKey: ['workout', id],
    queryFn: () => workoutsApi.get(id),
    enabled: !!id,
  })
}

export function useAddSet(workoutId) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (setData) => workoutsApi.addSet(workoutId, setData),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['workout', workoutId] }),
  })
}

export function useUpdateWorkout(id) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data) => workoutsApi.update(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['workout', id] })
      qc.invalidateQueries({ queryKey: ['workouts'] })
    },
  })
}

export function useDeleteWorkout() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: workoutsApi.delete,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['workouts'] }),
  })
}

export function useExerciseHistory(exerciseId) {
  return useQuery({
    queryKey: ['exercise-history', exerciseId],
    queryFn: () => workoutsApi.history(exerciseId),
    enabled: !!exerciseId,
  })
}

export function useVolumeByMuscle(weeks = 8) {
  return useQuery({
    queryKey: ['volume-by-muscle', weeks],
    queryFn: () => workoutsApi.volumeByMuscle(weeks),
    staleTime: 1000 * 60 * 5,
  })
}

export function useSetsByMuscle(weeks = 8) {
  return useQuery({
    queryKey: ['sets-by-muscle', weeks],
    queryFn: () => workoutsApi.setsByMuscle(weeks),
    staleTime: 1000 * 60 * 5,
  })
}
