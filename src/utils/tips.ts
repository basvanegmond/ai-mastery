import type { Domain, Tip, TipLevel } from '../types'
import tipsData from '../data/tips.json'

const ALL_TIPS = (tipsData as { tips: Tip[] }).tips

const LEVEL_ORDER: TipLevel[] = ['beginner', 'mid', 'senior', 'complex']
const WEAK_DOMAIN_COUNT = 3

function levelForScore(score: number): TipLevel {
  if (score < 3.0) return 'beginner'
  if (score < 4.0) return 'mid'
  if (score < 4.3) return 'senior'
  return 'complex'
}

function stretchLevel(level: TipLevel): TipLevel {
  const next = LEVEL_ORDER.indexOf(level) + 1
  return LEVEL_ORDER[Math.min(next, LEVEL_ORDER.length - 1)]!
}

/**
 * Picks tips weighted toward the user's weakest graded domains, one level
 * above their current grade in each — a stretch tip, not a repeat of what
 * they already know. Falls back to the full library when there isn't
 * enough state yet (e.g. no exercises logged) to personalize.
 */
export function selectTips(
  domains: Domain[],
  radarScores: Record<string, number>,
): Tip[] {
  const graded = domains.filter((d) => d.graded && radarScores[d.id] !== undefined)
  if (graded.length === 0) return ALL_TIPS

  const weakest = [...graded]
    .sort((a, b) => (radarScores[a.id] ?? 0) - (radarScores[b.id] ?? 0))
    .slice(0, WEAK_DOMAIN_COUNT)

  const targets = new Map(
    weakest.map((d) => [d.id, stretchLevel(levelForScore(radarScores[d.id] ?? 0))]),
  )

  const matched = ALL_TIPS.filter((tip) => targets.get(tip.domain) === tip.level)
  if (matched.length >= 3) return matched

  // Not enough exact-level matches — widen to any level within the weak domains.
  const domainOnly = ALL_TIPS.filter((tip) => targets.has(tip.domain))
  return domainOnly.length >= 3 ? domainOnly : ALL_TIPS
}
