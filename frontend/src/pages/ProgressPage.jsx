import { useState } from 'react'
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts'
import PageLayout from '../components/layout/PageLayout'
import Card from '../components/ui/Card'
import Spinner from '../components/ui/Spinner'
import { useExercises } from '../hooks/useExercises'
import { useExerciseHistory, useVolumeByMuscle, useSetsByMuscle } from '../hooks/useWorkouts'
import { useBodyMetricTrend } from '../hooks/useMetrics'
import { useChartColors } from '../hooks/useChartColors'

const MUSCLE_META = {
  chest:     { label: 'Brust',     color: '#a855f7' },
  back:      { label: 'Rücken',    color: '#0ea5e9' },
  shoulders: { label: 'Schultern', color: '#f59e0b' },
  legs:      { label: 'Beine',     color: '#10b981' },
  biceps:    { label: 'Bizeps',    color: '#f43f5e' },
  triceps:   { label: 'Trizeps',   color: '#8b5cf6' },
  core:      { label: 'Core',      color: '#64748b' },
}

function epley1rm(weight, reps) {
  return reps === 1 ? weight : weight * (1 + reps / 30)
}

function ExerciseChart({ exerciseId }) {
  const { data: sets, isLoading } = useExerciseHistory(exerciseId)
  const c = useChartColors()

  if (isLoading) return <Spinner size="sm" />

  const sessionData = Object.values(
    sets?.reduce((acc, s) => {
      const date = new Date(s.date || '').toLocaleDateString('de-DE', { day: 'numeric', month: 'short' })
      if (!acc[date] || epley1rm(s.weight_kg, s.reps) > epley1rm(acc[date].weight_kg, acc[date].reps)) {
        acc[date] = { date, weight_kg: s.weight_kg, reps: s.reps }
      }
      return acc
    }, {}) || {}
  )
    .map((d) => ({ ...d, orm: Math.round(epley1rm(d.weight_kg, d.reps) * 10) / 10 }))
    .slice(-12)

  if (!sessionData.length) return <p className="text-ios-gray-1 text-sm text-center py-4">Noch keine Daten</p>

  return (
    <ResponsiveContainer width="100%" height={180}>
      <LineChart data={sessionData}>
        <CartesianGrid strokeDasharray="3 3" stroke={c.border} />
        <XAxis dataKey="date" tick={{ fontSize: 11, fill: c.textMuted }} />
        <YAxis tick={{ fontSize: 11, fill: c.textMuted }} domain={['auto', 'auto']} />
        <Tooltip
          formatter={(v) => [`${v} kg`, '~1RM']}
          contentStyle={{
            borderRadius: 12,
            border: `1px solid ${c.modalBorder}`,
            background: c.modalBg,
            color: c.text,
            boxShadow: '0 4px 20px rgba(0,0,0,0.25)',
          }}
          labelStyle={{ color: c.textMuted }}
        />
        <Line type="monotone" dataKey="orm" stroke={c.accent} strokeWidth={2.5} dot={{ fill: c.accent, r: 4 }} />
      </LineChart>
    </ResponsiveContainer>
  )
}

function BodyWeightChart({ days }) {
  const { data: trend, isLoading } = useBodyMetricTrend(days)
  const c = useChartColors()

  if (isLoading) return <Spinner size="sm" />
  if (!trend?.entries?.length) return <p className="text-ios-gray-1 text-sm text-center py-4">Noch keine Körperdaten</p>

  const data = trend.entries.map((e) => ({
    date: new Date(e.date).toLocaleDateString('de-DE', { day: 'numeric', month: 'short' }),
    weight: e.weight_kg,
  }))

  return (
    <>
      <div className="flex gap-4 mb-3 text-center">
        {[
          { label: 'Ø Gewicht', value: `${trend.avg_weight} kg` },
          { label: 'Veränderung', value: `${trend.change_kg > 0 ? '+' : ''}${trend.change_kg} kg` },
        ].map(({ label, value }) => (
          <div key={label} className="flex-1 bg-ios-gray-6 rounded-xl p-2">
            <p className="text-xs text-ios-gray-1">{label}</p>
            <p className="font-bold text-gray-900">{value}</p>
          </div>
        ))}
      </div>
      <ResponsiveContainer width="100%" height={160}>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke={c.border} />
          <XAxis dataKey="date" tick={{ fontSize: 11, fill: c.textMuted }} />
          <YAxis tick={{ fontSize: 11, fill: c.textMuted }} domain={['auto', 'auto']} />
          <Tooltip
            contentStyle={{
              borderRadius: 12,
              border: `1px solid ${c.modalBorder}`,
              background: c.modalBg,
              color: c.text,
              boxShadow: '0 4px 20px rgba(0,0,0,0.25)',
            }}
            labelStyle={{ color: c.textMuted }}
          />
          <Line type="monotone" dataKey="weight" stroke={c.accentBright} strokeWidth={2.5} dot={{ fill: c.accentBright, r: 3 }} />
        </LineChart>
      </ResponsiveContainer>
    </>
  )
}

