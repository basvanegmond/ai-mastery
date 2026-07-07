import { useState } from 'react'

export interface FullExercise {
  id: string
  title: string
  difficulty: 'Easy' | 'Medium' | 'Hard'
  description: string
}

interface FullExerciseCardProps {
  exercise: FullExercise
  onSubmit: (
    reflection: string,
    selfRating: number,
    gradeEstimate: string | null,
  ) => Promise<void>
}

const GRADES = ['D', 'C', 'B', 'A', 'A+'] as const

const DIFFICULTY_CLASSES: Record<FullExercise['difficulty'], string> = {
  Easy: 'bg-emerald-100 text-emerald-800',
  Medium: 'bg-amber-100 text-amber-800',
  Hard: 'bg-red-100 text-red-800',
}

export function FullExerciseCard({
  exercise,
  onSubmit,
}: FullExerciseCardProps): JSX.Element {
  const [reflection, setReflection] = useState('')
  const [rating, setRating] = useState(0)
  const [grade, setGrade] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const canSubmit =
    reflection.trim().length > 0 && rating >= 1 && !submitting && !submitted

  async function handleSubmit(): Promise<void> {
    if (!canSubmit) return
    setSubmitting(true)
    setError(null)
    try {
      await onSubmit(reflection, rating, grade)
      setSubmitted(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to submit')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-4">
      <div className="flex items-center justify-between gap-2">
        <h3 className="text-sm font-semibold text-gray-900">{exercise.title}</h3>
        <span
          className={`rounded px-1.5 py-0.5 text-xs ${DIFFICULTY_CLASSES[exercise.difficulty]}`}
        >
          {exercise.difficulty}
        </span>
      </div>
      <p className="mt-1 text-sm text-gray-600">{exercise.description}</p>

      <label htmlFor={`reflection-${exercise.id}`} className="sr-only">
        Reflection
      </label>
      <textarea
        id={`reflection-${exercise.id}`}
        value={reflection}
        onChange={(event) => setReflection(event.target.value)}
        disabled={submitted}
        rows={3}
        placeholder="What did you do? What worked, what didn't?"
        className="mt-3 w-full rounded border border-gray-300 px-3 py-2 text-sm focus:border-amber-500 focus:outline-none disabled:bg-gray-50"
      />

      <div className="mt-2 flex flex-wrap items-center gap-4">
        <div className="flex items-center gap-1" role="group" aria-label="Self rating">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              type="button"
              onClick={() => setRating(star)}
              disabled={submitted}
              aria-label={`Rate ${star} of 5`}
              className={`text-lg leading-none ${
                star <= rating ? 'text-amber-500' : 'text-gray-300'
              }`}
            >
              ★
            </button>
          ))}
        </div>

        <div className="flex items-center gap-1" role="group" aria-label="Grade estimate">
          <span className="mr-1 text-xs text-gray-500">Grade (optional):</span>
          {GRADES.map((g) => (
            <button
              key={g}
              type="button"
              onClick={() => setGrade(grade === g ? null : g)}
              disabled={submitted}
              className={`rounded border px-1.5 py-0.5 text-xs ${
                grade === g
                  ? 'border-emerald-500 bg-emerald-50 text-emerald-800'
                  : 'border-gray-200 text-gray-600 hover:bg-gray-50'
              }`}
            >
              {g}
            </button>
          ))}
        </div>
      </div>

      {error !== null && (
        <p className="mt-2 text-sm text-red-600" role="alert">
          {error}
        </p>
      )}

      {submitted ? (
        <p className="mt-3 text-sm font-medium text-emerald-600">Logged.</p>
      ) : (
        <button
          type="button"
          onClick={() => void handleSubmit()}
          disabled={!canSubmit}
          className="mt-3 rounded bg-gray-900 px-3 py-2 text-sm font-medium text-white hover:bg-gray-700 disabled:opacity-50"
        >
          {submitting ? 'Logging…' : 'Log reflection'}
        </button>
      )}
    </div>
  )
}
