import { useState, useEffect } from 'react'
import type { DomainKey, GeneratedExercise, ExerciseEntry } from '../../types'
import { useExerciseGenerator } from '../../hooks/useExerciseGenerator'
import { useMasteryStore } from '../../store/masteryStore'

interface QuickExerciseProps {
  domain: DomainKey
}

async function hashExercise(exercise: GeneratedExercise): Promise<string> {
  const text = exercise.domain + '::' + exercise.corePromptText
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text))
  return Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, '0')).join('')
}

export function QuickExercise({ domain }: QuickExerciseProps) {
  const { generate, loading, error } = useExerciseGenerator()
  const addExerciseEntry = useMasteryStore((s) => s.addExerciseEntry)

  const [exercise, setExercise] = useState<GeneratedExercise | null>(null)
  const [selected, setSelected] = useState<string | null>(null)
  const [revealed, setRevealed] = useState(false)

  useEffect(() => {
    loadExercise()
  }, [domain]) // eslint-disable-line react-hooks/exhaustive-deps

  async function loadExercise() {
    setSelected(null)
    setRevealed(false)
    const ex = await generate(domain, 'choice')
    setExercise(ex)
  }

  async function handleReveal() {
    if (!exercise || !selected) return
    setRevealed(true)

    const isCorrect = selected === exercise.correctAnswer
    const score = isCorrect ? 1 : 0
    const hash = await hashExercise(exercise)

    const entry: ExerciseEntry = {
      id: crypto.randomUUID(),
      domain: exercise.domain,
      type: exercise.type,
      exerciseHash: hash,
      promptSnapshot: exercise.corePromptText,
      userAnswer: selected,
      correctAnswer: exercise.correctAnswer,
      score,
      weaknessTagsAddressed: exercise.weaknessTagsAddressed,
      createdAt: new Date().toISOString(),
    }

    addExerciseEntry(entry)
  }

  if (loading) {
    return (
      <div className="space-y-3 animate-pulse">
        <div className="h-5 rounded" style={{ background: 'var(--bg2)', width: '80%' }} />
        <div className="h-4 rounded" style={{ background: 'var(--bg2)', width: '60%' }} />
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-12 rounded-xl" style={{ background: 'var(--bg2)' }} />
        ))}
      </div>
    )
  }

  if (error) {
    return (
      <div className="space-y-3">
        <div
          className="rounded-xl p-4 text-sm"
          style={{ background: 'rgba(224,92,92,0.1)', border: '1px solid rgba(224,92,92,0.3)', color: 'var(--danger)' }}
        >
          <div className="font-medium mb-1">Generation failed</div>
          <div className="text-xs opacity-80">{error}</div>
        </div>
        <button
          onClick={loadExercise}
          className="w-full py-2 rounded-xl text-sm transition-neo"
          style={{ boxShadow: 'var(--neo-raised)', background: 'var(--surface)', color: 'var(--text-primary)', fontFamily: 'DM Mono, monospace' }}
        >
          retry
        </button>
      </div>
    )
  }

  if (!exercise) return null

  return (
    <div className="space-y-4">
      {/* Question */}
      <div
        className="rounded-xl p-4 text-sm leading-relaxed"
        style={{ background: 'var(--surface)', boxShadow: 'var(--neo-raised)', color: 'var(--text-primary)' }}
      >
        {exercise.question}
      </div>

      {/* Options */}
      <div className="space-y-2">
        {exercise.options.map((opt) => {
          const isCorrect = opt.id === exercise.correctAnswer
          const isSelected = opt.id === selected

          let bg = 'var(--surface)'
          let border = 'transparent'
          let textColor = 'var(--text-secondary)'
          let shadow = revealed ? 'var(--neo-flat)' : 'var(--neo-raised)'

          if (revealed) {
            if (isCorrect) { bg = 'rgba(92,184,92,0.15)'; border = 'rgba(92,184,92,0.4)'; textColor = 'var(--success)' }
            else if (isSelected) { bg = 'rgba(224,92,92,0.12)'; border = 'rgba(224,92,92,0.4)'; textColor = 'var(--danger)' }
          } else if (isSelected) {
            shadow = 'var(--neo-inset)'
            textColor = 'var(--text-primary)'
          }

          return (
            <button
              key={opt.id}
              onClick={() => !revealed && setSelected(opt.id)}
              disabled={revealed}
              className="w-full text-left px-4 py-3 rounded-xl text-sm transition-neo"
              style={{
                boxShadow: shadow,
                background: bg,
                border: `1px solid ${border}`,
                color: textColor,
                fontFamily: 'DM Mono, monospace',
                cursor: revealed ? 'default' : 'pointer',
              }}
            >
              <span style={{ opacity: 0.5, marginRight: '8px' }}>{opt.id}.</span>
              {opt.text}
            </button>
          )
        })}
      </div>

      {/* Reveal / explanation */}
      {!revealed ? (
        <button
          onClick={handleReveal}
          disabled={!selected}
          className="w-full py-3 rounded-xl text-sm font-medium transition-neo"
          style={{
            boxShadow: selected ? 'var(--neo-raised)' : 'none',
            background: selected ? 'var(--surface)' : 'transparent',
            color: selected ? 'var(--text-primary)' : 'var(--text-muted)',
            border: selected ? 'none' : '1px dashed rgba(255,255,255,0.1)',
            fontFamily: 'DM Mono, monospace',
            cursor: selected ? 'pointer' : 'default',
          }}
        >
          reveal answer
        </button>
      ) : (
        <div className="space-y-3">
          <div
            className="rounded-xl p-4 text-sm"
            style={{
              background: 'var(--surface)',
              boxShadow: 'var(--neo-inset)',
              color: 'var(--text-secondary)',
              fontFamily: 'DM Mono, monospace',
              lineHeight: '1.6',
            }}
          >
            {exercise.explanation}
          </div>

          {exercise.weaknessTagsAddressed.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {exercise.weaknessTagsAddressed.map((tag) => (
                <span
                  key={tag}
                  className="text-xs px-2 py-0.5 rounded"
                  style={{ background: 'rgba(108,142,191,0.15)', color: 'var(--accent)', fontFamily: 'DM Mono, monospace' }}
                >
                  {tag}
                </span>
              ))}
            </div>
          )}

          <button
            onClick={loadExercise}
            className="w-full py-3 rounded-xl text-sm transition-neo"
            style={{
              boxShadow: 'var(--neo-raised)',
              background: 'var(--surface)',
              color: 'var(--text-primary)',
              fontFamily: 'DM Mono, monospace',
            }}
          >
            new ↺
          </button>
        </div>
      )}
    </div>
  )
}
