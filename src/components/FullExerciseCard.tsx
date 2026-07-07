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
  Easy: 'bg-emerald-50 text-emerald-700',
  Medium: 'bg-amber-50 text-amber-700',
  Hard: 'bg-red-50 text-red-700',
}

export function FullExerciseCard({ exercise, onSubmit }: FullExerciseCardProps): JSX.Element {
  const [reflection, setReflection] = useState('')
  const [rating, setRating] = useState(0)
  const [grade, setGrade] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const canSubmit = reflection.trim().length > 0 && rating >= 1 && !submitting && !submitted

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
    <div className="rounded-xl border border-edge bg-canvas p-5">
      <div className="flex items-start justify-between gap-3">
        <h3 className="text-[14px] font-semibold text-ink">{exercise.title}</h3>
        <span
          className={`shrink-0 rounded-md px-2 py-0.5 text-[11px] font-medium ${DIFFICULTY_CLASSES[exercise.difficulty]}`}
        >
          {exercise.difficulty}
        </span>
      </div>
      <p className="mt-1.5 text-sm text-ink-sub">{exercise.description}</p>

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
        className="mt-4 w-full rounded-lg border border-edge bg-canvas-sub px-3 py-2.5 text-sm text-ink placeholder:text-ink-sub focus:border-trypan focus:outline-none focus:ring-2 focus:ring-trypan/20 disabled:opacity-60"
      />

      <div className="mt-3 flex flex-wrap items-center gap-4">
        <div className="flex items-center gap-0.5" role="group" aria-label="Self rating">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              type="button"
              onClick={() => setRating(star)}
              disabled={submitted}
              aria-label={`Rate ${star} of 5`}
              className={`text-[20px] leading-none transition-colors ${
                star <= rating ? 'text-trypan' : 'text-edge'
              }`}
            >
              ★
            </button>
          ))}
        </div>

        <div className="flex items-center gap-1.5" role="group" aria-label="Grade estimate">
          <span className="text-[11px] text-ink-sub">Grade (optional):</span>
          {GRADES.map((g) => (
            <button
              key={g}
              type="button"
              onClick={() => setGrade(grade === g ? null : g)}
              disabled={submitted}
              className={`rounded-md border px-2 py-0.5 text-[11px] font-medium transition-colors ${
                grade === g
                  ? 'border-trypan bg-trypan-light text-trypan'
                  : 'border-edge text-ink-sub hover:bg-canvas-sub'
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
        <p className="mt-4 text-sm font-medium text-trypan">Logged.</p>
      ) : (
        <button
          type="button"
          onClick={() => void handleSubmit()}
          disabled={!canSubmit}
          className="mt-4 rounded-lg bg-trypan px-4 py-2 text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-40"
        >
          {submitting ? 'Logging…' : 'Log reflection'}
        </button>
      )}
    </div>
  )
}
