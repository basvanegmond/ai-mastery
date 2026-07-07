// functions/api/exercises/full/submit.ts
// POST /api/exercises/full/submit — record a completed full exercise
// (reflection + self-rating) in users/<user>/exercise-log.json.

import { isAuthenticated, unauthorizedResponse } from '../../../_shared/auth'
import type { Env as AuthEnv } from '../../../_shared/auth'
import { readFile, writeFile, userPath } from '../../../_shared/github'
import type { Env as GitHubEnv } from '../../../_shared/github'
import { jsonResponse } from '../../../_shared/types'
import type { PagesFunction } from '../../../_shared/types'
import type { EvidenceWeight } from '../../../../src/types'

type Env = GitHubEnv & AuthEnv

// ---------------------------------------------------------------------------
// Types + constants
// ---------------------------------------------------------------------------

interface ExerciseEntry {
  id: string
  domainId: string
  mode: 'quick' | 'full'
  score?: number
  selfRating?: number
  evidenceWeight: EvidenceWeight
  timestamp: string
}

const GRADE_TO_SCORE: Record<string, number> = {
  D: 1.0,
  C: 2.0,
  B: 3.0,
  A: 4.0,
  'A+': 4.3,
}

interface FullSubmitRequest {
  exerciseId: string
  domainId: string
  reflection: string
  selfRating: number // 1-5
  gradeEstimate?: string // 'D' | 'C' | 'B' | 'A' | 'A+'
}

// ---------------------------------------------------------------------------
// Request parsing
// ---------------------------------------------------------------------------

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function parseSubmitRequest(value: unknown): FullSubmitRequest | null {
  if (
    !isRecord(value) ||
    typeof value.exerciseId !== 'string' ||
    value.exerciseId.length === 0 ||
    typeof value.domainId !== 'string' ||
    value.domainId.length === 0 ||
    typeof value.reflection !== 'string' ||
    value.reflection.trim().length === 0 ||
    typeof value.selfRating !== 'number' ||
    !Number.isFinite(value.selfRating) ||
    value.selfRating < 1 ||
    value.selfRating > 5
  ) {
    return null
  }

  if (value.gradeEstimate !== undefined) {
    if (typeof value.gradeEstimate !== 'string' || !(value.gradeEstimate in GRADE_TO_SCORE)) {
      return null
    }
  }

  return {
    exerciseId: value.exerciseId,
    domainId: value.domainId,
    reflection: value.reflection,
    selfRating: value.selfRating,
    ...(value.gradeEstimate !== undefined ? { gradeEstimate: value.gradeEstimate } : {}),
  }
}

// ---------------------------------------------------------------------------
// Handler
// ---------------------------------------------------------------------------

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  if (!(await isAuthenticated(request, env))) {
    return unauthorizedResponse()
  }

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return jsonResponse({ error: 'Invalid JSON body' }, 400)
  }

  const parsed = parseSubmitRequest(body)
  if (parsed === null) {
    return jsonResponse(
      {
        error:
          'Request body must include "exerciseId" (string), "domainId" (string), "reflection" (non-empty string), "selfRating" (number 1-5), and optionally "gradeEstimate" (D, C, B, A, or A+)',
      },
      400,
    )
  }

  const newEntry: ExerciseEntry = {
    id: parsed.exerciseId,
    domainId: parsed.domainId,
    mode: 'full',
    ...(parsed.gradeEstimate !== undefined
      ? { score: GRADE_TO_SCORE[parsed.gradeEstimate] }
      : {}),
    selfRating: parsed.selfRating,
    evidenceWeight: 'full-self-rated',
    timestamp: new Date().toISOString(),
  }

  try {
    const logPath = userPath(env, 'exercise-log.json')
    const existing = await readFile(env, logPath)

    // Preserve existing entries verbatim; fall back to [] on missing/corrupt.
    let log: unknown[] = []
    if (existing !== null) {
      try {
        const content: unknown = JSON.parse(existing.content)
        if (Array.isArray(content)) {
          log = content
        }
      } catch {
        // Corrupt file — start fresh rather than fail the submission.
      }
    }

    log.push(newEntry)

    await writeFile(
      env,
      logPath,
      JSON.stringify(log, null, 2),
      `log: full exercise ${newEntry.id}`,
      existing?.sha,
      true,
    )

    return jsonResponse({ ok: true, newEntry })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    return jsonResponse({ error: `Failed to record exercise: ${message}` }, 500)
  }
}
