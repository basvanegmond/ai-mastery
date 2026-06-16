import { DOMAINS, MAX_SCORE } from '../../lib/domains'
import type { MasteryData } from '../../types'

interface RadarChartProps {
  domainProgress: MasteryData['domainProgress']
  size?: number
}

const CENTER = 50
const RADIUS = 38
const RINGS = [1, 2, 3, 4, 4.3]
const RING_LABELS = ['D', 'C', 'B', 'A', 'A+']

function scoreToR(score: number): number {
  return (score / MAX_SCORE) * RADIUS
}

function domainPoint(index: number, total: number, r: number): [number, number] {
  const angle = (index / total) * 2 * Math.PI - Math.PI / 2
  return [CENTER + r * Math.cos(angle), CENTER + r * Math.sin(angle)]
}

function polygonPoints(values: number[]): string {
  return values
    .map((v, i) => {
      const [x, y] = domainPoint(i, values.length, scoreToR(v))
      return `${x},${y}`
    })
    .join(' ')
}

export function RadarChart({ domainProgress, size = 280 }: RadarChartProps) {
  const n = DOMAINS.length

  const baselineValues = DOMAINS.map((d) => d.baseline)
  const targetValues = DOMAINS.map((d) => d.target)
  const currentValues = DOMAINS.map((d) => domainProgress[d.key]?.currentLevel ?? d.baseline)

  return (
    <svg
      viewBox="0 0 100 100"
      width={size}
      height={size}
      style={{ overflow: 'visible' }}
    >
      {/* Concentric rings */}
      {RINGS.map((score, ri) => {
        const r = scoreToR(score)
        const isTarget = RING_LABELS[ri] === 'A'
        const ringPoints = Array.from({ length: n }, (_, i) =>
          domainPoint(i, n, r)
        )
          .map(([x, y]) => `${x},${y}`)
          .join(' ')

        return (
          <polygon
            key={ri}
            points={ringPoints}
            fill="none"
            stroke={isTarget ? 'rgba(108,142,191,0.5)' : 'var(--radar-grid)'}
            strokeWidth={isTarget ? '0.5' : '0.3'}
            strokeDasharray={isTarget ? '1,1' : undefined}
          />
        )
      })}

      {/* Axis lines */}
      {DOMAINS.map((_, i) => {
        const [x, y] = domainPoint(i, n, RADIUS)
        return (
          <line
            key={i}
            x1={CENTER}
            y1={CENTER}
            x2={x}
            y2={y}
            stroke="var(--radar-axis)"
            strokeWidth="0.3"
          />
        )
      })}

      {/* Baseline polygon */}
      <polygon
        points={polygonPoints(baselineValues)}
        fill="var(--radar-baseline-fill)"
        stroke="var(--radar-baseline-stroke)"
        strokeWidth="0.5"
        strokeDasharray="1.5,1"
      />

      {/* Target polygon */}
      <polygon
        points={polygonPoints(targetValues)}
        fill="rgba(108,142,191,0.06)"
        stroke="rgba(108,142,191,0.5)"
        strokeWidth="0.5"
        strokeDasharray="1.5,1"
      />

      {/* Current polygon */}
      <polygon
        points={polygonPoints(currentValues)}
        fill="var(--radar-current-fill)"
        stroke="var(--radar-current-stroke)"
        strokeWidth="0.8"
      />

      {/* Domain labels */}
      {DOMAINS.map((d, i) => {
        const r = RADIUS + 7
        const [x, y] = domainPoint(i, n, r)
        return (
          <text
            key={d.key}
            x={x}
            y={y}
            textAnchor="middle"
            dominantBaseline="middle"
            fontSize="3.8"
            fill="var(--radar-label)"
            style={{ fontFamily: 'DM Mono, monospace' }}
          >
            {d.shortLabel}
          </text>
        )
      })}

      {/* Ring labels (right side) */}
      {RINGS.map((score, ri) => {
        const r = scoreToR(score)
        const isTarget = RING_LABELS[ri] === 'A'
        return (
          <text
            key={ri}
            x={CENTER + r + 0.5}
            y={CENTER}
            fontSize="3"
            fill={isTarget ? 'rgba(108,142,191,0.8)' : 'var(--radar-legend)'}
            dominantBaseline="middle"
            style={{ fontFamily: 'DM Mono, monospace' }}
          >
            {RING_LABELS[ri]}
          </text>
        )
      })}

      {/* Legend */}
      <g transform="translate(2, 92)">
        <line x1="0" y1="0" x2="5" y2="0" stroke="var(--radar-baseline-stroke)" strokeWidth="0.5" strokeDasharray="1.5,1"/>
        <text x="6" y="0" fontSize="2.5" fill="var(--radar-legend)" dominantBaseline="middle" style={{ fontFamily: 'DM Mono, monospace' }}>baseline</text>
        <line x1="20" y1="0" x2="25" y2="0" stroke="rgba(108,142,191,0.6)" strokeWidth="0.5" strokeDasharray="1.5,1"/>
        <text x="26" y="0" fontSize="2.5" fill="var(--radar-legend)" dominantBaseline="middle" style={{ fontFamily: 'DM Mono, monospace' }}>target</text>
        <line x1="41" y1="0" x2="46" y2="0" stroke="var(--radar-current-stroke)" strokeWidth="0.8"/>
        <text x="47" y="0" fontSize="2.5" fill="var(--radar-legend)" dominantBaseline="middle" style={{ fontFamily: 'DM Mono, monospace' }}>current</text>
      </g>
    </svg>
  )
}
