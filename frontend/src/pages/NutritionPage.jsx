import { useState } from 'react'
import { useChartColors } from '../hooks/useChartColors'
import PageLayout from '../components/layout/PageLayout'
import Card from '../components/ui/Card'
import Button from '../components/ui/Button'
import Modal from '../components/ui/Modal'
import Input from '../components/ui/Input'
import Spinner from '../components/ui/Spinner'
import { useNutritionSummary, useAddNutrition } from '../hooks/useNutrition'
import { nutritionApi } from '../api/nutrition'

const MEAL_TYPES = [
  { value: 'breakfast', label: 'Frühstück', icon: '🌅' },
  { value: 'lunch', label: 'Mittagessen', icon: '☀️' },
  { value: 'dinner', label: 'Abendessen', icon: '🌙' },
  { value: 'snack', label: 'Snack', icon: '🍎' },
]

function MacroRing({ calories, target = 2500 }) {
  const c = useChartColors()
  const pct = Math.min(1, calories / target)
  const r = 50
  const circ = 2 * Math.PI * r
  const dash = pct * circ

  return (
    <div className="flex flex-col items-center">
      <svg width="120" height="120" viewBox="0 0 120 120">
        <circle cx="60" cy="60" r={r} fill="none" stroke={c.border} strokeWidth="10" />
        <circle
          cx="60" cy="60" r={r} fill="none" stroke={c.accent} strokeWidth="10"
          strokeDasharray={`${dash} ${circ}`}
          strokeLinecap="round"
          transform="rotate(-90 60 60)"
          style={{ transition: 'stroke-dasharray 0.5s ease' }}
        />
        <text x="60" y="56" textAnchor="middle" dominantBaseline="middle" style={{ fontSize: 20, fontWeight: 700, fill: c.text }}>
          {Math.round(calories)}
        </text>
        <text x="60" y="73" textAnchor="middle" style={{ fontSize: 11, fill: c.textMuted }}>kcal</text>
      </svg>
      <p className="text-xs text-ios-gray-1 mt-1">Ziel: {target} kcal</p>
    </div>
  )
}

