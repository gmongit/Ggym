import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { exercisesApi } from '../api/exercises'
import { offlineDb } from '../store/offlineDb'

export function useExercises(muscleGroup) {
  return useQuery({
    queryKey: ['exercises', muscleGroup],
    queryFn: async () => {
      try {
        const data = await exercisesApi.list(muscleGroup)
        if (!muscleGroup) await offlineDb.cacheExercises(data)
        return data
      } catch {
        const cached = await offlineDb.getCachedExercises()
        return muscleGroup ? cached.filter((e) => e.muscle_group === muscleGroup) : cached
      }
    },
    staleTime: 1000 * 60 * 10,
  })
}

export function useCreateExercise() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: exercisesApi.create,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['exercises'] }),
  })
}
