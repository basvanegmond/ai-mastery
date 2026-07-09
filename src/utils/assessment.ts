import { scoreToGrade } from './domains'
import type { AssessmentQuestion } from '../data/assessment'

const SCORE_MIN = 1.3
const SCORE_MAX = 4.1

const LEVEL_BY_GRADE: Record<string, string> = {
  D: 'Beginner',
  C: 'Developing',
  B: 'Practising',
  A: 'Advanced',
  'A+': 'Expert',
}

export function scoreFromCorrectCount(correctCount: number, total: number): number {
  if (total === 0) return SCORE_MIN
  const ratio = correctCount / total
  return Math.round((SCORE_MIN + ratio * (SCORE_MAX - SCORE_MIN)) * 10) / 10
}

export function levelForScore(score: number): string {
  return LEVEL_BY_GRADE[scoreToGrade(score)] ?? 'Developing'
}

export interface AnsweredQuestion {
  question: AssessmentQuestion
  correct: boolean
}

/**
 * Builds the domain-summary insight from whichever questions were missed.
 * Falls back to the mastery insight when everything was answered correctly.
 */
export function buildDomainInsight(
  answered: AnsweredQuestion[],
  masteryInsight: string,
): string {
  const missed = answered.filter((a) => !a.correct)
  if (missed.length === 0) return masteryInsight
  if (missed.length === 1) return missed[0]!.question.missInsight
  // Two or more misses: combine the first two rather than showing every one.
  return `${missed[0]!.question.missInsight} ${missed[1]!.question.missInsight}`
}

const FOCUS_REASONS = [
  'Your weakest area relative to everything else. Getting better here tends to make other domains click faster.',
  'Second-lowest score overall. Worth prioritizing once the first is underway.',
  'Rounds out your top three gaps — not urgent, but on the list.',
]

export interface FocusItem {
  domainId: string
  domainName: string
  reason: string
}

/** Ranks domains by score ascending and returns the 3 weakest as a focus plan. */
export function buildFocusPlan(
  domains: Array<{ id: string; name: string }>,
  scores: Record<string, number>,
): FocusItem[] {
  return [...domains]
    .sort((a, b) => (scores[a.id] ?? 0) - (scores[b.id] ?? 0))
    .slice(0, 3)
    .map((d, i) => ({
      domainId: d.id,
      domainName: d.name,
      reason: FOCUS_REASONS[i] ?? '',
    }))
}
