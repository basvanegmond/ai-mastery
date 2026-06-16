import { useState } from 'react'
import type { DomainKey, GradeLabel, ExerciseEntry } from '../../types'
import { useMasteryStore } from '../../store/masteryStore'
import { DOMAIN_MAP } from '../../lib/domains'

interface StaticExercise {
  id: string
  domain: DomainKey
  difficulty: 'Easy' | 'Medium' | 'Hard'
  task: string
  context: string
}

const FULL_EXERCISES: StaticExercise[] = [
  // Prompt Construction
  { id: 'pc-1', domain: 'prompt_construction', difficulty: 'Easy', task: 'Rewrite a vague 10-word prompt you used this week into a precise 50-word version with scope, constraints, and expected output format.', context: 'Use a real prompt from your recent Claude conversations.' },
  { id: 'pc-2', domain: 'prompt_construction', difficulty: 'Medium', task: 'Design a system prompt for a quarterly strategy review AI assistant. Include role, scope, tone, and 3 explicit constraints.', context: 'Target audience: a C-suite executive team.' },
  { id: 'pc-3', domain: 'prompt_construction', difficulty: 'Medium', task: 'Create a prompt that forces the model to present balanced trade-offs on an AI investment decision, not just advocate one position.', context: 'The business context: a €2M AI implementation budget.' },
  { id: 'pc-4', domain: 'prompt_construction', difficulty: 'Hard', task: 'Build a multi-turn prompt sequence for a negotiation coaching session: 3 prompts that build context cumulatively and avoid contradicting earlier outputs.', context: 'Domain: supplier contract renegotiation in commodities.' },
  // Output Evaluation
  { id: 'oe-1', domain: 'output_evaluation', difficulty: 'Easy', task: 'Take a Claude response you accepted this week without questioning. Write 3 specific assumptions it makes that you should have challenged.', context: 'Be specific — name the claim and the missing evidence.' },
  { id: 'oe-2', domain: 'output_evaluation', difficulty: 'Medium', task: 'Ask Claude to write a business case for a fictional initiative. Then write a rebuttal that identifies 3 logical gaps or unsupported claims in the output.', context: 'Topic: implementing AI-driven demand forecasting.' },
  { id: 'oe-3', domain: 'output_evaluation', difficulty: 'Medium', task: 'Compare two Claude outputs on the same prompt (use "compare to this" in a follow-up). Document which is better and explicitly why.', context: 'Use a topic relevant to your current work.' },
  { id: 'oe-4', domain: 'output_evaluation', difficulty: 'Hard', task: 'Construct a scoring rubric (5 criteria, 1-5 scale) for evaluating AI-generated strategic recommendations. Apply it to 3 outputs and identify where scores differ most.', context: 'Test across Claude, ChatGPT, or Gemini for comparison.' },
  // Agentic Architecture
  { id: 'aa-1', domain: 'agentic_architecture', difficulty: 'Easy', task: 'Draw (or describe in text) a single-agent workflow for your most repetitive AI task. Label: inputs, tools available, decision points, outputs.', context: 'Use Claude Code or canvas if available.' },
  { id: 'aa-2', domain: 'agentic_architecture', difficulty: 'Medium', task: 'Design a 3-agent system for a market intelligence use case: define the orchestrator, two sub-agents, what each receives, and what each returns.', context: 'Think about what could run in parallel vs must run sequentially.' },
  { id: 'aa-3', domain: 'agentic_architecture', difficulty: 'Medium', task: 'Map 5 failure modes for an agentic workflow you would build. For each: what causes it, how you detect it, how you recover.', context: 'This is a diagnosis-first exercise — start with failure, not success.' },
  { id: 'aa-4', domain: 'agentic_architecture', difficulty: 'Hard', task: 'Spec a full agentic architecture for a competitive intelligence pipeline: sources, agents, tool calls, output schema, human review gates. One page max.', context: 'Format it as a spec document a developer could build from.' },
  // Tool Selection
  { id: 'ts-1', domain: 'tool_selection', difficulty: 'Easy', task: 'List the 5 AI tools you used last week. For each, write one sentence: "I used X for Y because Z was better than the alternative."', context: 'Be specific about the "why" — not just the task.' },
  { id: 'ts-2', domain: 'tool_selection', difficulty: 'Medium', task: 'Write a personal decision matrix for choosing between Claude, Claude Code, and a code interpreter. Include 5 decision criteria with weights.', context: 'Test it against 3 real tasks you have done recently.' },
  { id: 'ts-3', domain: 'tool_selection', difficulty: 'Hard', task: 'Identify the last time you used the wrong AI tool for a task. Write a post-mortem: what you used, what you should have used, what signal you missed.', context: 'Honest reflection only — no right answers here.' },
  // Failure Diagnosis
  { id: 'fd-1', domain: 'failure_diagnosis', difficulty: 'Easy', task: 'Find a Claude response that disappointed you. Diagnose: was the failure in the prompt, the model, or your evaluation of the output? Be specific.', context: 'Write it as a 3-bullet diagnosis.' },
  { id: 'fd-2', domain: 'failure_diagnosis', difficulty: 'Medium', task: 'Describe an AI output failure you experienced in under 200 words, without blaming "the AI." Attribute the failure to a specific, correctable cause.', context: 'Practice not outsourcing diagnosis to "hallucination" as a catch-all.' },
  { id: 'fd-3', domain: 'failure_diagnosis', difficulty: 'Hard', task: 'Build a failure taxonomy for AI-assisted strategic work: 5 distinct failure types, what they look like in practice, and the prevention mechanism for each.', context: 'This becomes a reusable reference — write it that way.' },
  // Multi-Agent Orchestration
  { id: 'mo-1', domain: 'multi_agent_orchestration', difficulty: 'Easy', task: 'Define in plain language: what is state in a multi-agent system, and why does losing it cause failures? Give one concrete example.', context: 'Write for someone who understands business but not engineering.' },
  { id: 'mo-2', domain: 'multi_agent_orchestration', difficulty: 'Medium', task: 'Design a handoff protocol between two agents in a document review pipeline. Specify: what is passed, what format, what happens if it fails.', context: 'Focus on the interface contract, not the implementation.' },
  { id: 'mo-3', domain: 'multi_agent_orchestration', difficulty: 'Medium', task: 'Describe a real-world business process that would benefit from multi-agent orchestration. Map current state → desired agentic state in a before/after format.', context: 'Use an industry you work in or know well.' },
  { id: 'mo-4', domain: 'multi_agent_orchestration', difficulty: 'Hard', task: 'Write the escalation logic for an agentic customer feedback processing system: when does the orchestrator stop, route to human, or flag for review?', context: 'Think edge cases: ambiguous sentiment, regulatory terms, high-value signals.' },
  // Business Value Translation
  { id: 'bv-1', domain: 'business_value_translation', difficulty: 'Easy', task: 'Take one AI capability you used this week and write the €-value business case in 3 bullets. Be specific: time saved × rate, or revenue impact, or risk reduction quantified.', context: 'No ranges — commit to a number with reasoning.' },
  { id: 'bv-2', domain: 'business_value_translation', difficulty: 'Medium', task: 'Write a 1-slide summary of an AI initiative for a board audience: problem, solution, value (quantified), risk, ask. Under 120 words.', context: 'Use real data or realistic estimates — not "significant potential."' },
  { id: 'bv-3', domain: 'business_value_translation', difficulty: 'Medium', task: 'Identify an AI capability your organisation has NOT adopted. Write the internal objection you would most need to overcome and your counter-argument.', context: 'Common objections: data quality, cost, regulation, change management.' },
  { id: 'bv-4', domain: 'business_value_translation', difficulty: 'Hard', task: 'Write a 3-year AI value roadmap for a function you know well. Phase 1: efficiency gains. Phase 2: decision support. Phase 3: autonomous operations. Quantify each phase.', context: 'Format it as something a CFO could challenge. It should be challengeable.' },
]

