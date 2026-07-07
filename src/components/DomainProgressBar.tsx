import type { Domain } from '../types'

interface DomainProgressBarProps {
  domain: Domain
  currentScore: number
}

const MAX_SCORE = 5

function toPercent(score: number): number {
  return (Math.max(0, Math.min(MAX_SCORE, score)) / MAX_SCORE) * 100
}

export function DomainProgressBar({
  domain,
  currentScore,
}: DomainProgressBarProps): JSX.Element {
  const target = domain.target
  const atTarget = target !== null && currentScore >= target
  const fillClass = atTarget ? 'bg-emerald-500' : 'bg-amber-500'

  return (
    <div>
      <div className="flex items-baseline justify-between">
        <span className="text-sm font-medium text-gray-900">{domain.name}</span>
        <span className="text-sm text-gray-600">
          {currentScore.toFixed(1)}
          {target !== null && (
            <span className="text-gray-400"> / target {target.toFixed(1)}</span>
          )}
        </span>
      </div>
      <div className="relative mt-1 h-2 w-full rounded-full bg-gray-200">
        <div
          className={`h-2 rounded-full ${fillClass}`}
          style={{ width: `${toPercent(currentScore)}%` }}
        />
        {target !== null && (
          <div
            className="absolute top-1/2 h-3 w-0.5 -translate-y-1/2 bg-emerald-600"
            style={{ left: `${toPercent(target)}%` }}
            title={`Target: ${target.toFixed(1)}`}
          />
        )}
      </div>
    </div>
  )
}
