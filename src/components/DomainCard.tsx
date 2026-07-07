import type { Domain } from '../types'
import { getDomainColor, scoreToGrade } from '../utils/domains'

interface DomainCardProps {
  domain: Domain
  currentScore: number
  activityThisWeek: number
}

const MAX = 5
const TICKS = [0, 1, 2, 3, 4, 5]

export function DomainCard({ domain, currentScore, activityThisWeek }: DomainCardProps): JSX.Element {
  const color = getDomainColor(domain.id)
  const grade = scoreToGrade(currentScore)
  const fillPct = (Math.max(0, Math.min(MAX, currentScore)) / MAX) * 100
  const targetPct = domain.target !== null ? (Math.max(0, Math.min(MAX, domain.target)) / MAX) * 100 : null
  const sub = activityThisWeek === 0
    ? 'no exercises this week'
    : `${activityThisWeek} exercise${activityThisWeek === 1 ? '' : 's'} this week`

  return (
    <div className="rounded-xl bg-white p-4">
      <div className="flex items-start justify-between gap-2 mb-3">
        <div className="min-w-0">
          <h3 className="text-[14px] font-semibold leading-snug text-ink truncate">{domain.name}</h3>
          <p className="text-[11px] text-ink-sub mt-0.5">{sub}</p>
        </div>
        <div className="text-right shrink-0">
          <div className="font-display text-[22px] font-semibold leading-none" style={{ color }}>
            {grade}
          </div>
          <div className="text-[12px] font-medium mt-0.5" style={{ color }}>
            {currentScore.toFixed(1)}
          </div>
        </div>
      </div>

      <div className="relative h-[5px] bg-edge rounded-full">
        <div
          className="absolute inset-y-0 left-0 rounded-full transition-all duration-500"
          style={{ width: `${fillPct}%`, backgroundColor: color }}
        />
        {targetPct !== null && (
          <div
            className="absolute top-[-3px] bottom-[-3px] w-[2px] rounded-full"
            style={{ left: `${targetPct}%`, backgroundColor: '#9B9BB0' }}
            title={`Target: ${domain.target?.toFixed(1) ?? ''}`}
          />
        )}
      </div>

      <div className="flex justify-between mt-1">
        {TICKS.map((n) => (
          <span key={n} className="text-[9px] text-ink-sub opacity-50 leading-none">{n}</span>
        ))}
      </div>
    </div>
  )
}
