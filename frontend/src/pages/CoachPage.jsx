import { useState, useRef, useEffect } from 'react'
import PageLayout from '../components/layout/PageLayout'
import Card from '../components/ui/Card'
import Button from '../components/ui/Button'
import Spinner from '../components/ui/Spinner'
import { useExercises } from '../hooks/useExercises'
import { useRecommendation, useWeeklySummary, useMLFeedback } from '../hooks/useML'
import { useMutation } from '@tanstack/react-query'
import { mlApi } from '../api/ml'

const CONFIDENCE_COLOR = (c) => {
  if (c >= 0.75) return 'text-ios-green'
  if (c >= 0.5) return 'text-ios-orange'
  return 'text-ios-red'
}

const REC_ICON = {
  increase_weight: '⬆️',
  increase_reps: '🔁',
  deload: '⬇️',
  maintain: '✅',
  volume_increase: '➕',
}

function RecommendationCard({ exerciseId, exerciseName }) {
  const { data: rec, isLoading } = useRecommendation(exerciseId)
  const feedback = useMLFeedback()
  const [voted, setVoted] = useState(null)

  if (isLoading) return <Card><Spinner size="sm" /></Card>
  if (!rec) return null

  const recType = rec.recommendation?.split(' ')[0]?.toLowerCase()

  const icon = REC_ICON[rec.recommendation_class] || '🤖'

  return (
    <Card>
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className="text-xl">{icon}</span>
          <p className="font-semibold text-gray-900">{exerciseName}</p>
        </div>
        <span className={`text-xs font-semibold ${CONFIDENCE_COLOR(rec.confidence)}`}>
          {Math.round(rec.confidence * 100)}% sicher
        </span>
      </div>
      <p className="text-ios-blue text-sm font-medium mb-1">{rec.recommendation_label}</p>
      <p className="text-gray-700 text-sm leading-relaxed">{rec.explanation}</p>
      {rec.suggested_weight_kg && (
        <div className="mt-3 flex gap-3">
          <div className="flex-1 rounded-xl p-2 text-center" style={{ background: 'var(--chip-bg)' }}>
            <p className="text-xs text-ios-gray-1">Empfohlen</p>
            <p className="font-bold text-gray-900">{rec.suggested_weight_kg} kg</p>
          </div>
          <div className="flex-1 rounded-xl p-2 text-center" style={{ background: 'var(--chip-bg)' }}>
            <p className="text-xs text-ios-gray-1">Wdh.</p>
            <p className="font-bold text-gray-900">{rec.suggested_reps}</p>
          </div>
        </div>
      )}

      {!voted && (
        <div className="flex gap-2 mt-3">
          <button
            onClick={() => { feedback.mutate({ predictionId: rec.id, helpful: true }); setVoted('up') }}
            className="flex-1 py-2 rounded-xl bg-ios-gray-6 text-sm font-medium active:scale-95 transition-transform"
          >
            👍 Hilfreich
          </button>
          <button
            onClick={() => { feedback.mutate({ predictionId: rec.id, helpful: false }); setVoted('down') }}
            className="flex-1 py-2 rounded-xl bg-ios-gray-6 text-sm font-medium active:scale-95 transition-transform"
          >
            👎 Nicht hilfreich
          </button>
        </div>
      )}
      {voted && (
        <p className="text-xs text-ios-gray-1 mt-3 text-center">
          {voted === 'up' ? 'Danke für dein Feedback! 🎉' : 'Danke – wir lernen daraus.'}
        </p>
      )}
    </Card>
  )
}

function WeeklySummaryCard() {
  const { data: summary, isLoading } = useWeeklySummary()

  if (isLoading) return <Card><Spinner size="sm" /></Card>
  if (!summary) return null

  return (
    <Card>
      <p className="font-semibold mb-3">Wochenzusammenfassung</p>
      <div className="grid grid-cols-3 gap-3 mb-4">
        {[
          { label: 'Trainings', value: summary.total_sessions },
          { label: 'Volumen', value: `${summary.total_volume_kg.toLocaleString('de-DE')} kg` },
          { label: 'Ø RPE', value: summary.avg_perceived_exertion?.toFixed(1) || '-' },
        ].map(({ label, value }) => (
          <div key={label} className="bg-ios-gray-6 rounded-xl p-3 text-center">
            <p className="text-lg font-bold text-gray-900">{value}</p>
            <p className="text-xs text-ios-gray-1">{label}</p>
          </div>
        ))}
      </div>
      {summary.recommendations.length > 0 && (
        <div className="space-y-2">
          {summary.recommendations.map((r, i) => (
            <div key={i} className="flex gap-2 items-start">
              <span className="mt-0.5" style={{ color: 'var(--accent-bright)' }}>💡</span>
              <p className="text-sm text-ios-gray-1">{r}</p>
            </div>
          ))}
        </div>
      )}
    </Card>
  )
}

