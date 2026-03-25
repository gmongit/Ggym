import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import PageLayout from '../components/layout/PageLayout'
import Card from '../components/ui/Card'
import Button from '../components/ui/Button'
import Modal from '../components/ui/Modal'
import Spinner from '../components/ui/Spinner'
import { useWorkouts, useCreateWorkout, useDeleteWorkout } from '../hooks/useWorkouts'
import { usePlans, usePlan } from '../hooks/usePlans'

function formatDate(dateStr) {
  const d = new Date(dateStr)
  return d.toLocaleDateString('de-DE', { weekday: 'short', day: 'numeric', month: 'short' })
}

function WorkoutCard({ workout, onDelete }) {
  const navigate = useNavigate()
  const totalSets = workout.sets?.length || 0
  const exercises = [...new Set(workout.sets?.map((s) => s.exercise_id) || [])]

  return (
    <Card>
      <div className="flex items-start justify-between">
        {/* Clickable content area */}
        <div
          className="flex-1 cursor-pointer min-w-0 pr-2"
          onClick={() => navigate(`/training/${workout.id}`)}
        >
          <p className="font-semibold text-gray-900">{formatDate(workout.date)}</p>
          <p className="text-sm text-ios-gray-1 mt-0.5">
            {exercises.length} Übungen · {totalSets} Sätze
            {workout.duration_minutes && ` · ${workout.duration_minutes} min`}
          </p>
          {workout.notes && <p className="text-sm text-gray-600 mt-1 line-clamp-1">{workout.notes}</p>}
        </div>
        {/* Action area — isolated from navigation click */}
        <div className="flex items-center gap-2 shrink-0">
          {workout.perceived_exertion && (
            <span className="text-xs bg-ios-gray-6 text-ios-gray-1 rounded-full px-2 py-1 font-medium">
              RPE {workout.perceived_exertion}
            </span>
          )}
          <button
            onClick={() => onDelete(workout.id)}
            className="text-ios-red text-sm p-1"
          >
            ✕
          </button>
        </div>
      </div>
    </Card>
  )
}

function PlanDayPicker({ planId, onDaySelect }) {
  const { data: plan, isLoading } = usePlan(planId)

  if (isLoading) return <div className="py-4 flex justify-center"><Spinner size="sm" /></div>
  if (!plan?.days?.length) return <p className="text-sm text-ios-gray-1 py-4 text-center">Keine Trainingstage im Plan</p>

  return (
    <div className="space-y-2">
      {plan.days.map((day) => (
        <button
          key={day.id}
          onClick={() => onDaySelect(day)}
          className="w-full text-left px-4 py-3 bg-ios-gray-6 rounded-2xl hover:bg-gray-200 transition-colors"
        >
          <p className="font-semibold text-gray-900">{day.name}</p>
          <p className="text-xs text-ios-gray-1 mt-0.5">
            {day.exercises.map((e) => e.exercise_name).join(', ') || 'Keine Übungen'}
          </p>
        </button>
      ))}
    </div>
  )
}

export default function TrainingPage() {
  const navigate = useNavigate()
  const { data: workouts, isLoading } = useWorkouts()
  const { data: plans } = usePlans()
  const createWorkout = useCreateWorkout()
  const deleteWorkout = useDeleteWorkout()
  const [confirmDelete, setConfirmDelete] = useState(null)
  const [showPlanPicker, setShowPlanPicker] = useState(false)
  const [selectedPlanId, setSelectedPlanId] = useState(null)

  const handleStartWorkout = async () => {
    const session = await createWorkout.mutateAsync({})
    navigate(`/training/${session.id}`)
  }

  const handleStartFromDay = async (day) => {
    const session = await createWorkout.mutateAsync({})
    setShowPlanPicker(false)
    setSelectedPlanId(null)
    navigate(`/training/${session.id}`, {
      state: { planDay: day },
    })
  }

  const hasPlans = plans && plans.length > 0

  return (
    <PageLayout
      title="Training"
      action={
        <Button onClick={handleStartWorkout} disabled={createWorkout.isPending}>
          + Training
        </Button>
      }
    >
      {/* Plan starten */}
      {hasPlans && (
        <div>
          <p className="ios-section-title">Trainingsplan</p>
          <Card onClick={() => setShowPlanPicker(true)}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-2xl">📋</span>
                <div>
                  <p className="font-medium">Plan starten</p>
                  <p className="text-xs text-ios-gray-1">Tag auswählen und loslegen</p>
                </div>
              </div>
              <span className="text-ios-gray-2">›</span>
            </div>
          </Card>
        </div>
      )}

      {/* Letzte Trainings */}
      {isLoading ? (
        <Spinner />
      ) : workouts?.length === 0 ? (
        <Card>
          <div className="text-center py-8">
            <div className="text-5xl mb-3">🏋️</div>
            <p className="font-semibold text-gray-900">Noch kein Training</p>
            <p className="text-ios-gray-1 text-sm mt-1">Starte dein erstes Training!</p>
            <Button onClick={handleStartWorkout} className="mt-4">Training starten</Button>
          </div>
        </Card>
      ) : (
        <>
          {workouts?.length > 0 && <p className="ios-section-title">Letzte Trainings</p>}
          <div className="space-y-3">
            {workouts?.map((w) => (
              <WorkoutCard key={w.id} workout={w} onDelete={setConfirmDelete} />
            ))}
          </div>
        </>
      )}

      {/* Plan-Picker Modal */}
      <Modal
        open={showPlanPicker}
        onClose={() => { setShowPlanPicker(false); setSelectedPlanId(null) }}
        title={selectedPlanId ? plans?.find((p) => p.id === selectedPlanId)?.name : 'Plan wählen'}
      >
        {!selectedPlanId ? (
          <div className="space-y-2">
            {plans?.map((plan) => (
              <button
                key={plan.id}
                onClick={() => setSelectedPlanId(plan.id)}
                className="w-full text-left px-4 py-3 bg-ios-gray-6 rounded-2xl hover:bg-gray-200 transition-colors"
              >
                <p className="font-semibold text-gray-900">{plan.name}</p>
                <p className="text-xs text-ios-gray-1 mt-0.5">{plan.day_count} Trainingstage</p>
              </button>
            ))}
          </div>
        ) : (
          <>
            <button
              className="text-ios-blue text-sm mb-3"
              onClick={() => setSelectedPlanId(null)}
            >
              ← Zurück
            </button>
            <PlanDayPicker
              planId={selectedPlanId}
              onDaySelect={handleStartFromDay}
            />
          </>
        )}
      </Modal>

      {/* Confirm Delete */}
      <Modal open={!!confirmDelete} onClose={() => setConfirmDelete(null)} title="Training löschen?">
        <p className="text-ios-gray-1 mb-4">Diese Aktion kann nicht rückgängig gemacht werden.</p>
        <div className="flex gap-3">
          <Button variant="secondary" onClick={() => setConfirmDelete(null)} className="flex-1">
            Abbrechen
          </Button>
          <Button
            variant="danger"
            onClick={() => { deleteWorkout.mutate(confirmDelete); setConfirmDelete(null) }}
            className="flex-1"
          >
            Löschen
          </Button>
        </div>
      </Modal>
    </PageLayout>
  )
}
