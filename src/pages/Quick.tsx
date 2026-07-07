import { useCallback, useEffect, useState } from 'react'
import { QuickExercise } from '../components/QuickExercise'
import { useApp } from '../contexts/AppContext'
import type { ExerciseOption, QuickExercise as QuickExerciseData } from '../types'
import { getDomainColor } from '../utils/domains'

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function isExerciseOption(value: unknown): value is ExerciseOption {
  return (
    isRecord(value) &&
    typeof value.id === 'string' &&
    typeof value.text === 'string' &&
    (value.correct === undefined || typeof value.correct === 'boolean') &&
    (value.category === undefined || typeof value.category === 'string') &&
    (value.rank === undefined || typeof value.rank === 'number')
  )
}

function isQuickExercise(value: unknown): value is QuickExerciseData {
  return (
    isRecord(value) &&
    typeof value.id === 'string' &&
    (value.type === 'choice' || value.type === 'sort' || value.type === 'rank') &&
    typeof value.domainId === 'string' &&
    typeof value.question === 'string' &&
    (value.explanation === undefined || typeof value.explanation === 'string') &&
    Array.isArray(value.options) &&
    value.options.every(isExerciseOption)
  )
}

function isGenerateResponse(value: unknown): value is { exercises: QuickExerciseData[] } {
  return (
    isRecord(value) &&
    Array.isArray(value.exercises) &&
    value.exercises.length > 0 &&
    value.exercises.every(isQuickExercise)
  )
}

async function errorMessageFrom(response: Response): Promise<string> {
  try {
    const data: unknown = await response.json()
    if (isRecord(data) && typeof data.error === 'string') return data.error
  } catch {
    // fall through
  }
  return `Request failed (HTTP ${response.status})`
}

function Skeleton(): JSX.Element {
  return (
    <div className="space-y-4 p-6" aria-label="Loading exercises">
      <div className="h-8 w-56 animate-pulse rounded-lg bg-canvas" />
      <div className="flex gap-2">
        {[0, 1, 2].map((i) => (
          <div key={i} className="h-8 w-24 animate-pulse rounded-full bg-canvas" />
        ))}
      </div>
      <div className="h-40 animate-pulse rounded-xl bg-canvas" />
      <div className="h-40 animate-pulse rounded-xl bg-canvas" />
    </div>
  )
}

export default function Quick(): JSX.Element {
  const { state, refetch } = useApp()
  const [selectedDomainId, setSelectedDomainId] = useState<string | null>(null)
  const [exercises, setExercises] = useState<QuickExerciseData[] | null>(null)
  const [genLoading, setGenLoading] = useState(false)
  const [genError, setGenError] = useState<string | null>(null)
  const [genCount, setGenCount] = useState(0)

  const gradedDomains = state?.domains.filter((d) => d.graded) ?? []
  const domainId = selectedDomainId ?? gradedDomains[0]?.id ?? null
  const selectedDomain = gradedDomains.find((d) => d.id === domainId) ?? null

  useEffect(() => {
    if (domainId === null) return
    if (exercises !== null && exercises.every((e) => e.domainId === domainId)) return
    let cancelled = false

    async function generate(): Promise<void> {
      setGenLoading(true)
      setGenError(null)
      setExercises(null)
      try {
        const response = await fetch('/api/exercises/quick/generate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ domainId }),
        })
        if (cancelled) return
        if (!response.ok) throw new Error(await errorMessageFrom(response))
        const data: unknown = await response.json()
        if (!isGenerateResponse(data)) {
          throw new Error('Server returned exercises in an unexpected shape')
        }
        if (!cancelled) setExercises(data.exercises)
      } catch (err) {
        if (!cancelled) {
          setGenError(err instanceof Error ? err.message : 'Failed to generate exercises')
        }
      } finally {
        if (!cancelled) setGenLoading(false)
      }
    }

    void generate()
    return () => {
      cancelled = true
    }
  }, [domainId, genCount])

  const regenerate = useCallback(() => {
    setExercises(null)
    setGenCount((c) => c + 1)
  }, [])

  const handleSubmit = useCallback(
    async (exercise: QuickExerciseData, score: number): Promise<void> => {
      const response = await fetch('/api/exercises/quick/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          exerciseId: exercise.id,
          domainId: exercise.domainId,
          correct: score > 0.5,
          score,
        }),
      })
      if (!response.ok) throw new Error(await errorMessageFrom(response))
      refetch()
    },
    [refetch],
  )

  if (state === null) return <Skeleton />

  if (gradedDomains.length === 0) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center p-6">
        <p className="text-sm text-ink-sub">
          No graded domains yet. Complete a baseline assessment first.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div>
        <h1 className="font-serif text-2xl text-ink">Quick Practice</h1>
        <p className="mt-1 text-sm text-ink-sub">
          Two exercises per session, domain first.
        </p>
      </div>

      {/* Domain pills */}
      <div className="flex gap-2 overflow-x-auto pb-1" aria-label="Select domain">
        {gradedDomains.map((domain) => {
          const isActive = domain.id === domainId
          const color = getDomainColor(domain.id)
          return (
            <button
              key={domain.id}
              type="button"
              onClick={() => {
                setSelectedDomainId(domain.id)
                setExercises(null)
              }}
              style={isActive ? { borderColor: color, color } : {}}
              className={`shrink-0 rounded-full border px-3.5 py-1.5 text-[13px] transition-colors ${
                isActive
                  ? 'font-medium'
                  : 'border-edge bg-canvas text-ink-sub hover:bg-canvas-sub'
              }`}
            >
              {domain.name}
            </button>
          )
        })}
      </div>

      {/* Domain description */}
      {selectedDomain !== null && (
        <p className="text-sm text-ink-sub">{selectedDomain.description}</p>
      )}

      {/* Exercises */}
      <section aria-label="Quick exercises" className="space-y-4">
        {genLoading && (
          <>
            <div className="h-44 animate-pulse rounded-xl bg-canvas" />
            <div className="h-44 animate-pulse rounded-xl bg-canvas" />
          </>
        )}
        {genError !== null && !genLoading && (
          <div className="rounded-xl border border-red-200 bg-red-50 p-4">
            <p className="text-sm text-red-700">{genError}</p>
            <button
              type="button"
              onClick={regenerate}
              className="mt-2 rounded-lg border border-red-300 px-3 py-1.5 text-sm text-red-700 hover:bg-red-100"
            >
              Try again
            </button>
          </div>
        )}
        {exercises !== null && !genLoading && (
          <>
            {exercises.map((exercise) => (
              <QuickExercise
                key={exercise.id}
                exercise={exercise}
                onSubmit={(score) => handleSubmit(exercise, score)}
              />
            ))}
            <button
              type="button"
              onClick={regenerate}
              className="rounded-lg border border-edge bg-canvas px-4 py-2 text-sm text-ink-sub hover:bg-canvas-sub"
            >
              New exercises ↺
            </button>
          </>
        )}
      </section>
    </div>
  )
}
