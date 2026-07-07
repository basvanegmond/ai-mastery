import { useCallback, useEffect, useState } from 'react'
import { FullExerciseCard } from '../components/FullExerciseCard'
import type { FullExercise } from '../components/FullExerciseCard'
import { QuickExercise } from '../components/QuickExercise'
import { useApp } from '../contexts/AppContext'
import type { ExerciseOption, QuickExercise as QuickExerciseData } from '../types'

// ---------------------------------------------------------------------------
// Hardcoded Full mode exercises (4 per domain)
// ---------------------------------------------------------------------------

const FULL_EXERCISES: Record<string, FullExercise[]> = {
  'prompt-construction': [
    { id: 'pc-1', title: 'Context Loading', difficulty: 'Easy', description: 'Write a prompt that front-loads all necessary project context in a single message, eliminating the need for follow-up clarifications.' },
    { id: 'pc-2', title: 'Scope Precision', difficulty: 'Medium', description: 'Take a vague brief and transform it into a precisely scoped prompt with explicit constraints, deliverable format, and success criteria.' },
    { id: 'pc-3', title: 'Multi-step Orchestration', difficulty: 'Hard', description: 'Design a prompt sequence for a complex deliverable that maintains context and builds coherently across 5+ turns.' },
    { id: 'pc-4', title: 'Persona Calibration', difficulty: 'Medium', description: 'Craft prompts that consistently elicit the right level of technicality, tone, and perspective for a specific audience.' },
  ],
  'output-evaluation': [
    { id: 'oe-1', title: 'Assumption Surfacing', difficulty: 'Easy', description: 'Review an AI output and identify all hidden assumptions the model made that were not in your prompt.' },
    { id: 'oe-2', title: 'Logic Pressure Test', difficulty: 'Medium', description: 'Take a Claude recommendation and find the three strongest counterarguments it did not raise.' },
    { id: 'oe-3', title: 'Consistency Audit', difficulty: 'Hard', description: 'Identify internal inconsistencies across a multi-section document produced by AI.' },
    { id: 'oe-4', title: 'Quality Calibration', difficulty: 'Medium', description: 'Develop a personal scoring rubric for AI output quality in your primary work domain.' },
  ],
  'agentic-architecture': [
    { id: 'aa-1', title: 'Agent Decomposition', difficulty: 'Easy', description: 'Map a complex task to a multi-agent architecture, identifying orchestrator and sub-agent responsibilities.' },
    { id: 'aa-2', title: 'Tool Chain Design', difficulty: 'Medium', description: 'Design the tool-call sequence for an automated workflow, specifying inputs, outputs, and handoffs.' },
    { id: 'aa-3', title: 'Failure Mode Mapping', difficulty: 'Hard', description: 'For a proposed agent system, enumerate all failure modes and design recovery strategies for each.' },
    { id: 'aa-4', title: 'Context Budget', difficulty: 'Medium', description: 'Plan a long-running agent task while staying within context limits — define what gets summarized vs. preserved.' },
  ],
  'tool-selection': [
    { id: 'ts-1', title: 'Tool Triage', difficulty: 'Easy', description: 'Given 5 different tasks, assign the optimal AI tool for each and justify your reasoning.' },
    { id: 'ts-2', title: 'Capability Mapping', difficulty: 'Medium', description: 'Build a decision matrix for choosing between Claude, Perplexity, and specialized tools for common work tasks.' },
    { id: 'ts-3', title: 'Integration Design', difficulty: 'Hard', description: 'Design a workflow that uses 3+ different AI tools in sequence, specifying the handoff format between each.' },
    { id: 'ts-4', title: 'Make vs Buy', difficulty: 'Medium', description: 'Evaluate whether to build a custom Claude workflow or use an off-the-shelf AI tool for a specific business problem.' },
  ],
  'failure-diagnosis': [
    { id: 'fd-1', title: 'Error Classification', difficulty: 'Easy', description: 'Categorize 5 AI failures from your recent sessions by root cause type.' },
    { id: 'fd-2', title: 'Root Cause Analysis', difficulty: 'Medium', description: 'Take a poor AI output and trace the failure back to its precise point of origin in your input.' },
    { id: 'fd-3', title: 'Recovery Design', difficulty: 'Hard', description: 'Design a systematic recovery protocol for a common failure pattern you encounter repeatedly.' },
    { id: 'fd-4', title: 'Diagnosis Speed', difficulty: 'Medium', description: 'Practice diagnosing and correcting a bad output in under 2 minutes without starting over.' },
  ],
  'multi-agent-orchestration': [
    { id: 'ma-1', title: 'State Threading', difficulty: 'Easy', description: 'Design a state object that maintains coherence across 3 sequential agent calls.' },
    { id: 'ma-2', title: 'Parallel Routing', difficulty: 'Medium', description: 'Identify which sub-tasks in a complex project can be parallelized across agents and define the merge logic.' },
    { id: 'ma-3', title: 'Escalation Handling', difficulty: 'Hard', description: 'Define escalation criteria and human-in-the-loop checkpoints for an automated pipeline.' },
    { id: 'ma-4', title: 'Session Persistence', difficulty: 'Medium', description: 'Design a memory architecture that allows an agent to pick up a task after interruption.' },
  ],
  'business-value-translation': [
    { id: 'bv-1', title: 'Value Framing', difficulty: 'Easy', description: 'Translate a technical AI capability into a board-ready business case in under 200 words.' },
    { id: 'bv-2', title: 'ROI Modeling', difficulty: 'Medium', description: 'Build a simple model estimating the business value of automating a specific workflow with AI.' },
    { id: 'bv-3', title: 'Stakeholder Translation', difficulty: 'Hard', description: 'Adapt the same AI capability message for three different stakeholder audiences (CEO, CFO, operational lead).' },
    { id: 'bv-4', title: 'Risk Framing', difficulty: 'Medium', description: 'Present AI adoption risks in a way that builds executive confidence rather than resistance.' },
  ],
}

