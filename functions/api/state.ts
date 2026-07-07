// functions/api/state.ts
// GET /api/state — bulk dashboard read.
// Reads domains, exercise log, and meta from the data repo, computes the
// current radar score per domain, and returns the full AppState.

import { isAuthenticated, unauthorizedResponse } from '../_shared/auth'
import type { Env as AuthEnv } from '../_shared/auth'
import { readFile, userPath } from '../_shared/github'
import type { Env as GitHubEnv } from '../_shared/github'
import { jsonResponse } from '../_shared/types'
import type { PagesFunction } from '../_shared/types'
import type { EvidenceWeight } from '../../src/types'

type Env = GitHubEnv & AuthEnv

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
  target: number | null // null for ungraded domains (AI Frontier)
  graded: boolean
  baselineHistory: BaselineEntry[]
}

interface ExerciseEntry {
  id: string
  domainId: string
  mode: 'quick' | 'full'
  score?: number
  selfRating?: number
  evidenceWeight: EvidenceWeight
  timestamp: string
}

interface ActivityEntry {
  id: string
  domainId: string
  mode: 'quick' | 'full'
  timestamp: string
  score?: number
}

interface AppState {
  domains: Domain[]
  radarScores: Record<string, number>
  stats: {
    exercisesDone: number
    sessionsThisWeek: number
    domainsImproved: number
    averageRating: number
  }
  recentActivity: ActivityEntry[]
  meta: Record<string, unknown>
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const EVIDENCE_WEIGHTS: Record<EvidenceWeight, number> = {
  'coaching-review': 1.0, // most heavily weighted — per PRD
  'baseline-assessment': 0.8,
  'transcript-critique': 0.7,
  'full-self-rated': 0.5,
  'quick-correctness': 0.3,
  'skills-exercise': 0.4,
}

const BASELINE_BLEND = 0.3
const EVIDENCE_BLEND = 0.7
const SCORE_MIN = 1.0
const SCORE_MAX = 5.0
const RECENT_ACTIVITY_LIMIT = 10
const WEEK_MS = 7 * 24 * 60 * 60 * 1000

const DEFAULT_DOMAINS: Domain[] = [
  { id: 'prompt-construction', name: 'Prompt Construction', description: 'Front-load clarity, scope intent precisely, eliminate iterative correction loops', target: 4.0, graded: true, baselineHistory: [{ score: 3.5, timestamp: '2025-05-01T00:00:00Z', source: 'diagnostic-estimate' }] },
  { id: 'output-evaluation', name: 'Output Evaluation', description: 'Challenge AI outputs, surface assumptions, pressure-test logic', target: 4.0, graded: true, baselineHistory: [{ score: 2.5, timestamp: '2025-05-01T00:00:00Z', source: 'diagnostic-estimate' }] },
  { id: 'agentic-architecture', name: 'Agentic Architecture', description: 'Design agent systems: orchestrators, sub-agents, tool calls, failure modes', target: 4.0, graded: true, baselineHistory: [{ score: 1.5, timestamp: '2025-05-01T00:00:00Z', source: 'diagnostic-estimate' }] },
  { id: 'tool-selection', name: 'Tool Selection', description: 'Deliberate mental model for when each tool wins and why', target: 3.8, graded: true, baselineHistory: [{ score: 2.0, timestamp: '2025-05-01T00:00:00Z', source: 'diagnostic-estimate' }] },
  { id: 'failure-diagnosis', name: 'Failure Diagnosis', description: 'Narrate what went wrong without outsourcing the thinking', target: 3.5, graded: true, baselineHistory: [{ score: 2.0, timestamp: '2025-05-01T00:00:00Z', source: 'diagnostic-estimate' }] },
  { id: 'multi-agent-orchestration', name: 'Multi-Agent Orchestration', description: 'State management, routing logic, session persistence, escalation handling', target: 3.5, graded: true, baselineHistory: [{ score: 1.0, timestamp: '2025-05-01T00:00:00Z', source: 'diagnostic-estimate' }] },
  { id: 'business-value-translation', name: 'Business Value Translation', description: 'Move from capability to a board-ready value thesis', target: 4.3, graded: true, baselineHistory: [{ score: 3.0, timestamp: '2025-05-01T00:00:00Z', source: 'diagnostic-estimate' }] },
]

// ---------------------------------------------------------------------------
// Type guards / parsing
// ---------------------------------------------------------------------------

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function isEvidenceWeight(value: unknown): value is EvidenceWeight {
  return typeof value === 'string' && value in EVIDENCE_WEIGHTS
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

function isExerciseEntry(value: unknown): value is ExerciseEntry {
  return (
    isRecord(value) &&
    typeof value.id === 'string' &&
    typeof value.domainId === 'string' &&
    (value.mode === 'quick' || value.mode === 'full') &&
    (value.score === undefined || typeof value.score === 'number') &&
    (value.selfRating === undefined || typeof value.selfRating === 'number') &&
    isEvidenceWeight(value.evidenceWeight) &&
    typeof value.timestamp === 'string'
  )
}

/**
 * Parse a JSON file's content as an array, keeping only entries that pass
 * the guard. Returns null when the content is missing or not a valid array
 * (caller supplies defaults).
 */
function parseArray<T>(
  content: string | null,
  guard: (value: unknown) => value is T,
): T[] | null {
  if (content === null) return null
  try {
    const parsed: unknown = JSON.parse(content)
    if (!Array.isArray(parsed)) return null
    return parsed.filter(guard)
  } catch {
    return null
  }
}

function parseMeta(content: string | null): Record<string, unknown> {
  if (content === null) return {}
  try {
    const parsed: unknown = JSON.parse(content)
    return isRecord(parsed) ? parsed : {}
  } catch {
    return {}
  }
}

// ---------------------------------------------------------------------------
// Radar score computation
// ---------------------------------------------------------------------------

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value))
}

