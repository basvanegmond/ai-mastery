import { useCallback, useState } from 'react'
import { FullExerciseCard } from '../components/FullExerciseCard'
import type { FullExercise } from '../components/FullExerciseCard'
import { useApp } from '../contexts/AppContext'
import { getDomainColor } from '../utils/domains'

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

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
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
      {[0, 1, 2].map((i) => (
        <div key={i} className="h-36 animate-pulse rounded-xl bg-canvas" />
      ))}
    </div>
  )
}

export default function Full(): JSX.Element {
  const { state, refetch } = useApp()
  const [selectedDomainId, setSelectedDomainId] = useState<string | null>(null)

  const gradedDomains = state?.domains.filter((d) => d.graded) ?? []
  const domainId = selectedDomainId ?? gradedDomains[0]?.id ?? null
  const selectedDomain = gradedDomains.find((d) => d.id === domainId) ?? null

  const handleSubmit = useCallback(
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

  const exercises = domainId !== null ? (FULL_EXERCISES[domainId] ?? []) : []

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div>
        <h1 className="font-serif text-2xl text-ink">Full Reflections</h1>
        <p className="mt-1 text-sm text-ink-sub">
          Deep-practice exercises with written reflection and self-rating.
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
              onClick={() => setSelectedDomainId(domain.id)}
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

      {/* Exercise list */}
      <section aria-label="Full exercises" className="space-y-4">
        {exercises.length === 0 ? (
          <p className="text-sm text-ink-sub">
            No reflection exercises for this domain yet.
          </p>
        ) : (
          exercises.map((exercise) => (
            <FullExerciseCard
              key={`${domainId ?? ''}-${exercise.id}`}
              exercise={exercise}
              onSubmit={(reflection, selfRating, gradeEstimate) =>
                handleSubmit(
                  exercise.id,
                  domainId ?? '',
                  reflection,
                  selfRating,
                  gradeEstimate,
                )
              }
            />
          ))
        )}
      </section>
    </div>
  )
}
