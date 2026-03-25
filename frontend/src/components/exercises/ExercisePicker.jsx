import { useState } from 'react'
import Button from '../ui/Button'
import { useExercises, useCreateExercise } from '../../hooks/useExercises'

const MUSCLE_GROUPS = [
  { value: '', label: 'Alle' },
  { value: 'chest', label: 'Brust' },
  { value: 'back', label: 'Rücken' },
  { value: 'shoulders', label: 'Schultern' },
  { value: 'biceps', label: 'Bizeps' },
  { value: 'triceps', label: 'Trizeps' },
  { value: 'legs', label: 'Beine' },
  { value: 'core', label: 'Core' },
]

const MUSCLE_LABELS = Object.fromEntries(MUSCLE_GROUPS.slice(1).map((m) => [m.value, m.label]))

/**
 * Reusable exercise picker content (meant to be rendered inside a Modal).
 * Props:
 *   onSelect(exercise) – called when user picks an exercise
 */
export default function ExercisePicker({ onSelect }) {
  const { data: exercises } = useExercises()
  const createExercise = useCreateExercise()

  const [filter, setFilter] = useState('')
  const [search, setSearch] = useState('')
  const [showCreate, setShowCreate] = useState(false)
  const [newName, setNewName] = useState('')
  const [newMuscle, setNewMuscle] = useState('chest')
  const [newType, setNewType] = useState('isolation')

  const filtered = exercises?.filter((e) => {
    const matchesMuscle = !filter || e.muscle_group === filter
    const matchesSearch = !search || e.name.toLowerCase().includes(search.toLowerCase())
    return matchesMuscle && matchesSearch
  }) || []

  const handleCreate = async () => {
    if (!newName.trim()) return
    const ex = await createExercise.mutateAsync({
      name: newName.trim(),
      muscle_group: newMuscle,
      exercise_type: newType,
    })
    setNewName('')
    setShowCreate(false)
    onSelect(ex)
  }

  if (showCreate) {
    return (
      <div className="space-y-4">
        <button
          className="text-ios-blue text-sm"
          onClick={() => setShowCreate(false)}
        >
          ← Zurück zur Liste
        </button>
        <div>
          <label className="text-xs font-semibold text-ios-gray-1 uppercase tracking-wide">Name</label>
          <input
            className="ios-input mt-1"
            placeholder="z.B. Schrägbank Kurzhanteldrücken"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            autoFocus
          />
        </div>
        <div>
          <label className="text-xs font-semibold text-ios-gray-1 uppercase tracking-wide">Muskelgruppe</label>
          <select
            className="ios-input mt-1"
            value={newMuscle}
            onChange={(e) => setNewMuscle(e.target.value)}
          >
            {MUSCLE_GROUPS.slice(1).map((mg) => (
              <option key={mg.value} value={mg.value}>{mg.label}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="text-xs font-semibold text-ios-gray-1 uppercase tracking-wide">Typ</label>
          <div className="flex gap-2 mt-1">
            {['compound', 'isolation'].map((t) => (
              <button
                key={t}
                onClick={() => setNewType(t)}
                className={`chip-btn flex-1 py-2 rounded-xl text-sm font-semibold ${newType === t ? 'chip-active' : ''}`}
              >
                {t === 'compound' ? 'Grundübung' : 'Isolationsübung'}
              </button>
            ))}
          </div>
        </div>
        <Button
          onClick={handleCreate}
          disabled={!newName.trim() || createExercise.isPending}
          className="w-full"
        >
          Übung erstellen
        </Button>
      </div>
    )
  }

  return (
    <div>
      {/* Search */}
      <input
        className="ios-input text-sm mb-3"
        placeholder="Übung suchen..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />

      {/* Muscle group filter */}
      <div className="flex gap-2 overflow-x-auto pb-2 -mx-1 px-1">
        {MUSCLE_GROUPS.map((mg) => (
          <button
            key={mg.value}
            onClick={() => setFilter(mg.value)}
            className={`chip-btn px-3 py-1.5 rounded-full text-sm font-semibold whitespace-nowrap ${filter === mg.value ? 'chip-active' : ''}`}
          >
            {mg.label}
          </button>
        ))}
      </div>

      {/* Exercise list */}
      <div className="mt-3 space-y-1 max-h-64 overflow-y-auto">
        {filtered.map((ex) => (
          <button
            key={ex.id}
            onClick={() => onSelect(ex)}
            className="w-full text-left px-3 py-2.5 rounded-xl hover:bg-ios-gray-6 transition-colors"
          >
            <span className="font-medium">{ex.name}</span>
            <span className="text-xs text-ios-gray-1 ml-2">
              {MUSCLE_LABELS[ex.muscle_group] || ex.muscle_group}
              {ex.created_by && ' · Eigene'}
            </span>
          </button>
        ))}
        {filtered.length === 0 && (
          <p className="text-sm text-ios-gray-1 text-center py-4">Keine Übungen gefunden</p>
        )}
      </div>

      {/* Create custom */}
      <button
        onClick={() => setShowCreate(true)}
        className="mt-3 w-full text-center text-ios-blue text-sm font-medium py-2 border border-blue-100 rounded-xl bg-blue-50"
      >
        + Eigene Übung erstellen
      </button>
    </div>
  )
}