// ---------------------------------------------------------------------------
// Type guards for the generate response
// ---------------------------------------------------------------------------

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

function isGenerateResponse(
  value: unknown,
): value is { exercises: QuickExerciseData[] } {
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
    // fall through to the generic message
  }
  return `Request failed (HTTP ${response.status})`
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

type TrainMode = 'quick' | 'full'

export default function Train(): JSX.Element {
  const { state, refetch } = useApp()
  const [mode, setMode] = useState<TrainMode>('quick')
  const [selectedDomainId, setSelectedDomainId] = useState<string | null>(null)

  const gradedDomains = state?.domains.filter((d) => d.graded) ?? []
  const domainId = selectedDomainId ?? gradedDomains[0]?.id ?? null
  const selectedDomain = gradedDomains.find((d) => d.id === domainId) ?? null

  // Quick mode state
  const [exercises, setExercises] = useState<QuickExerciseData[] | null>(null)
  const [genLoading, setGenLoading] = useState(false)
  const [genError, setGenError] = useState<string | null>(null)
  const [genCount, setGenCount] = useState(0)

  useEffect(() => {
    if (mode !== 'quick' || domainId === null) return
    // Skip when we already hold exercises for this domain (e.g. after a
    // Quick -> Full -> Quick toggle). Regeneration clears them first.
    if (exercises !== null && exercises.every((e) => e.domainId === domainId)) {
      return
    }
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
        if (!response.ok) {
          throw new Error(await errorMessageFrom(response))
        }
        const data: unknown = await response.json()
        if (!isGenerateResponse(data)) {
          throw new Error('Server returned exercises in an unexpected shape')
        }
        if (!cancelled) setExercises(data.exercises)
      } catch (err) {
        if (!cancelled) {
          setGenError(
            err instanceof Error ? err.message : 'Failed to generate exercises',
          )
        }
      } finally {
        if (!cancelled) setGenLoading(false)
      }
    }

    void generate()
    return () => {
      cancelled = true
    }
  }, [mode, domainId, genCount])

  const regenerate = useCallback(() => {
    setExercises(null)
    setGenCount((count) => count + 1)
  }, [])

  const handleQuickSubmit = useCallback(
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
      if (!response.ok) {
        throw new Error(await errorMessageFrom(response))
      }
      refetch()
    },
    [refetch],
  )

  const handleFullSubmit = useCallback(
    async (
      exerciseId: string,
      targetDomainId: string,
      reflection: string,
      selfRating: number,
      gradeEstimate: string | null,
    ): Promise<void> => {
      const response = await fetch('/api/exercises/full/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          exerciseId,
          domainId: targetDomainId,
          reflection,
          selfRating,
          ...(gradeEstimate !== null ? { gradeEstimate } : {}),
        }),
      })
      if (!response.ok) {
        throw new Error(await errorMessageFrom(response))
      }
      refetch()
    },
    [refetch],
  )

  if (state === null || domainId === null) {
    return (
      <div className="space-y-4 p-4 sm:p-8" aria-label="Loading training">
        <div className="h-8 w-48 animate-pulse rounded bg-gray-200" />
        <div className="h-10 animate-pulse rounded bg-gray-200" />
        <div className="h-40 animate-pulse rounded bg-gray-200" />
      </div>
    )
  }

  const fullExercises = FULL_EXERCISES[domainId] ?? []

  return (
    <div className="space-y-6 p-4 sm:p-8">
      {/* Mode toggle */}
      <div className="flex gap-2" role="tablist" aria-label="Training mode">
        {(
          [
            { key: 'quick', label: '⚡ Quick' },
            { key: 'full', label: '◎ Full' },
          ] as Array<{ key: TrainMode; label: string }>
        ).map((tab) => (
          <button
            key={tab.key}
            type="button"
            role="tab"
            aria-selected={mode === tab.key}
            onClick={() => setMode(tab.key)}
            className={`rounded px-3 py-2 text-sm font-medium ${
              mode === tab.key
                ? 'bg-amber-100 text-amber-900'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Domain pills */}
      <div className="flex gap-2 overflow-x-auto pb-1" aria-label="Domains">
        {gradedDomains.map((domain) => (
          <button
            key={domain.id}
            type="button"
            onClick={() => setSelectedDomainId(domain.id)}
            className={`shrink-0 rounded-full border px-3 py-1 text-sm ${
              domain.id === domainId
                ? 'border-amber-500 bg-amber-50 text-amber-900'
                : 'border-gray-200 bg-white text-gray-600 hover:bg-gray-50'
            }`}
          >
            {domain.name}
          </button>
        ))}
      </div>

      {/* Domain description */}
      {selectedDomain !== null && (
        <p className="text-sm text-gray-500">{selectedDomain.description}</p>
      )}

      {mode === 'quick' && (
        <section aria-label="Quick exercises" className="space-y-4">
          {genLoading && (
            <div className="space-y-4">
              <div className="h-40 animate-pulse rounded-lg bg-gray-200" />
              <div className="h-40 animate-pulse rounded-lg bg-gray-200" />
            </div>
          )}
          {genError !== null && !genLoading && (
            <div className="rounded border border-red-200 bg-red-50 p-3">
              <p className="text-sm text-red-700">{genError}</p>
              <button
                type="button"
                onClick={regenerate}
                className="mt-2 rounded border border-red-300 px-3 py-1 text-sm text-red-700 hover:bg-red-100"
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
                  onSubmit={(score) => handleQuickSubmit(exercise, score)}
                />
              ))}
              <button
                type="button"
                onClick={regenerate}
                className="rounded border border-gray-300 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
              >
                New exercises ↺
              </button>
            </>
          )}
        </section>
      )}

      {mode === 'full' && (
        <section aria-label="Full exercises" className="space-y-4">
          {fullExercises.length === 0 ? (
            <p className="text-sm text-gray-500">
              No reflection exercises for this domain yet.
            </p>
          ) : (
            fullExercises.map((exercise) => (
              <FullExerciseCard
                key={`${domainId}-${exercise.id}`}
                exercise={exercise}
                onSubmit={(reflection, selfRating, gradeEstimate) =>
                  handleFullSubmit(
                    exercise.id,
                    domainId,
                    reflection,
                    selfRating,
                    gradeEstimate,
                  )
                }
              />
            ))
          )}
        </section>
      )}
    </div>
  )
}
