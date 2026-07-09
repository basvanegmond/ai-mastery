// functions/api/baseline/submit.ts
// POST /api/baseline/submit — persist intake assessment results as a new
// baselineHistory entry per domain in users/<user>/domains.json.

import { readFile, writeFile, userPath } from '../../_shared/github'
import type { Env as GitHubEnv } from '../../_shared/github'
import { jsonResponse } from '../../_shared/types'
import type { PagesFunction } from '../../_shared/types'

type Env = GitHubEnv

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface BaselineEntry {
  score: number
  timestamp: string
  source: string
}

interface Domain {
  id: string
  name: string
  description: string
  target: number | null
  graded: boolean
  baselineHistory: BaselineEntry[]
}

interface SubmitRequest {
  scores: Record<string, number>
}

// ---------------------------------------------------------------------------
// Guards + parsing
// ---------------------------------------------------------------------------

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function isBaselineEntry(value: unknown): value is BaselineEntry {
  return (
    isRecord(value) &&
    typeof value.score === 'number' &&
    typeof value.timestamp === 'string' &&
    typeof value.source === 'string'
  )
}

function isDomain(value: unknown): value is Domain {
  return (
    isRecord(value) &&
    typeof value.id === 'string' &&
    typeof value.name === 'string' &&
    typeof value.description === 'string' &&
    (typeof value.target === 'number' || value.target === null) &&
    typeof value.graded === 'boolean' &&
    Array.isArray(value.baselineHistory) &&
    value.baselineHistory.every(isBaselineEntry)
  )
}

function parseSubmitRequest(value: unknown): SubmitRequest | null {
  if (!isRecord(value) || !isRecord(value.scores)) return null
  const entries = Object.entries(value.scores)
  if (entries.length === 0) return null
  for (const [, score] of entries) {
    if (typeof score !== 'number' || !Number.isFinite(score) || score < 1 || score > 5) {
      return null
    }
  }
  return { scores: value.scores as Record<string, number> }
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
      { error: 'Request body must include "scores": a non-empty map of domainId to a number 1-5' },
      400,
    )
  }

  try {
    const path = userPath(env, 'domains.json')
    const existing = await readFile(env, path)
    if (existing === null) {
      return jsonResponse({ error: 'domains.json not found — seed data before submitting a baseline' }, 500)
    }

    let domains: unknown[]
    try {
      const content: unknown = JSON.parse(existing.content)
      if (!Array.isArray(content)) throw new Error('not an array')
      domains = content
    } catch {
      return jsonResponse({ error: 'domains.json is corrupt' }, 500)
    }

    const timestamp = new Date().toISOString()
    const updated: Domain[] = domains.map((raw) => {
      if (!isDomain(raw)) return raw as Domain
      const score = parsed.scores[raw.id]
      if (score === undefined) return raw
      return {
        ...raw,
        baselineHistory: [
          ...raw.baselineHistory,
          { score, timestamp, source: 'baseline-assessment' },
        ],
      }
    })

    await writeFile(
      env,
      path,
      JSON.stringify(updated, null, 2),
      'baseline: intake assessment results',
      existing.sha,
      true,
    )

    return jsonResponse({ ok: true })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    return jsonResponse({ error: `Failed to record baseline: ${message}` }, 500)
  }
}
