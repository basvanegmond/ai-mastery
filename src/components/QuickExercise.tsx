import { useState } from 'react'
import type { QuickExercise as QuickExerciseData, ExerciseOption } from '../types'

interface QuickExerciseProps {
  exercise: QuickExerciseData
  onSubmit: (score: number) => Promise<void>
}

function scoreChoice(options: ExerciseOption[], selectedId: string): number {
  const selected = options.find((o) => o.id === selectedId)
  return selected?.correct === true ? 1 : 0
}

function scoreSort(options: ExerciseOption[], assignments: Record<string, string>): number {
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

export function QuickExercise({ exercise, onSubmit }: QuickExerciseProps): JSX.Element {
  const [revealed, setRevealed] = useState(false)
  const [score, setScore] = useState(0)
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)

  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [assignments, setAssignments] = useState<Record<string, string>>({})
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
    <div className="rounded-xl border border-edge bg-canvas p-5">
      <p className="text-[11px] font-medium uppercase tracking-widest text-ink-sub">
        {exercise.type === 'choice' && 'Pick the best answer'}
        {exercise.type === 'sort' && 'Sort into categories'}
        {exercise.type === 'rank' && 'Tap items in order (best first)'}
      </p>
      <p className="mt-2 text-sm font-medium text-ink">{exercise.question}</p>

      {exercise.type === 'choice' && (
        <div className="mt-4 space-y-2">
          {options.map((option) => {
            let cls = 'border-edge bg-canvas-sub hover:bg-canvas text-ink'
            if (revealed) {
              if (option.correct === true) {
                cls = 'border-emerald-400 bg-emerald-50 text-emerald-900'
              } else if (option.id === selectedId) {
                cls = 'border-red-400 bg-red-50 text-red-900'
              } else {
                cls = 'border-edge bg-canvas-sub text-ink-sub opacity-50'
              }
            } else if (option.id === selectedId) {
              cls = 'border-trypan bg-trypan-light text-trypan'
            }
            return (
              <button
                key={option.id}
                type="button"
                onClick={() => handleChoiceSelect(option.id)}
                disabled={revealed}
                className={`block w-full rounded-lg border px-4 py-2.5 text-left text-sm transition-colors ${cls}`}
              >
                {option.text}
              </button>
            )
          })}
        </div>
      )}

      {exercise.type === 'sort' && (
        <div className="mt-4 space-y-3">
          {options.map((option) => {
            const assigned = assignments[option.id]
            const correct = revealed && assigned === option.category
            return (
              <div
                key={option.id}
                className={`rounded-lg border p-3 ${
                  revealed
                    ? correct
                      ? 'border-emerald-400 bg-emerald-50'
                      : 'border-red-400 bg-red-50'
                    : 'border-edge bg-canvas-sub'
                }`}
              >
                <p className="text-sm text-ink">{option.text}</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {uniqueCategories(options).map((category) => (
                    <button
                      key={category}
                      type="button"
                      onClick={() => handleAssign(option.id, category)}
                      disabled={revealed}
                      className={`rounded-md border px-2.5 py-1 text-xs transition-colors ${
                        assigned === category
                          ? 'border-trypan bg-trypan-light text-trypan'
                          : 'border-edge bg-canvas text-ink-sub hover:bg-canvas-sub'
                      }`}
                    >
                      {category}
                    </button>
                  ))}
                </div>
                {revealed && !correct && (
                  <p className="mt-1.5 text-xs text-emerald-700">
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
              className="rounded-lg bg-trypan px-4 py-2 text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-40"
            >
              Check answers
            </button>
          )}
        </div>
      )}

      {exercise.type === 'rank' && (
        <div className="mt-4 space-y-2">
          {options.map((option) => {
            const position = order.indexOf(option.id)
            const correct = revealed && option.rank === position + 1
            return (
              <button
                key={option.id}
                type="button"
                onClick={() => handleRankTap(option.id)}
                disabled={revealed || position !== -1}
                className={`flex w-full items-center gap-3 rounded-lg border px-4 py-2.5 text-left text-sm transition-colors ${
                  revealed
                    ? correct
                      ? 'border-emerald-400 bg-emerald-50 text-emerald-900'
                      : 'border-red-400 bg-red-50 text-red-900'
                    : position !== -1
                      ? 'border-trypan bg-trypan-light text-trypan'
                      : 'border-edge bg-canvas-sub text-ink hover:bg-canvas'
                }`}
              >
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-edge text-[10px] text-ink-sub">
                  {position === -1 ? '·' : position + 1}
                </span>
                <span className="flex-1">{option.text}</span>
                {revealed && !correct && (
                  <span className="text-[10px] text-emerald-700">#{option.rank}</span>
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
                className="rounded-lg bg-trypan px-4 py-2 text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-40"
              >
                Check order
              </button>
              <button
                type="button"
                onClick={() => setOrder([])}
                disabled={order.length === 0}
                className="rounded-lg border border-edge px-4 py-2 text-sm text-ink-sub hover:bg-canvas disabled:opacity-40"
              >
                Reset
              </button>
            </div>
          )}
        </div>
      )}

      {revealed && (
        <div className="mt-5 border-t border-edge pt-4">
          <p className="text-sm font-medium text-ink">Score: {Math.round(score * 100)}%</p>
          {exercise.explanation !== undefined && (
            <p className="mt-1.5 text-sm text-ink-sub">{exercise.explanation}</p>
          )}
          {submitError !== null && (
            <p className="mt-2 text-sm text-red-600" role="alert">
              {submitError}
            </p>
          )}
          {submitted ? (
            <p className="mt-3 text-sm font-medium text-trypan">Recorded.</p>
          ) : (
            <button
              type="button"
              onClick={() => void handleSubmit()}
              disabled={submitting}
              className="mt-3 rounded-lg bg-trypan px-4 py-2 text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-40"
            >
              {submitting ? 'Submitting…' : 'Submit'}
            </button>
          )}
        </div>
      )}
    </div>
  )
}