const GRADES: GradeLabel[] = ['D', 'C', 'B', 'A', 'A+']

interface FullExerciseProps {
  domain: DomainKey
}

export function FullExercise({ domain }: FullExerciseProps) {
  const addExerciseEntry = useMasteryStore((s) => s.addExerciseEntry)
  const history = useMasteryStore((s) => s.exerciseHistory)

  const [activeId, setActiveId] = useState<string | null>(null)
  const [reflection, setReflection] = useState('')
  const [stars, setStars] = useState(0)
  const [grade, setGrade] = useState<GradeLabel | null>(null)
  const [submitted, setSubmitted] = useState(false)
  const [submittedStars, setSubmittedStars] = useState(0)
  const [submittedGrade, setSubmittedGrade] = useState<GradeLabel | null>(null)

  const exercises = FULL_EXERCISES.filter((e) => e.domain === domain)
  const completedIds = new Set(
    history.filter((h) => h.type === 'reflection').map((h) => h.promptSnapshot)
  )

  function handleSelect(id: string) {
    setActiveId(id)
    setReflection('')
    setStars(0)
    setGrade(null)
    setSubmitted(false)
    setSubmittedStars(0)
    setSubmittedGrade(null)
  }

  function handleNextExercise() {
    const currentIndex = exercises.findIndex((e) => e.id === activeId)
    const next = exercises.slice(currentIndex + 1).find((e) => !completedIds.has(e.id))
    if (next) {
      handleSelect(next.id)
    } else {
      setActiveId(null)
    }
  }

  async function handleSubmit() {
    if (!activeId || stars === 0) return

    const entry: ExerciseEntry = {
      id: crypto.randomUUID(),
      domain,
      type: 'reflection',
      exerciseHash: activeId,
      promptSnapshot: activeId,
      userAnswer: reflection,
      correctAnswer: null,
      score: stars / 5,
      starRating: stars,
      gradeEstimate: grade ?? undefined,
      reflection,
      weaknessTagsAddressed: [],
      createdAt: new Date().toISOString(),
    }

    addExerciseEntry(entry)
    setSubmittedStars(stars)
    setSubmittedGrade(grade)
    setSubmitted(true)
  }

  const domainDef = DOMAIN_MAP[domain]
  const difficultyColor = { Easy: 'var(--success)', Medium: 'var(--gold)', Hard: 'var(--danger)' }
  const remaining = exercises.filter((e) => !completedIds.has(e.id) && e.id !== activeId).length

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        {exercises.map((ex) => {
          const done = completedIds.has(ex.id)
          const active = activeId === ex.id

          return (
            <div key={ex.id}>
              <button
                onClick={() => handleSelect(ex.id)}
                className="w-full text-left px-4 py-3 rounded-xl text-sm transition-neo"
                style={{
                  boxShadow: active ? 'var(--neo-inset)' : 'var(--neo-raised)',
                  background: 'var(--surface)',
                  color: 'var(--text-secondary)',
                  fontFamily: 'DM Mono, monospace',
                  borderLeft: `3px solid ${done ? 'var(--success)' : domainDef.color}`,
                }}
              >
                <div className="flex items-start justify-between gap-2">
                  <span style={{ color: done ? 'var(--text-muted)' : 'var(--text-primary)' }}>{ex.task}</span>
                  <div className="flex items-center gap-2 shrink-0">
                    {done && <span style={{ color: 'var(--success)', fontSize: '12px' }}>✓</span>}
                    <span
                      className="text-xs px-2 py-0.5 rounded"
                      style={{
                        background: `${difficultyColor[ex.difficulty]}22`,
                        color: difficultyColor[ex.difficulty],
                      }}
                    >
                      {ex.difficulty}
                    </span>
                    <span style={{ color: 'var(--text-muted)', fontSize: '11px' }}>{active ? '▾' : '▸'}</span>
                  </div>
                </div>
              </button>

              {/* Expanded entry form */}
              {active && (
                <div
                  className="rounded-b-xl p-4 space-y-3 mt-0.5"
                  style={{ background: 'var(--bg2)', boxShadow: 'var(--neo-inset)' }}
                >
                  <p className="text-xs" style={{ color: 'var(--text-muted)', fontFamily: 'DM Mono, monospace' }}>
                    {ex.context}
                  </p>

                  {submitted ? (
                    /* Success state */
                    <div
                      className="rounded-xl p-4 space-y-3"
                      style={{ background: 'var(--surface)', boxShadow: 'var(--neo-raised)' }}
                    >
                      <div className="flex items-center gap-2">
                        <span style={{ color: 'var(--success)', fontSize: '18px' }}>✓</span>
                        <span className="text-sm font-medium" style={{ color: 'var(--text-primary)', fontFamily: 'DM Mono, monospace' }}>
                          Logged
                        </span>
                        <span style={{ color: 'var(--gold)', fontFamily: 'DM Mono, monospace', fontSize: '13px' }}>
                          {'★'.repeat(submittedStars)}
                        </span>
                        {submittedGrade && (
                          <span
                            className="text-xs px-2 py-0.5 rounded ml-1"
                            style={{ background: 'var(--gold-dim)', color: 'var(--gold)', fontFamily: 'DM Mono, monospace' }}
                          >
                            {submittedGrade}
                          </span>
                        )}
                      </div>
                      <div className="flex gap-2">
                        {remaining > 0 && (
                          <button
                            onClick={handleNextExercise}
                            className="flex-1 py-2 rounded-lg text-sm transition-neo"
                            style={{
                              boxShadow: 'var(--neo-raised)',
                              background: 'var(--surface)',
                              color: 'var(--gold)',
                              fontFamily: 'DM Mono, monospace',
                            }}
                          >
                            Next exercise → ({remaining} left)
                          </button>
                        )}
                        <button
                          onClick={() => setActiveId(null)}
                          className="py-2 px-4 rounded-lg text-sm transition-neo"
                          style={{
                            boxShadow: 'var(--neo-raised)',
                            background: 'var(--surface)',
                            color: 'var(--text-muted)',
                            fontFamily: 'DM Mono, monospace',
                          }}
                        >
                          Back to list
                        </button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <textarea
                        value={reflection}
                        onChange={(e) => setReflection(e.target.value)}
                        placeholder="What did you do, what did you observe, what did you learn?"
                        rows={4}
                        className="w-full rounded-lg p-3 text-sm resize-none outline-none"
                        style={{
                          background: 'var(--bg)',
                          boxShadow: 'var(--neo-inset)',
                          color: 'var(--text-primary)',
                          fontFamily: 'DM Mono, monospace',
                          border: 'none',
                        }}
                      />

                      <div className="flex items-center gap-4 flex-wrap">
                        {/* Star rating */}
                        <div className="flex gap-1">
                          {[1, 2, 3, 4, 5].map((s) => (
                            <button
                              key={s}
                              onClick={() => setStars(s)}
                              className="text-lg transition-neo"
                              style={{ color: s <= stars ? 'var(--gold)' : 'var(--text-muted)' }}
                            >
                              ★
                            </button>
                          ))}
                        </div>

                        {/* Grade estimate */}
                        <div className="flex gap-1">
                          {GRADES.map((g) => (
                            <button
                              key={g}
                              onClick={() => setGrade(g === grade ? null : g)}
                              className="text-xs px-2 py-1 rounded transition-neo"
                              style={{
                                boxShadow: grade === g ? 'var(--neo-inset)' : 'var(--neo-raised)',
                                background: 'var(--surface)',
                                color: grade === g ? 'var(--gold)' : 'var(--text-muted)',
                                fontFamily: 'DM Mono, monospace',
                              }}
                            >
                              {g}
                            </button>
                          ))}
                        </div>
                      </div>

                      <button
                        onClick={handleSubmit}
                        disabled={stars === 0}
                        className="w-full py-2 rounded-lg text-sm transition-neo"
                        style={{
                          boxShadow: stars > 0 ? 'var(--neo-raised)' : 'none',
                          background: stars > 0 ? 'var(--surface)' : 'transparent',
                          color: stars > 0 ? 'var(--text-primary)' : 'var(--text-muted)',
                          fontFamily: 'DM Mono, monospace',
                          border: stars === 0 ? '1px dashed var(--text-muted)' : 'none',
                          cursor: stars > 0 ? 'pointer' : 'default',
                        }}
                      >
                        {stars === 0 ? 'rate to log →' : 'log entry'}
                      </button>
                    </>
                  )}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