function AddFoodModal({ open, onClose, date }) {
  const addNutrition = useAddNutrition(date)
  const [search, setSearch] = useState('')
  const [searchResults, setSearchResults] = useState([])
  const [searching, setSearching] = useState(false)
  const [meal, setMeal] = useState('lunch')
  const [portionG, setPortionG] = useState('100')
  const [selected, setSelected] = useState(null)
  const [manual, setManual] = useState({ food_name: '', calories: '', protein_g: '', carbs_g: '', fat_g: '' })
  const [mode, setMode] = useState('search') // 'search' | 'manual'

  const handleSearch = async () => {
    if (!search.trim()) return
    setSearching(true)
    try {
      const results = await nutritionApi.searchFood(search)
      setSearchResults(results.filter((r) => r.calories > 0))
    } catch { setSearchResults([]) }
    setSearching(false)
  }

  const handleSave = async () => {
    const portion = parseFloat(portionG) / 100
    const entry = selected
      ? {
          food_name: selected.name,
          meal_type: meal,
          calories: Math.round(selected.calories * portion),
          protein_g: Math.round(selected.protein_g * portion * 10) / 10,
          carbs_g: Math.round(selected.carbs_g * portion * 10) / 10,
          fat_g: Math.round(selected.fat_g * portion * 10) / 10,
        }
      : { ...manual, meal_type: meal,
          calories: parseFloat(manual.calories), protein_g: parseFloat(manual.protein_g),
          carbs_g: parseFloat(manual.carbs_g), fat_g: parseFloat(manual.fat_g) }

    await addNutrition.mutateAsync(entry)
    onClose()
  }

  return (
    <Modal open={open} onClose={onClose} title="Mahlzeit hinzufügen">
      {/* Mahlzeitstyp */}
      <div className="flex gap-2 mb-4">
        {MEAL_TYPES.map((m) => (
          <button key={m.value} onClick={() => setMeal(m.value)}
            className={`chip-btn flex-1 py-2 rounded-xl text-xs font-semibold ${meal === m.value ? 'chip-active' : ''}`}>
            {m.icon}<br />{m.label}
          </button>
        ))}
      </div>

      {/* Mode toggle */}
      <div className="toggle-bar flex gap-1 mb-4">
        {['search', 'manual'].map((m) => (
          <button key={m} onClick={() => setMode(m)}
            className={`toggle-option flex-1 py-2 rounded-lg text-sm font-semibold ${mode === m ? 'toggle-active' : ''}`}>
            {m === 'search' ? '🔍 Suche' : '✏️ Manuell'}
          </button>
        ))}
      </div>

      {mode === 'search' ? (
        <div className="space-y-3">
          <div className="flex gap-2">
            <input className="ios-input text-base font-normal text-left flex-1" placeholder="z.B. Banane, Haferflocken..."
              value={search} onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()} />
            <Button onClick={handleSearch} disabled={searching}>Suchen</Button>
          </div>
          {searching && <Spinner size="sm" />}
          <div className="space-y-1 max-h-56 overflow-y-auto">
            {searchResults.map((r, i) => {
              const isSelected = selected?.name === r.name
              return (
                <button key={i} onClick={() => setSelected(r)}
                  className={`w-full text-left px-3 py-2 rounded-xl transition-colors flex items-center gap-3
                    ${isSelected ? 'border' : ''}`}
                  style={isSelected ? {
                    background: 'var(--accent-dim)',
                    borderColor: 'var(--accent)',
                  } : {}}
                >
                  {r.image ? (
                    <img src={r.image} alt={r.name} className="w-10 h-10 rounded-lg object-cover shrink-0" />
                  ) : (
                    <div className="w-10 h-10 rounded-lg flex items-center justify-center text-xl shrink-0"
                      style={{ background: 'var(--chip-bg)' }}>🍽️</div>
                  )}
                  <div className="min-w-0">
                    <p className="font-medium text-sm truncate">{r.name}</p>
                    {r.brand && <p className="text-xs truncate" style={{ color: 'var(--text-muted)' }}>{r.brand}</p>}
                    <p className="text-xs" style={{ color: 'var(--text-soft)' }}>
                      {r.calories} kcal · E:{r.protein_g}g K:{r.carbs_g}g F:{r.fat_g}g
                    </p>
                  </div>
                </button>
              )
            })}
            {searchResults.length === 0 && !searching && search.trim() && (
              <p className="text-sm text-center py-3" style={{ color: 'var(--text-muted)' }}>
                Keine Ergebnisse — versuche manuell einzutragen
              </p>
            )}
          </div>
          {selected && (
            <div>
              <label className="text-xs font-semibold text-ios-gray-1 uppercase tracking-wide">Portion (g)</label>
              <input className="ios-input mt-1 text-center" type="number" inputMode="numeric"
                value={portionG} onChange={(e) => setPortionG(e.target.value)} />
              <p className="text-center text-xs text-ios-gray-1 mt-1">
                ≈ {Math.round(selected.calories * parseFloat(portionG || 0) / 100)} kcal
              </p>
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          <Input label="Name" value={manual.food_name} onChange={(e) => setManual(m => ({ ...m, food_name: e.target.value }))} placeholder="z.B. Omelette" />
          <div className="grid grid-cols-2 gap-3">
            <Input label="Kalorien (kcal)" type="number" inputMode="numeric" value={manual.calories} onChange={(e) => setManual(m => ({ ...m, calories: e.target.value }))} />
            <Input label="Protein (g)" type="number" inputMode="numeric" value={manual.protein_g} onChange={(e) => setManual(m => ({ ...m, protein_g: e.target.value }))} />
            <Input label="Kohlenhydrate (g)" type="number" inputMode="numeric" value={manual.carbs_g} onChange={(e) => setManual(m => ({ ...m, carbs_g: e.target.value }))} />
            <Input label="Fett (g)" type="number" inputMode="numeric" value={manual.fat_g} onChange={(e) => setManual(m => ({ ...m, fat_g: e.target.value }))} />
          </div>
        </div>
      )}

      <Button onClick={handleSave} className="w-full mt-4"
        disabled={addNutrition.isPending || (mode === 'search' && !selected && !manual.food_name)}>
        Hinzufügen
      </Button>
    </Modal>
  )
}

export default function NutritionPage() {
  const today = new Date().toISOString().split('T')[0]
  const { data: summary, isLoading } = useNutritionSummary(today)
  const [showAdd, setShowAdd] = useState(false)

  const grouped = MEAL_TYPES.map((mt) => ({
    ...mt,
    entries: summary?.entries?.filter((e) => e.meal_type === mt.value) || [],
  }))

  return (
    <PageLayout
      title="Ernährung"
      subtitle={new Date().toLocaleDateString('de-DE', { weekday: 'long', day: 'numeric', month: 'long' })}
      action={<Button onClick={() => setShowAdd(true)}>+ Mahlzeit</Button>}
    >
      {isLoading ? <Spinner /> : (
        <>
          {/* Kalorien-Ring + Makros */}
          <Card>
            <div className="flex items-center gap-4">
              <MacroRing calories={summary?.total_calories || 0} />
              <div className="flex-1 space-y-2">
                {[
                  { label: 'Protein', value: summary?.total_protein_g || 0, color: 'bg-ios-blue', unit: 'g' },
                  { label: 'Kohlenhydrate', value: summary?.total_carbs_g || 0, color: 'bg-ios-orange', unit: 'g' },
                  { label: 'Fett', value: summary?.total_fat_g || 0, color: 'bg-ios-purple', unit: 'g' },
                ].map(({ label, value, color, unit }) => (
                  <div key={label}>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-ios-gray-1">{label}</span>
                      <span className="font-semibold">{Math.round(value)}{unit}</span>
                    </div>
                    <div className="h-1.5 bg-ios-gray-5 rounded-full overflow-hidden">
                      <div className={`h-full ${color} rounded-full`} style={{ width: `${Math.min(100, (value / 50) * 100)}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </Card>

          {/* Mahlzeiten */}
          {grouped.map(({ value, label, icon, entries }) => entries.length > 0 && (
            <div key={value}>
              <p className="ios-section-title">{icon} {label}</p>
              <Card>
                <div className="space-y-2">
                  {entries.map((e) => (
                    <div key={e.id} className="flex justify-between items-center">
                      <div>
                        <p className="font-medium text-sm">{e.food_name}</p>
                        <p className="text-xs text-ios-gray-1">P:{Math.round(e.protein_g)}g · K:{Math.round(e.carbs_g)}g · F:{Math.round(e.fat_g)}g</p>
                      </div>
                      <p className="font-semibold text-sm">{Math.round(e.calories)} kcal</p>
                    </div>
                  ))}
                </div>
              </Card>
            </div>
          ))}

          {summary?.entries?.length === 0 && (
            <Card>
              <div className="text-center py-6">
                <div className="text-4xl mb-2">🍎</div>
                <p className="font-semibold">Noch nichts geloggt</p>
                <p className="text-ios-gray-1 text-sm mt-1">Füge deine erste Mahlzeit hinzu</p>
              </div>
            </Card>
          )}
        </>
      )}

      <AddFoodModal open={showAdd} onClose={() => setShowAdd(false)} date={today} />
    </PageLayout>
  )
}
