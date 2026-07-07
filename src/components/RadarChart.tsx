import type { Domain } from '../types'

interface RadarChartProps {
  domains: Domain[]
  radarScores: Record<string, number>
}

const SIZE = 320
const CENTER = 160
const MAX_RADIUS = 130
const LABEL_RADIUS = 145
const MAX_SCORE = 5

function polarToCart(
  angle: number,
  radius: number,
  cx: number,
  cy: number,
): { x: number; y: number } {
  const rad = (angle - 90) * (Math.PI / 180)
  return { x: cx + radius * Math.cos(rad), y: cy + radius * Math.sin(rad) }
}

function scoreToRadius(score: number): number {
  return (Math.max(0, Math.min(MAX_SCORE, score)) / MAX_SCORE) * MAX_RADIUS
}

/** SVG points string for one polygon: a score per domain, vertices clockwise from top. */
function polygonPoints(scores: number[]): string {
  const step = 360 / scores.length
  return scores
    .map((score, i) => {
      const { x, y } = polarToCart(i * step, scoreToRadius(score), CENTER, CENTER)
      return `${x.toFixed(2)},${y.toFixed(2)}`
    })
    .join(' ')
}

function latestBaseline(domain: Domain): number {
  if (domain.baselineHistory.length === 0) return 0
  let latest = domain.baselineHistory[0]
  for (const entry of domain.baselineHistory) {
    if (Date.parse(entry.timestamp) > Date.parse(latest.timestamp)) {
      latest = entry
    }
  }
  return latest.score
}

function labelAnchor(x: number): 'start' | 'middle' | 'end' {
  if (x < CENTER - 10) return 'end'
  if (x > CENTER + 10) return 'start'
  return 'middle'
}

export function RadarChart({ domains, radarScores }: RadarChartProps): JSX.Element {
  if (domains.length === 0) {
    return <p className="text-sm text-gray-500">No graded domains yet.</p>
  }

  const step = 360 / domains.length
  const rings = [1, 2, 3, 4, 5]

  const baselineScores = domains.map(latestBaseline)
  const currentScores = domains.map((d) => radarScores[d.id] ?? 0)
  const targets = domains.map((d) => d.target)
  const hasAllTargets = targets.every((t): t is number => t !== null)

  return (
    <svg
      viewBox={`0 0 ${SIZE} ${SIZE}`}
      className="mx-auto w-full max-w-sm"
      role="img"
      aria-label="Radar chart of current, baseline, and target scores per domain"
    >
      {/* Concentric reference rings at scores 1–5 */}
      {rings.map((ring) => (
        <polygon
          key={ring}
          points={polygonPoints(domains.map(() => ring))}
          fill="none"
          stroke="#e5e7eb"
          strokeWidth={1}
        />
      ))}

      {/* Spokes */}
      {domains.map((domain, i) => {
        const end = polarToCart(i * step, MAX_RADIUS, CENTER, CENTER)
        return (
          <line
            key={domain.id}
            x1={CENTER}
            y1={CENTER}
            x2={end.x}
            y2={end.y}
            stroke="#e5e7eb"
            strokeWidth={1}
          />
        )
      })}

      {/* Baseline (dashed gray) */}
      <polygon
        points={polygonPoints(baselineScores)}
        fill="none"
        stroke="#9ca3af"
        strokeWidth={1.5}
        strokeDasharray="4 3"
      />

      {/* Target (dashed emerald) */}
      {hasAllTargets && (
        <polygon
          points={polygonPoints(targets)}
          fill="none"
          stroke="#10b981"
          strokeWidth={1.5}
          strokeDasharray="4 3"
        />
      )}

      {/* Current (solid amber) */}
      <polygon
        points={polygonPoints(currentScores)}
        fill="rgba(245, 158, 11, 0.15)"
        stroke="#f59e0b"
        strokeWidth={2}
      />

      {/* Domain labels */}
      {domains.map((domain, i) => {
        const pos = polarToCart(i * step, LABEL_RADIUS, CENTER, CENTER)
        return (
          <text
            key={domain.id}
            x={pos.x}
            y={pos.y}
            textAnchor={labelAnchor(pos.x)}
            dominantBaseline="middle"
            fontSize={9}
            fill="#4b5563"
          >
            {domain.name}
          </text>
        )
      })}
    </svg>
  )
}
