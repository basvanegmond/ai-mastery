import type { Domain } from '../types'

interface RadarChartProps {
  domains: Domain[]
  radarScores: Record<string, number>
}

const SIZE = 280
const CENTER = 140
const MAX_RADIUS = 110
const LABEL_RADIUS = 126
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

// Short domain name for radar labels
function shortName(name: string): string {
  const map: Record<string, string> = {
    'Prompt Construction': 'Prompts',
    'Context Engineering': 'Context',
    'Output Evaluation': 'Evaluation',
    'Failure Diagnosis': 'Diagnosis',
    'Tool Selection': 'Tools',
    'Agentic Architecture': 'Architecture',
    'Multi-Agent Orchestration': 'Orchestration',
    'Business Value Translation': 'Biz Value',
  }
  return map[name] ?? name.split(' ').slice(0, 1).join(' ')
}

export function RadarChart({ domains, radarScores }: RadarChartProps): JSX.Element {
  if (domains.length === 0) {
    return <p className="text-sm text-ink-sub">No graded domains yet.</p>
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
      className="w-full"
      role="img"
      aria-label="Radar chart of current, baseline, and target scores per domain"
    >
      {/* Reference rings */}
      {rings.map((ring) => (
        <polygon
          key={ring}
          points={polygonPoints(domains.map(() => ring))}
          fill="none"
          stroke="#E4E4EF"
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
            stroke="#E4E4EF"
            strokeWidth={1}
          />
        )
      })}

      {/* Baseline (dashed gray) */}
      <polygon
        points={polygonPoints(baselineScores)}
        fill="none"
        stroke="#9B9BB0"
        strokeWidth={1.5}
        strokeDasharray="4 3"
      />

      {/* Target (dashed, lighter trypan blue) */}
      {hasAllTargets && (
        <polygon
          points={polygonPoints(targets as number[])}
          fill="none"
          stroke="#7C87E8"
          strokeWidth={1.5}
          strokeDasharray="4 3"
        />
      )}

      {/* Current (solid trypan blue) */}
      <polygon
        points={polygonPoints(currentScores)}
        fill="rgba(37, 99, 235, 0.10)"
        stroke="#2563EB"
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
            fontSize={8}
            fill="#6B6B8A"
            fontFamily="Inter, system-ui, sans-serif"
          >
            {shortName(domain.name)}
          </text>
        )
      })}
    </svg>
  )
}
