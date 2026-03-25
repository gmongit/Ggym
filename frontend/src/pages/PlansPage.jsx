import { useState } from 'react'
import PageLayout from '../components/layout/PageLayout'
import Card from '../components/ui/Card'
import Button from '../components/ui/Button'
import Modal from '../components/ui/Modal'
import Spinner from '../components/ui/Spinner'
import ExercisePicker from '../components/exercises/ExercisePicker'
import {
  usePlans, usePlan, useCreatePlan, useDeletePlan,
  useAddDay, useDeleteDay, useAddExerciseToDay, useRemoveExerciseFromDay,
} from '../hooks/usePlans'

function ExercisePickerModal({ open, onClose, dayId, planId, zIndex }) {
  const addExercise = useAddExerciseToDay(planId)

  const handleAdd = async (ex) => {
    await addExercise.mutateAsync({ dayId, data: { exercise_id: ex.id } })
    onClose()
  }

  return (
    <Modal open={open} onClose={onClose} title="Übung hinzufügen" zIndex={zIndex}>
      <ExercisePicker onSelect={handleAdd} />
    </Modal>
  )
}

function DayEditor({ day, planId }) {
  const deleteDay = useDeleteDay(planId)
  const removeExercise = useRemoveExerciseFromDay(planId)
  const [showPicker, setShowPicker] = useState(false)

  return (
    <div className="border border-gray-100 rounded-2xl overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 bg-ios-gray-6">
        <p className="font-semibold text-gray-900">{day.name}</p>
        <button
          onClick={() => deleteDay.mutate(day.id)}
          className="text-ios-red text-sm p-1"
        >
          ✕
        </button>
      </div>
      <div className="px-4 py-2 space-y-2">
        {day.exercises.length === 0 && (
          <p className="text-sm text-ios-gray-1 py-2">Noch keine Übungen</p>
        )}
        {day.exercises.map((e) => (
          <div key={e.id} className="flex items-center justify-between py-1">
            <div>
              <span className="text-sm font-medium">{e.exercise_name}</span>
              <span className="text-xs text-ios-gray-1 ml-2">
                {e.target_sets}×{e.target_reps_min}–{e.target_reps_max}
              </span>
            </div>
            <button
              onClick={() => removeExercise.mutate({ dayId: day.id, entryId: e.id })}
              className="text-ios-gray-2 text-sm p-1"
            >
              ✕
            </button>
          </div>
        ))}
        <button
          onClick={() => setShowPicker(true)}
          className="text-ios-blue text-sm font-medium py-1.5"
        >
          + Übung hinzufügen
        </button>
      </div>
      <ExercisePickerModal
        open={showPicker}
        onClose={() => setShowPicker(false)}
        dayId={day.id}
        planId={planId}
        zIndex="z-[60]"
      />
    </div>
  )
}

function PlanDetailModal({ planId, open, onClose }) {
  const { data: plan, isLoading } = usePlan(open ? planId : null)
  const addDay = useAddDay(planId)
  const [newDayName, setNewDayName] = useState('')
  const [showAddDay, setShowAddDay] = useState(false)

  const handleAddDay = async () => {
    if (!newDayName.trim()) return
    await addDay.mutateAsync({ name: newDayName.trim() })
    setNewDayName('')
    setShowAddDay(false)
  }

  return (
    <Modal open={open} onClose={onClose} title={plan?.name || 'Plan'}>
      {isLoading ? (
        <div className="flex justify-center py-8"><Spinner /></div>
      ) : (
        <div className="space-y-3">
          {plan?.days?.length === 0 && (
            <p className="text-sm text-ios-gray-1 text-center py-4">Noch keine Trainingstage</p>
          )}
          {plan?.days?.map((day) => (
            <DayEditor key={day.id} day={day} planId={planId} />
          ))}

          {showAddDay ? (
            <div className="flex gap-2 mt-2">
              <input
                className="ios-input flex-1 text-sm"
                placeholder="z.B. Push Day"
                value={newDayName}
                onChange={(e) => setNewDayName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAddDay()}
                autoFocus
              />
              <Button onClick={handleAddDay} disabled={!newDayName.trim() || addDay.isPending}>
                OK
              </Button>
            </div>
          ) : (
            <Button
              variant="secondary"
              className="w-full"
              onClick={() => setShowAddDay(true)}
            >
              + Tag hinzufügen
            </Button>
          )}
        </div>
      )}
    </Modal>
  )
}

export default function PlansPage() {
  const { data: plans, isLoading } = usePlans()
  const createPlan = useCreatePlan()
  const deletePlan = useDeletePlan()
  const [selectedPlanId, setSelectedPlanId] = useState(null)
  const [showCreate, setShowCreate] = useState(false)
  const [newName, setNewName] = useState('')

  const handleCreate = async () => {
    if (!newName.trim()) return
    const plan = await createPlan.mutateAsync({ name: newName.trim() })
    setNewName('')
    setShowCreate(false)
    setSelectedPlanId(plan.id)
  }

  return (
    <PageLayout
      title="Trainingspläne"
      action={<Button onClick={() => setShowCreate(true)}>+ Plan</Button>}
    >
      {isLoading ? (
        <Spinner />
      ) : plans?.length === 0 ? (
        <Card>
          <div className="text-center py-8">
            <div className="text-5xl mb-3">📋</div>
            <p className="font-semibold text-gray-900">Noch kein Plan</p>
            <p className="text-ios-gray-1 text-sm mt-1">Erstelle deinen ersten Trainingsplan</p>
            <Button onClick={() => setShowCreate(true)} className="mt-4">Plan erstellen</Button>
          </div>
        </Card>
      ) : (
        <div className="space-y-3">
          {plans?.map((plan) => (
            <Card key={plan.id} onClick={() => setSelectedPlanId(plan.id)}>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-semibold text-gray-900">{plan.name}</p>
                  <p className="text-sm text-ios-gray-1 mt-0.5">{plan.day_count} Trainingstage</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-ios-gray-2">›</span>
                  <button
                    onClick={(e) => { e.stopPropagation(); deletePlan.mutate(plan.id) }}
                    className="text-ios-red text-sm p-1"
                  >
                    ✕
                  </button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Create Plan Modal */}
      <Modal open={showCreate} onClose={() => { setShowCreate(false); setNewName('') }} title="Neuer Plan">
        <div className="space-y-4">
          <div>
            <label className="text-xs font-semibold text-ios-gray-1 uppercase tracking-wide">Planname</label>
            <input
              className="ios-input mt-1"
              placeholder="z.B. PPL Split, Push/Pull/Legs"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
              autoFocus
            />
          </div>
          <Button onClick={handleCreate} disabled={!newName.trim() || createPlan.isPending} className="w-full">
            Erstellen
          </Button>
        </div>
      </Modal>

      {/* Plan Detail Modal */}
      <PlanDetailModal
        planId={selectedPlanId}
        open={!!selectedPlanId}
        onClose={() => setSelectedPlanId(null)}
      />
    </PageLayout>
  )
}
