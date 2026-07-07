import { useState } from 'react'
import type { QuickExercise as QuickExerciseData, ExerciseOption } from '../types'

interface QuickExerciseProps {
  exercise: QuickExerciseData
  onSubmit: (score: number) => Promise<void>
}

// ---------------------------------------------------------------------------
// Scoring helpers
// ---------------------------------------------------------------------------

function scoreChoice(options: ExerciseOption[], selectedId: string): number {
  const selected = options.find((o) => o.id === selectedId)
  return selected?.correct === true ? 1 : 0
}

function scoreSort(
  options: ExerciseOption[],
  assignments: Record<string, string>,
): number {
  if (options.length === 0) return 0
  const correct = options.filter((o) => assignments[o.id] === o.category).length
  return correct / options.length
}

function scoreRank(options: ExerciseOption[], order: string[]): number {
  if (options.length === 0) return 0
  let correct = 0
  order.forEach((optionId, index) => {
    const option = options.find((o) => o.id === optionId)
    if (option !== undefined && option.rank === index + 1) correct++
  })
  return correct / options.length
}

function uniqueCategories(options: ExerciseOption[]): string[] {
  const categories: string[] = []
  for (const option of options) {
    if (option.category !== undefined && !categories.includes(option.category)) {
      categories.push(option.category)
    }
  }
  return categories
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function QuickExercise({ exercise, onSubmit }: QuickExerciseProps): JSX.Element {
  const [revealed, setRevealed] = useState(false)
  const [score, setScore] = useState(0)
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)

  // choice state
  const [selectedId, setSelectedId] = useState<string | null>(null)
  // sort state: optionId -> category
  const [assignments, setAssignments] = useState<Record<string, string>>({})
  // rank state: option ids in tapped order
  const [order, setOrder] = useState<string[]>([])

  const { options } = exercise

  function handleChoiceSelect(optionId: string): void {
    if (revealed) return
    setSelectedId(optionId)
    setScore(scoreChoice(options, optionId))
    setRevealed(true)
  }

  function handleAssign(optionId: string, category: string): void {
    if (revealed) return
    setAssignments((prev) => ({ ...prev, [optionId]: category }))
  }

  function handleRankTap(optionId: string): void {
    if (revealed || order.includes(optionId)) return
    setOrder((prev) => [...prev, optionId])
  }

  function handleCheckSort(): void {
    setScore(scoreSort(options, assignments))
    setRevealed(true)
  }

  function handleCheckRank(): void {
    setScore(scoreRank(options, order))
    setRevealed(true)
  }

  async function handleSubmit(): Promise<void> {
    if (submitting || submitted) return
    setSubmitting(true)
    setSubmitError(null)
    try {
      await onSubmit(score)
      setSubmitted(true)
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'Failed to submit')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-4">
      <p className="text-xs font-medium uppercase tracking-wide text-gray-400">
        {exercise.type === 'choice' && 'Pick the best answer'}
        {exercise.type === 'sort' && 'Sort into categories'}
        {exercise.type === 'rank' && 'Tap items in order (best first)'}
      </p>
      <p className="mt-1 text-sm font-medium text-gray-900">{exercise.question}</p>

      {exercise.type === 'choice' && (
        <div className="mt-3 space-y-2">
          {options.map((option) => {
            let optionClass = 'border-gray-200 bg-white hover:bg-gray-50'
            if (revealed) {
              if (option.correct === true) {
                optionClass = 'border-emerald-500 bg-emerald-50'
              } else if (option.id === selectedId) {
                optionClass = 'border-red-400 bg-red-50'
              } else {
                optionClass = 'border-gray-200 bg-white opacity-60'
              }
            } else if (option.id === selectedId) {
              optionClass = 'border-amber-500 bg-amber-50'
            }
            return (
              <button
                key={option.id}
                type="button"
                onClick={() => handleChoiceSelect(option.id)}
                disabled={revealed}
                className={`block w-full rounded border px-3 py-2 text-left text-sm ${optionClass}`}
              >
                {option.text}
              </button>
            )
          })}
        </div>
      )}

      {exercise.type === 'sort' && (
        <div className="mt-3 space-y-3">
          {options.map((option) => {
            const assigned = assignments[option.id]
            const correct = revealed && assigned === option.category
            return (
              <div
                key={option.id}
                className={`rounded border p-2 ${
                  revealed
                    ? correct
                      ? 'border-emerald-500 bg-emerald-50'
                      : 'border-red-400 bg-red-50'
                    : 'border-gray-200'
                }`}
              >
                <p className="text-sm text-gray-900">{option.text}</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {uniqueCategories(options).map((category) => (
                    <button
                      key={category}
                      type="button"
                      onClick={() => handleAssign(option.id, category)}
                      disabled={revealed}
                      className={`rounded border px-2 py-1 text-xs ${
                        assigned === category
                          ? 'border-amber-500 bg-amber-100 text-amber-800'
                          : 'border-gray-200 bg-white text-gray-600 hover:bg-gray-50'
                      }`}
                    >
                      {category}
                    </button>
                  ))}
                </div>
                {revealed && !correct && (
                  <p className="mt-1 text-xs text-emerald-700">
                    Correct: {option.category ?? 'unknown'}
                  </p>
                )}
              </div>
            )
          })}
          {!revealed && (
            <button
              type="button"
              onClick={handleCheckSort}
              disabled={Object.keys(assignments).length < options.length}
              className="rounded bg-gray-900 px-3 py-2 text-sm font-medium text-white disabled:opacity-50"
            >
              Check answers
            </button>
          )}
        </div>
      )}

      {exercise.type === 'rank' && (
        <div className="mt-3 space-y-2">
          {options.map((option) => {
            const position = order.indexOf(option.id)
            const correct = revealed && option.rank === position + 1
            return (
              <button
                key={option.id}
                type="button"
                onClick={() => handleRankTap(option.id)}
                disabled={revealed || position !== -1}
                className={`flex w-full items-center gap-2 rounded border px-3 py-2 text-left text-sm ${
                  revealed
                    ? correct
                      ? 'border-emerald-500 bg-emerald-50'
                      : 'border-red-400 bg-red-50'
                    : position !== -1
                      ? 'border-amber-500 bg-amber-50'
                      : 'border-gray-200 bg-white hover:bg-gray-50'
                }`}
              >
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-gray-100 text-xs text-gray-600">
                  {position === -1 ? '·' : position + 1}
                </span>
                <span className="flex-1">{option.text}</span>
                {revealed && !correct && (
                  <span className="text-xs text-emerald-700">#{option.rank}</span>
                )}
              </button>
            )
          })}
          {!revealed && (
            <div className="flex gap-2">
              <button
                type="button"
                onClick={handleCheckRank}
                disabled={order.length < options.length}
                className="rounded bg-gray-900 px-3 py-2 text-sm font-medium text-white disabled:opacity-50"
              >
                Check order
              </button>
              <button
                type="button"
                onClick={() => setOrder([])}
                disabled={order.length === 0}
                className="rounded border border-gray-200 px-3 py-2 text-sm text-gray-600 disabled:opacity-50"
              >
                Reset
              </button>
            </div>
          )}
        </div>
      )}

      {revealed && (
        <div className="mt-4 border-t border-gray-100 pt-3">
          <p className="text-sm font-medium text-gray-900">
            Score: {Math.round(score * 100)}%
          </p>
          {exercise.explanation !== undefined && (
            <p className="mt-1 text-sm text-gray-600">{exercise.explanation}</p>
          )}
          {submitError !== null && (
            <p className="mt-2 text-sm text-red-600" role="alert">
              {submitError}
            </p>
          )}
          {submitted ? (
            <p className="mt-2 text-sm font-medium text-emerald-600">Recorded.</p>
          ) : (
            <button
              type="button"
              onClick={() => void handleSubmit()}
              disabled={submitting}
              className="mt-2 rounded bg-emerald-600 px-3 py-2 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-50"
            >
              {submitting ? 'Submitting…' : 'Submit'}
            </button>
          )}
        </div>
      )}
    </div>
  )
}