function round2(value: number): number {
  return Math.round(value * 100) / 100
}

/** Most recent baseline score for a domain, or null if no history. */
function latestBaseline(domain: Domain): number | null {
  if (domain.baselineHistory.length === 0) return null
  let latest = domain.baselineHistory[0]
  for (const entry of domain.baselineHistory) {
    if (Date.parse(entry.timestamp) > Date.parse(latest.timestamp)) {
      latest = entry
    }
  }
  return latest.score
}

/** The numeric score an exercise entry contributes as evidence. */
function evidenceScore(entry: ExerciseEntry): number | null {
  if (typeof entry.score === 'number') return entry.score
  if (typeof entry.selfRating === 'number') return entry.selfRating
  return null
}

/**
 * Compute the current radar score per domain:
 * weighted average of all evidence entries, blended 30/70 with the most
 * recent baseline, clamped to [1.0, 5.0]. Falls back to the baseline when
 * a domain has no evidence yet.
 */
export function computeRadarScores(
  domains: Domain[],
  exerciseLog: ExerciseEntry[],
): Record<string, number> {
  const scores: Record<string, number> = {}

  for (const domain of domains) {
    const baseline = latestBaseline(domain)

    let weightedSum = 0
    let weightTotal = 0
    for (const entry of exerciseLog) {
      if (entry.domainId !== domain.id) continue
      const score = evidenceScore(entry)
      if (score === null) continue
      const weight = EVIDENCE_WEIGHTS[entry.evidenceWeight]
      weightedSum += score * weight
      weightTotal += weight
    }

    let current: number
    if (weightTotal === 0) {
      current = baseline ?? SCORE_MIN
    } else {
      const evidenceAverage = weightedSum / weightTotal
      current =
        baseline === null
          ? evidenceAverage
          : BASELINE_BLEND * baseline + EVIDENCE_BLEND * evidenceAverage
    }

    scores[domain.id] = round2(clamp(current, SCORE_MIN, SCORE_MAX))
  }

  return scores
}

// ---------------------------------------------------------------------------
// Stats + recent activity
// ---------------------------------------------------------------------------

function computeStats(
  domains: Domain[],
  exerciseLog: ExerciseEntry[],
  radarScores: Record<string, number>,
): AppState['stats'] {
  const now = Date.now()

  // Sessions this week: distinct UTC days with activity in the last 7 days.
  const sessionDays = new Set<string>()
  for (const entry of exerciseLog) {
    const time = Date.parse(entry.timestamp)
    if (Number.isFinite(time) && now - time <= WEEK_MS && time <= now) {
      sessionDays.add(entry.timestamp.slice(0, 10))
    }
  }

  let domainsImproved = 0
  for (const domain of domains) {
    const baseline = latestBaseline(domain)
    const current = radarScores[domain.id]
    if (baseline !== null && current !== undefined && current > baseline + 1e-9) {
      domainsImproved++
    }
  }

  let ratingSum = 0
  let ratingCount = 0
  for (const entry of exerciseLog) {
    if (entry.mode === 'full' && typeof entry.selfRating === 'number') {
      ratingSum += entry.selfRating
      ratingCount++
    }
  }

  return {
    exercisesDone: exerciseLog.length,
    sessionsThisWeek: sessionDays.size,
    domainsImproved,
    averageRating: ratingCount === 0 ? 0 : round2(ratingSum / ratingCount),
  }
}

function recentActivity(exerciseLog: ExerciseEntry[]): ActivityEntry[] {
  return [...exerciseLog]
    .sort((a, b) => Date.parse(b.timestamp) - Date.parse(a.timestamp))
    .slice(0, RECENT_ACTIVITY_LIMIT)
    .map((entry) => ({
      id: entry.id,
      domainId: entry.domainId,
      mode: entry.mode,
      timestamp: entry.timestamp,
      ...(entry.score !== undefined ? { score: entry.score } : {}),
    }))
}

// ---------------------------------------------------------------------------
// Handler
// ---------------------------------------------------------------------------

export const onRequestGet: PagesFunction<Env> = async ({ request, env }) => {
  if (!(await isAuthenticated(request, env))) {
    return unauthorizedResponse()
  }

  try {
    const [domainsFile, logFile, metaFile] = await Promise.all([
      readFile(env, userPath(env, 'domains.json')),
      readFile(env, userPath(env, 'exercise-log.json')),
      readFile(env, userPath(env, 'meta.json')),
    ])

    const domains =
      parseArray(domainsFile?.content ?? null, isDomain) ?? DEFAULT_DOMAINS
    const exerciseLog =
      parseArray(logFile?.content ?? null, isExerciseEntry) ?? []
    const meta = parseMeta(metaFile?.content ?? null)

    const radarScores = computeRadarScores(domains, exerciseLog)

    const state: AppState = {
      domains,
      radarScores,
      stats: computeStats(domains, exerciseLog, radarScores),
      recentActivity: recentActivity(exerciseLog),
      meta,
    }

    return jsonResponse(state)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    return jsonResponse({ error: `Failed to load state: ${message}` }, 500)
  }
}