function ChatInterface({ exerciseId }) {
  const [messages, setMessages] = useState([
    { role: 'assistant', content: 'Hey! Ich bin dein KI-Coach. Wähle eine Übung oder stelle mir eine Frage zu deinem Training.' }
  ])
  const [input, setInput] = useState('')
  const [quickQuestions, setQuickQuestions] = useState([
    'Wie läuft mein Fortschritt?',
    'Brauche ich einen Deload?',
    'Wie viele Sätze empfiehlst du?',
    'Was soll ich heute trainieren?',
  ])
  const bottomRef = useRef(null)

  const chatMutation = useMutation({
    mutationFn: ({ message, history }) => mlApi.chat(message, exerciseId, history),
    onSuccess: (data, { message }) => {
      setMessages(prev => [...prev, { role: 'assistant', content: data.reply }])
      if (data.quick_questions?.length) setQuickQuestions(data.quick_questions)
    },
    onError: () => {
      setMessages(prev => [...prev, { role: 'assistant', content: 'Fehler beim Verbinden mit dem Coach. Bitte versuche es erneut.' }])
    }
  })

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const send = (text) => {
    if (!text.trim() || chatMutation.isPending) return
    const userMsg = { role: 'user', content: text.trim() }
    const history = messages.filter(m => m.role !== 'system')
    setMessages(prev => [...prev, userMsg])
    setInput('')
    chatMutation.mutate({ message: text.trim(), history })
  }

  return (
    <div className="flex flex-col gap-3">
      {/* Chat-Nachrichten */}
      <Card className="p-0 overflow-hidden">
        <div className="flex flex-col gap-2 p-4 max-h-80 overflow-y-auto">
          {messages.map((msg, i) => (
            <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div
                className={`max-w-[85%] rounded-2xl px-3 py-2 text-sm leading-relaxed ${msg.role === 'user' ? 'rounded-br-sm' : 'rounded-bl-sm'}`}
                style={msg.role === 'user'
                  ? { background: 'var(--accent)', color: '#fff' }
                  : { background: 'var(--chip-bg)', color: 'var(--text)', border: '1px solid var(--border-subtle)' }
                }
              >
                {msg.role === 'assistant' && <span className="text-xs mr-1">🤖</span>}
                {msg.content}
              </div>
            </div>
          ))}
          {chatMutation.isPending && (
            <div className="flex justify-start">
              <div className="rounded-2xl rounded-bl-sm px-4 py-2" style={{ background: 'var(--chip-bg)', border: '1px solid var(--border-subtle)' }}>
                <div className="flex gap-1 items-center h-4">
                  <div className="w-1.5 h-1.5 rounded-full animate-bounce" style={{ background: 'var(--text-muted)', animationDelay: '0ms' }} />
                  <div className="w-1.5 h-1.5 rounded-full animate-bounce" style={{ background: 'var(--text-muted)', animationDelay: '150ms' }} />
                  <div className="w-1.5 h-1.5 rounded-full animate-bounce" style={{ background: 'var(--text-muted)', animationDelay: '300ms' }} />
                </div>
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        {/* Input */}
        <div className="p-3 flex gap-2" style={{ borderTop: '1px solid var(--border)' }}>
          <input
            type="text"
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && send(input)}
            placeholder="Frag deinen Coach..."
            className="ios-input flex-1 text-sm font-normal text-left"
          />
          <button
            onClick={() => send(input)}
            disabled={!input.trim() || chatMutation.isPending}
            className="rounded-xl px-4 py-2 text-sm font-medium disabled:opacity-40 active:scale-95 transition-transform"
            style={{ background: 'var(--accent)', color: '#fff' }}
          >
            ➤
          </button>
        </div>
      </Card>

      {/* Quick Questions */}
      <div className="flex flex-wrap gap-2">
        {quickQuestions.slice(0, 4).map((q, i) => (
          <button
            key={i}
            onClick={() => send(q)}
            disabled={chatMutation.isPending}
            className="px-3 py-1.5 rounded-full text-xs font-medium active:scale-95 transition-transform disabled:opacity-40"
            style={{ background: 'var(--chip-bg)', color: 'var(--accent-bright)', border: '1px solid var(--border)' }}
          >
            {q}
          </button>
        ))}
      </div>
    </div>
  )
}

export default function CoachPage() {
  const { data: exercises } = useExercises()
  const [selectedExerciseId, setSelectedExerciseId] = useState(null)

  const mainExercises = exercises?.filter((e) => e.exercise_type === 'compound').slice(0, 6) || []

  return (
    <PageLayout title="KI-Coach" subtitle="Personalisierte Empfehlungen">
      <WeeklySummaryCard />

      {/* Übungs-Auswahl */}
      <div>
        <p className="ios-section-title">Empfehlung für Übung</p>
        <div className="flex gap-2 overflow-x-auto pb-1 px-4">
          {mainExercises.map((ex) => (
            <button
              key={ex.id}
              onClick={() => setSelectedExerciseId(ex.id === selectedExerciseId ? null : ex.id)}
              className={`chip-btn px-3 py-2 rounded-full text-sm font-semibold whitespace-nowrap ${selectedExerciseId === ex.id ? 'chip-active' : ''}`}
            >
              {ex.name}
            </button>
          ))}
        </div>
      </div>

      {selectedExerciseId && (
        <RecommendationCard
          exerciseId={selectedExerciseId}
          exerciseName={exercises?.find((e) => e.id === selectedExerciseId)?.name || ''}
        />
      )}

      {/* Chat */}
      <div>
        <p className="ios-section-title">Chat mit deinem Coach</p>
        <ChatInterface exerciseId={selectedExerciseId} />
      </div>
    </PageLayout>
  )
}
