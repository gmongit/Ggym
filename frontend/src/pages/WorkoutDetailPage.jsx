import { useState } from 'react'
import { useParams, useNavigate, useLocation } from 'react-router-dom'
import PageLayout from '../components/layout/PageLayout'
import Card from '../components/ui/Card'
import Button from '../components/ui/Button'
import Modal from '../components/ui/Modal'
import Spinner from '../components/ui/Spinner'
import { useWorkout, useAddSet, useUpdateWorkout, useExerciseHistory } from '../hooks/useWorkouts'
import { useExercises } from '../hooks/useExercises'
import ExercisePicker from '../components/exercises/ExercisePicker'

function SetInput({ exercise, workoutId, onClose }) {
  const { data: history } = useExerciseHistory(exercise?.id)
  const addSet = useAddSet(workoutId)
  const [weight, setWeight] = useState('')
  const [reps, setReps] = useState('')
  const [rir, setRir] = useState('')

  const lastSet = history?.[0]
  const setNumber = (history?.filter((s) => s.exercise_id === exercise?.id).length || 0) + 1

  const handleAdd = async () => {
    if (!weight || !reps) return
    await addSet.mutateAsync({
      exercise_id: exercise.id,
      weight_kg: parseFloat(weight),
      reps: parseInt(reps),
      rir: rir ? parseInt(rir) : null,
      set_number: setNumber,
    })
    setWeight('')
    setReps('')
  }

  return (
    <div className="space-y-4">
      {lastSet && (
        <div className="bg-ios-blue/10 rounded-xl p-3 text-center">
          <p className="text-xs text-ios-blue font-medium">Letztes Training</p>
          <p className="text-ios-blue font-bold text-lg">{lastSet.weight_kg}kg × {lastSet.reps} Wdh</p>
        </div>
      )}

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-xs font-semibold text-ios-gray-1 uppercase tracking-wide">Gewicht (kg)</label>
          <input
            className="ios-input mt-1 text-center text-2xl font-bold"
            type="number"
            inputMode="decimal"
            step="0.5"
            placeholder={lastSet?.weight_kg || '80'}
            value={weight}
            onChange={(e) => setWeight(e.target.value)}
          />
        </div>
        <div>
          <label className="text-xs font-semibold text-ios-gray-1 uppercase tracking-wide">Wiederholungen</label>
          <input
            className="ios-input mt-1 text-center text-2xl font-bold"
            type="number"
            inputMode="numeric"
            placeholder={lastSet?.reps || '8'}
            value={reps}
            onChange={(e) => setReps(e.target.value)}
          />
        </div>
      </div>

      <div>
        <label className="text-xs font-semibold text-ios-gray-1 uppercase tracking-wide">
          RIR (Reps in Reserve, optional)
        </label>
        <input
          className="ios-input mt-1 text-center"
          type="number"
          inputMode="numeric"
          min="0"
          max="4"
          placeholder="0-4"
          value={rir}
          onChange={(e) => setRir(e.target.value)}
        />
      </div>

      <div className="flex gap-3">
        <Button variant="secondary" onClick={onClose} className="flex-1">Fertig</Button>
        <Button onClick={handleAdd} disabled={!weight || !reps || addSet.isPending} className="flex-1">
          Satz {setNumber} hinzufügen
        </Button>
      </div>
    </div>
  )
}

