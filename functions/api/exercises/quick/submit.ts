// functions/api/exercises/quick/submit.ts
// POST /api/exercises/quick/submit — record a completed quick exercise
// in users/<user>/exercise-log.json.

import { readFile, writeFile, userPath } from '../../../_shared/github'
import type { Env as GitHubEnv } from '../../../_shared/github'
import { jsonResponse } from '../../../_shared/types'
import type { PagesFunction } from '../../../_shared/types'
import type { EvidenceWeight } from '../../../../src/types'

type Env = GitHubEnv

// ---------------------------------------------------------------------------
// Types
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

interface QuickSubmitRequest {
  exerciseId: string
  domainId: string
  correct: boolean
  score: number // 0.0 to 1.0
}

// ---------------------------------------------------------------------------
// Request parsing
// ---------------------------------------------------------------------------

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function parseSubmitRequest(value: unknown): QuickSubmitRequest | null {
  if (
    !isRecord(value) ||
    typeof value.exerciseId !== 'string' ||
    value.exerciseId.length === 0 ||
    typeof value.domainId !== 'string' ||
    value.domainId.length === 0 ||
    typeof value.correct !== 'boolean' ||
    typeof value.score !== 'number' ||
    !Number.isFinite(value.score) ||
    value.score < 0 ||
    value.score > 1
  ) {
    return null
  }
  return {
    exerciseId: value.exerciseId,
    domainId: value.domainId,
    correct: value.correct,
    score: value.score,
  }
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

  const parsed = parseSubmitRequest(body)
  if (parsed === null) {
    return jsonResponse(
      {
        error:
          'Request body must include "exerciseId" (string), "domainId" (string), "correct" (boolean), and "score" (number 0-1)',
      },
      400,
    )
  }

  const newEntry: ExerciseEntry = {
    id: parsed.exerciseId,
    domainId: parsed.domainId,
    mode: 'quick',
    score: parsed.score,
    evidenceWeight: 'quick-correctness',
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
      `log: quick exercise ${newEntry.id}`,
      existing?.sha,
      true,
    )

    return jsonResponse({ ok: true, newEntry })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    return jsonResponse({ error: `Failed to record exercise: ${message}` }, 500)
  }
}