function MuscleChartLegend({ muscles, active, onToggle, c }) {
  return (
    <div className="flex flex-wrap gap-2 mt-3">
      {muscles.map((m) => {
        const isActive = active.includes(m)
        return (
          <button
            key={m}
            onClick={() => onToggle(m)}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold transition-all active:scale-95"
            style={{
              background: isActive ? MUSCLE_META[m].color + '22' : c.chipBg,
              color: isActive ? MUSCLE_META[m].color : c.textMuted,
              border: `1px solid ${isActive ? MUSCLE_META[m].color + '66' : 'transparent'}`,
            }}
          >
            <div className="w-2 h-2 rounded-full shrink-0" style={{ background: isActive ? MUSCLE_META[m].color : c.textMuted }} />
            {MUSCLE_META[m].label}
          </button>
        )
      })}
    </div>
  )
}

function VolumeByMuscleChart({ weeks }) {
  const { data, isLoading } = useVolumeByMuscle(weeks)
  const c = useChartColors()

  const presentMuscles = Object.keys(MUSCLE_META).filter((m) => data?.some((w) => w[m] > 0))
  const [active, setActive] = useState([])

  // Initialisiere active wenn Daten geladen
  const visibleMuscles = active.length ? active : presentMuscles

  const toggle = (m) =>
    setActive((prev) =>
      prev.includes(m) ? prev.filter((x) => x !== m) : [...prev, m]
    )

  if (isLoading) return <Spinner size="sm" />
  if (!data?.length) return <p className="text-ios-gray-1 text-sm text-center py-4">Noch keine Trainingsdaten</p>

  const topMuscle = visibleMuscles.at(-1)

  return (
    <>
      <ResponsiveContainer width="100%" height={220}>
        <BarChart data={data} margin={{ top: 4, right: 4, left: -16, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke={c.border} vertical={false} />
          <XAxis dataKey="week" tick={{ fontSize: 11, fill: c.textMuted }} />
          <YAxis tick={{ fontSize: 11, fill: c.textMuted }} unit=" kg" />
          <Tooltip
            formatter={(value, name) => [`${value.toLocaleString('de-DE')} kg`, MUSCLE_META[name]?.label || name]}
            contentStyle={{ borderRadius: 12, border: `1px solid ${c.modalBorder}`, background: c.modalBg, color: c.text, boxShadow: '0 4px 20px rgba(0,0,0,0.25)' }}
            labelStyle={{ color: c.textMuted, marginBottom: 4 }}
          />
          {visibleMuscles.map((muscle) => (
            <Bar key={muscle} dataKey={muscle} stackId="a" fill={MUSCLE_META[muscle].color}
              radius={muscle === topMuscle ? [4, 4, 0, 0] : [0, 0, 0, 0]} />
          ))}
        </BarChart>
      </ResponsiveContainer>
      <MuscleChartLegend muscles={presentMuscles} active={active} onToggle={toggle} c={c} />
    </>
  )
}

function SetsByMuscleChart({ weeks }) {
  const { data, isLoading } = useSetsByMuscle(weeks)
  const c = useChartColors()

  const presentMuscles = Object.keys(MUSCLE_META).filter((m) => data?.some((w) => w[m] > 0))
  const [active, setActive] = useState([])

  const visibleMuscles = active.length ? active : presentMuscles

  const toggle = (m) =>
    setActive((prev) =>
      prev.includes(m) ? prev.filter((x) => x !== m) : [...prev, m]
    )

  if (isLoading) return <Spinner size="sm" />
  if (!data?.length) return <p className="text-ios-gray-1 text-sm text-center py-4">Noch keine Trainingsdaten</p>

  return (
    <>
      <ResponsiveContainer width="100%" height={220}>
        <LineChart data={data} margin={{ top: 4, right: 4, left: -16, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke={c.border} vertical={false} />
          <XAxis dataKey="week" tick={{ fontSize: 11, fill: c.textMuted }} />
          <YAxis tick={{ fontSize: 11, fill: c.textMuted }} allowDecimals={false} />
          <Tooltip
            formatter={(value, name) => [`${value} Sätze`, MUSCLE_META[name]?.label || name]}
            contentStyle={{ borderRadius: 12, border: `1px solid ${c.modalBorder}`, background: c.modalBg, color: c.text, boxShadow: '0 4px 20px rgba(0,0,0,0.25)' }}
            labelStyle={{ color: c.textMuted, marginBottom: 4 }}
          />
          {visibleMuscles.map((muscle) => (
            <Line key={muscle} type="monotone" dataKey={muscle}
              stroke={MUSCLE_META[muscle].color} strokeWidth={2}
              dot={{ fill: MUSCLE_META[muscle].color, r: 3 }}
              activeDot={{ r: 5 }}
              connectNulls
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
      <MuscleChartLegend muscles={presentMuscles} active={active} onToggle={toggle} c={c} />
    </>
  )
}

export default function ProgressPage() {
  const { data: exercises } = useExercises()
  const [selectedExercise, setSelectedExercise] = useState(null)
  const [bodyDays, setBodyDays] = useState(30)
  const [volumeWeeks, setVolumeWeeks] = useState(8)
  const [muscleTab, setMuscleTab] = useState('volume') // 'volume' | 'sets'

  return (
    <PageLayout title="Fortschritt" subtitle="Deine Entwicklung im Überblick">

      {/* Volumen / Sätze pro Muskelgruppe */}
      <Card>
        {/* Reiter */}
        <div className="toggle-bar flex gap-1 mb-4">
          {[
            { id: 'volume', label: '📦 Volumen' },
            { id: 'sets',   label: '🔢 Arbeitssätze' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setMuscleTab(tab.id)}
              className={`toggle-option flex-1 py-1.5 rounded-lg text-sm font-semibold ${muscleTab === tab.id ? 'toggle-active' : ''}`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Titel + Zeitraum */}
        <div className="flex items-center justify-between mb-3">
          <p className="font-semibold text-sm" style={{ color: 'var(--text-muted)' }}>
            {muscleTab === 'volume' ? 'Trainingsvolumen (kg × Wdh)' : 'Arbeitssätze pro Muskelgruppe'}
          </p>
          <div className="flex gap-1">
            {[4, 8, 12].map((w) => (
              <button
                key={w}
                onClick={() => setVolumeWeeks(w)}
                className={`chip-btn px-2 py-1 rounded-lg text-xs font-semibold ${volumeWeeks === w ? 'chip-active' : ''}`}
              >
                {w}W
              </button>
            ))}
          </div>
        </div>

        {muscleTab === 'volume'
          ? <VolumeByMuscleChart weeks={volumeWeeks} />
          : <SetsByMuscleChart weeks={volumeWeeks} />
        }
      </Card>

      {/* 1RM Übungsauswahl */}
      <Card>
        <p className="font-semibold mb-3">1RM Entwicklung</p>
        <select
          className="ios-input text-base font-normal text-left mb-4"
          value={selectedExercise || ''}
          onChange={(e) => setSelectedExercise(e.target.value || null)}
        >
          <option value="">Übung auswählen...</option>
          {exercises?.map((ex) => (
            <option key={ex.id} value={ex.id}>{ex.name}</option>
          ))}
        </select>
        {selectedExercise && <ExerciseChart exerciseId={selectedExercise} />}
      </Card>

      {/* Körpergewicht */}
      <Card>
        <div className="flex items-center justify-between mb-3">
          <p className="font-semibold">Körpergewicht</p>
          <div className="flex gap-1">
            {[30, 90, 180].map((d) => (
              <button
                key={d}
                onClick={() => setBodyDays(d)}
                className={`chip-btn px-2 py-1 rounded-lg text-xs font-semibold ${bodyDays === d ? 'chip-active' : ''}`}
              >
                {d}T
              </button>
            ))}
          </div>
        </div>
        <BodyWeightChart days={bodyDays} />
      </Card>
    </PageLayout>
  )
}
