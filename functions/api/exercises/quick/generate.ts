// functions/api/exercises/quick/generate.ts
// POST /api/exercises/quick/generate — generate 2 fresh quick exercises
// for a domain using the fast model with structured output.

import { callStructured, MODEL_FAST } from '../../../_shared/anthropic'
import type { Env as AnthropicEnv } from '../../../_shared/anthropic'
import { jsonResponse } from '../../../_shared/types'
import type { PagesFunction } from '../../../_shared/types'

type Env = AnthropicEnv

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type ExerciseType = 'choice' | 'sort' | 'rank'

interface ExerciseOption {
  id: string
  text: string
  correct?: boolean // for 'choice' type
  category?: string // for 'sort' type
  rank?: number // for 'rank' type (correct position)
}

interface QuickExercise {
  id: string
  type: ExerciseType
  domainId: string
  question: string
  options: ExerciseOption[]
  explanation?: string // shown after reveal for sort/rank types
}

// Model output before we assign ids and the domain.
interface GeneratedExercise {
  type: ExerciseType
  question: string
  options: ExerciseOption[]
  explanation?: string
}

interface GeneratedPayload {
  exercises: GeneratedExercise[]
}

// ---------------------------------------------------------------------------
// Type guards
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

function isGeneratedExercise(value: unknown): value is GeneratedExercise {
  return (
    isRecord(value) &&
    (value.type === 'choice' || value.type === 'sort' || value.type === 'rank') &&
    typeof value.question === 'string' &&
    (value.explanation === undefined || typeof value.explanation === 'string') &&
    Array.isArray(value.options) &&
    value.options.length > 0 &&
    value.options.every(isExerciseOption)
  )
}

function isGeneratedPayload(value: unknown): value is GeneratedPayload {
  return (
    isRecord(value) &&
    Array.isArray(value.exercises) &&
    value.exercises.length >= 1 &&
    value.exercises.every(isGeneratedExercise)
  )
}

// ---------------------------------------------------------------------------
// Generation schema + prompt
// ---------------------------------------------------------------------------

const OUTPUT_SCHEMA: Record<string, unknown> = {
  type: 'object',
  required: ['exercises'],
  properties: {
    exercises: {
      type: 'array',
      minItems: 2,
      maxItems: 2,
      items: {
        type: 'object',
        required: ['type', 'question', 'options'],
        properties: {
          type: { enum: ['choice', 'sort', 'rank'] },
          question: { type: 'string' },
          explanation: { type: 'string' },
          options: {
            type: 'array',
            items: {
              type: 'object',
              required: ['id', 'text'],
              properties: {
                id: { type: 'string' },
                text: { type: 'string' },
                correct: { type: 'boolean' },
                category: { type: 'string' },
                rank: { type: 'integer' },
              },
            },
          },
        },
      },
    },
  },
}

function buildSystemPrompt(domainId: string): string {
  return `You are generating practice exercises for a senior business professional developing AI mastery.
The exercises test the "${domainId}" competency domain.
Context: This person operates at executive level, works with AI tools to direct and orchestrate,
NOT to write or debug code. Scenarios should reflect realistic business contexts:
strategic decisions, organizational challenges, AI tool selection and orchestration.
Never require coding knowledge or terminal usage.

Generate exactly 2 exercises. Mix exercise types (choice, sort, rank) for variety.
For choice: provide 4 options with exactly one correct.
For sort: provide 4-6 items to categorize.
For rank: provide 3-5 items to order by priority/effectiveness.
Include post-reveal explanation for sort and rank types.
Use varied, realistic business scenarios — never generic placeholders.`
}

// ---------------------------------------------------------------------------
// Request parsing
// ---------------------------------------------------------------------------

interface GenerateRequest {
  domainId: string
}

function parseGenerateRequest(value: unknown): GenerateRequest | null {
  if (!isRecord(value) || typeof value.domainId !== 'string' || value.domainId.length === 0) {
    return null
  }
  return { domainId: value.domainId }
}

// ---------------------------------------------------------------------------
// Handler
// ---------------------------------------------------------------------------

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  let body: unknown
  try {
    body = await request.json()
  } catch {
    return jsonResponse({ error: 'Invalid JSON body' }, 400)
  }

  const parsed = parseGenerateRequest(body)
  if (parsed === null) {
    return jsonResponse({ error: 'Request body must include a non-empty "domainId" string' }, 400)
  }

  try {
    const payload = await callStructured<unknown>(
      env,
      MODEL_FAST,
      [
        {
          role: 'user',
          content: `Generate 2 fresh quick exercises for the "${parsed.domainId}" domain now.`,
        },
      ],
      buildSystemPrompt(parsed.domainId),
      OUTPUT_SCHEMA,
      'generate_exercises',
    )

    if (!isGeneratedPayload(payload)) {
      throw new Error('Model returned exercises in an unexpected shape')
    }

    const exercises: QuickExercise[] = payload.exercises.map((exercise) => ({
      id: crypto.randomUUID(),
      type: exercise.type,
      domainId: parsed.domainId,
      question: exercise.question,
      options: exercise.options,
      ...(exercise.explanation !== undefined ? { explanation: exercise.explanation } : {}),
    }))

    return jsonResponse({ exercises })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    return jsonResponse(
      { error: 'Exercise generation temporarily unavailable', details: message },
      503,
    )
  }
}