export default function WorkoutDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const location = useLocation()
  const { data: workout, isLoading } = useWorkout(id)
  const updateWorkout = useUpdateWorkout(id)
  const { data: exercises } = useExercises()

  // Pre-populated exercises from a training plan day
  const planDay = location.state?.planDay || null
  const planExercises = planDay?.exercises || []

  const [showExercisePicker, setShowExercisePicker] = useState(false)
  const [selectedExercise, setSelectedExercise] = useState(null)
  const [showFinish, setShowFinish] = useState(false)
  const [rpe, setRpe] = useState('')
  const [notes, setNotes] = useState('')

  if (isLoading) return <div className="min-h-dvh flex items-center justify-center"><Spinner /></div>

  const grouped = workout?.sets?.reduce((acc, s) => {
    const key = s.exercise_id
    if (!acc[key]) acc[key] = []
    acc[key].push(s)
    return acc
  }, {}) || {}

  // Merge plan exercises (for display) with actual logged sets
  // Plan exercises shown as sections even before any sets are added
  const trackedExerciseIds = new Set(Object.keys(grouped).map(Number))
  const planOnlyExercises = planExercises.filter((pe) => !trackedExerciseIds.has(pe.exercise_id))

  const handleFinish = async () => {
    await updateWorkout.mutateAsync({
      perceived_exertion: rpe ? parseInt(rpe) : null,
      notes: notes || null,
    })
    navigate('/training')
  }

  return (
    <PageLayout
      title={planDay ? planDay.name : 'Training'}
      subtitle={new Date(workout?.date || '').toLocaleDateString('de-DE', { weekday: 'long', day: 'numeric', month: 'long' })}
      action={<Button onClick={() => setShowFinish(true)}>Beenden</Button>}
    >
      {/* Sätze gruppiert nach Übung (bereits geloggte) */}
      {Object.entries(grouped).map(([exerciseId, sets]) => {
        const exercise = exercises?.find((e) => e.id === parseInt(exerciseId))
        const planEntry = planExercises.find((pe) => pe.exercise_id === parseInt(exerciseId))
        return (
          <Card key={exerciseId}>
            <div className="flex items-center justify-between mb-2">
              <p className="font-semibold text-gray-900">{exercise?.name || `Übung #${exerciseId}`}</p>
              {planEntry && (
                <span className="text-xs text-ios-blue bg-ios-blue/10 rounded-full px-2 py-0.5">
                  Ziel: {planEntry.target_sets}×{planEntry.target_reps_min}–{planEntry.target_reps_max}
                </span>
              )}
            </div>
            <div className="space-y-1">
              {sets.map((s) => (
                <div key={s.id} className="flex items-center gap-3 text-sm">
                  <span className="w-6 h-6 bg-ios-blue text-white rounded-full flex items-center justify-center text-xs font-bold">
                    {s.set_number}
                  </span>
                  <span className="font-semibold">{s.weight_kg}kg</span>
                  <span className="text-ios-gray-1">×</span>
                  <span className="font-semibold">{s.reps} Wdh</span>
                  {s.rir != null && <span className="text-xs text-ios-gray-1">RIR {s.rir}</span>}
                </div>
              ))}
            </div>
            <button
              className="mt-3 text-ios-blue text-sm font-medium"
              onClick={() => {
                setSelectedExercise(exercise)
                setShowExercisePicker(false)
              }}
            >
              + Satz hinzufügen
            </button>
          </Card>
        )
      })}

      {/* Plan-Übungen ohne Sätze – als leere Karten anzeigen */}
      {planOnlyExercises.map((pe) => {
        const exercise = exercises?.find((e) => e.id === pe.exercise_id)
        return (
          <Card key={`plan-${pe.exercise_id}`}>
            <div className="flex items-center justify-between mb-2">
              <p className="font-semibold text-gray-900">{pe.exercise_name}</p>
              <span className="text-xs text-ios-blue bg-ios-blue/10 rounded-full px-2 py-0.5">
                Ziel: {pe.target_sets}×{pe.target_reps_min}–{pe.target_reps_max}
              </span>
            </div>
            <p className="text-xs text-ios-gray-1 mb-2">Noch keine Sätze</p>
            <button
              className="text-ios-blue text-sm font-medium"
              onClick={() => {
                setSelectedExercise(exercise || { id: pe.exercise_id, name: pe.exercise_name })
                setShowExercisePicker(false)
              }}
            >
              + Satz hinzufügen
            </button>
          </Card>
        )
      })}

      <Button onClick={() => setShowExercisePicker(true)} variant="secondary" className="w-full">
        + Übung hinzufügen
      </Button>

      {/* Übungsauswahl */}
      <Modal open={showExercisePicker} onClose={() => setShowExercisePicker(false)} title="Übung wählen">
        <ExercisePicker onSelect={(ex) => { setSelectedExercise(ex); setShowExercisePicker(false) }} />
      </Modal>

      {/* Satz hinzufügen */}
      <Modal
        open={!!selectedExercise && !showExercisePicker}
        onClose={() => setSelectedExercise(null)}
        title={selectedExercise?.name || ''}
      >
        {selectedExercise && (
          <SetInput
            exercise={selectedExercise}
            workoutId={id}
            onClose={() => setSelectedExercise(null)}
          />
        )}
      </Modal>

      {/* Training beenden */}
      <Modal open={showFinish} onClose={() => setShowFinish(false)} title="Training beenden">
        <div className="space-y-4">
          <div>
            <label className="text-xs font-semibold text-ios-gray-1 uppercase tracking-wide">
              Anstrengung (RPE 1-10)
            </label>
            <input
              className="ios-input mt-1 text-center text-2xl font-bold"
              type="number"
              inputMode="numeric"
              min="1"
              max="10"
              placeholder="7"
              value={rpe}
              onChange={(e) => setRpe(e.target.value)}
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-ios-gray-1 uppercase tracking-wide">Notizen</label>
            <textarea
              className="ios-input mt-1 resize-none text-base text-left font-normal"
              rows={3}
              placeholder="Wie lief das Training?"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>
          <div className="bg-ios-gray-6 rounded-xl p-3 text-center">
            <p className="text-sm text-ios-gray-1">Zusammenfassung</p>
            <p className="font-bold text-lg">{Object.keys(grouped).length} Übungen · {workout?.sets?.length || 0} Sätze</p>
          </div>
          <div className="flex gap-3">
            <Button variant="secondary" onClick={() => setShowFinish(false)} className="flex-1">Zurück</Button>
            <Button onClick={handleFinish} className="flex-1">Speichern ✓</Button>
          </div>
        </div>
      </Modal>
    </PageLayout>
  )
}
